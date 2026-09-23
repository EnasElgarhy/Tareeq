-- Atomic free-access redemption.
--
-- PostgREST (and therefore Supabase-JS) cannot span a transaction across
-- statements, so the read-validate-write sequence for invite redemption lives
-- here in a single function call: one call = one transaction = atomic.
-- Concurrent redeems of the same token serialize on the FOR UPDATE row lock;
-- the loser sees the winner's `redeemed` status and gets a deterministic
-- answer instead of a second grant.
--
-- The upsert race with the Stripe webhook (a payment completing for the same
-- (user, assessment) mid-redeem) resolves safely: a unique_violation means a
-- row now exists, so the invite is consumed as already-owned and the paid row
-- is never overwritten.
--
-- Called with the service-role client only. EXECUTE is revoked from
-- anon/authenticated as belt and braces (service_role is unaffected).
-- Additive and idempotent: runs against a live shared database.

create or replace function public.redeem_report_access_invite(p_token_hash text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.report_access_invites%rowtype;
  v_assessment_user_id uuid;
  v_assessment_completed_at timestamptz;
  v_existing_status text;
begin
  if p_token_hash is null or p_user_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_token');
  end if;

  select * into v_invite
  from public.report_access_invites
  where token_hash = p_token_hash
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'invalid_token');
  end if;

  -- Revoked, foreign, or otherwise unusable: one generic answer so token
  -- probing learns nothing about which tokens exist.
  if v_invite.status = 'revoked' or v_invite.user_id <> p_user_id then
    return jsonb_build_object('ok', false, 'code', 'invalid_token');
  end if;

  if v_invite.status = 'redeemed' then
    select status into v_existing_status
    from public.report_entitlements
    where user_id = p_user_id and assessment_id = v_invite.assessment_id;
    if found and v_existing_status = 'active' then
      return jsonb_build_object('ok', true, 'assessment_id', v_invite.assessment_id, 'already_owned', true);
    end if;
    return jsonb_build_object('ok', false, 'code', 'already_redeemed');
  end if;

  if v_invite.status <> 'pending' then
    return jsonb_build_object('ok', false, 'code', 'invalid_token');
  end if;

  if v_invite.expires_at < now() then
    return jsonb_build_object('ok', false, 'code', 'invite_expired');
  end if;

  select user_id, completed_at
    into v_assessment_user_id, v_assessment_completed_at
  from public.assessments
  where id = v_invite.assessment_id;

  if not found or v_assessment_user_id <> p_user_id then
    return jsonb_build_object('ok', false, 'code', 'invalid_token');
  end if;

  if v_assessment_completed_at is null then
    return jsonb_build_object('ok', false, 'code', 'assessment_incomplete');
  end if;

  -- Existing row (locked): active means already unlocked, revoked means
  -- reactivate as a free grant instead of duplicating under the unique key.
  select status into v_existing_status
  from public.report_entitlements
  where user_id = p_user_id and assessment_id = v_invite.assessment_id
  for update;

  if found and v_existing_status = 'active' then
    update public.report_access_invites
    set status = 'redeemed', redeemed_at = now()
    where id = v_invite.id and status = 'pending';
    return jsonb_build_object('ok', true, 'assessment_id', v_invite.assessment_id, 'already_owned', true);
  elsif found then
    update public.report_entitlements
    set status = 'active',
        revoked_at = null,
        source = 'admin_grant',
        granted_by = v_invite.created_by,
        granted_invite_id = v_invite.id,
        stripe_session_id = null,
        stripe_payment_intent_id = null,
        amount_minor = null,
        currency = null
    where user_id = p_user_id and assessment_id = v_invite.assessment_id;
  else
    begin
      insert into public.report_entitlements
        (user_id, assessment_id, status, source, granted_by, granted_invite_id)
      values
        (p_user_id, v_invite.assessment_id, 'active', 'admin_grant', v_invite.created_by, v_invite.id);
    exception when unique_violation then
      -- Lost a race with the Stripe webhook: a paid row now owns this
      -- (user, assessment). It stands; the invite is consumed as owned.
      update public.report_access_invites
      set status = 'redeemed', redeemed_at = now()
      where id = v_invite.id and status = 'pending';
      return jsonb_build_object('ok', true, 'assessment_id', v_invite.assessment_id, 'already_owned', true);
    end;
  end if;

  update public.report_access_invites
  set status = 'redeemed', redeemed_at = now()
  where id = v_invite.id and status = 'pending';

  return jsonb_build_object('ok', true, 'assessment_id', v_invite.assessment_id, 'already_owned', false);
end;
$$;

revoke all on function public.redeem_report_access_invite(text, uuid) from public, anon, authenticated;
-- REVOKE FROM PUBLIC also strips service_role, which is the only legitimate
-- caller (the app server). Restore it explicitly.
grant execute on function public.redeem_report_access_invite(text, uuid) to service_role;

-- Defense in depth for the invites table: RLS already denies anon/
-- authenticated (no policies), and this removes the nominal grants as well so
-- access is possible only through the service role. The owner (postgres) and
-- existing table grants are unaffected.
revoke all on public.report_access_invites from public, anon, authenticated;
grant all on public.report_access_invites to service_role;
grant all on public.report_entitlements to service_role;

-- Close the hygiene gap left by 202609210001: validate the entitlement→invite FK.
alter table public.report_entitlements validate constraint report_access_invites_entitlement_fk;

notify pgrst, 'reload schema';
