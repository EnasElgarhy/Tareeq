-- Paid invitation kind: the recipient pays as a normal user.
--
-- Invites now carry `kind`: `free` unlocks the report without payment (existing
-- behavior); `paid` grants nothing and consumes nothing — redeeming it only
-- verifies the token/email and routes the recipient into the normal flow
-- (take the assessment, pay through the standard paywall). Sharing a paid link
-- is harmless: no access changes hands, so paid invites stay reusable until
-- they expire or are revoked.
--
-- Additive and idempotent: runs against a live shared database.

alter table public.report_access_invites
  add column if not exists kind text not null default 'free'
    constraint report_access_invites_kind_check check (kind in ('free', 'paid'));

create or replace function public.redeem_report_access_invite(p_token_hash text, p_user_id uuid, p_user_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.report_access_invites%rowtype;
  v_assessment_id uuid;
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

  -- Revoked: one generic answer so token probing learns nothing.
  if v_invite.status = 'revoked' then
    return jsonb_build_object('ok', false, 'code', 'invalid_token');
  end if;

  if v_invite.email is not null then
    -- Email-bound flavor: the session email must match the invited address.
    -- Comparison is case-insensitive; stored emails are normalized lowercase.
    if p_user_email is null or lower(p_user_email) <> v_invite.email then
      return jsonb_build_object('ok', false, 'code', 'invalid_token');
    end if;
    -- The recipient may have had no account at creation: resolve their latest
    -- completed assessment, if any. Paid links route to the assessment when
    -- there is nothing finished yet.
    select id into v_assessment_id
    from public.assessments
    where user_id = p_user_id and completed_at is not null
    order by completed_at desc
    limit 1;
  else
    -- Bound flavor: the invite names its (user, assessment) pair.
    if v_invite.user_id <> p_user_id then
      return jsonb_build_object('ok', false, 'code', 'invalid_token');
    end if;
    v_assessment_id := v_invite.assessment_id;

    select user_id, completed_at
      into v_assessment_user_id, v_assessment_completed_at
    from public.assessments
    where id = v_assessment_id;

    if not found or v_assessment_user_id <> p_user_id then
      return jsonb_build_object('ok', false, 'code', 'invalid_token');
    end if;

    if v_assessment_completed_at is null then
      return jsonb_build_object('ok', false, 'code', 'assessment_incomplete');
    end if;
  end if;

  if v_invite.expires_at < now() then
    return jsonb_build_object('ok', false, 'code', 'invite_expired');
  end if;

  -- Paid invites grant nothing and consume nothing: verified recipients pay
  -- through the normal flow. The invite stays pending (reusable) until it
  -- expires or an admin revokes it.
  if coalesce(v_invite.kind, 'free') = 'paid' then
    return jsonb_build_object('ok', false, 'code', 'payment_required', 'assessment_id', v_assessment_id);
  end if;

  -- Free invites need something to unlock; otherwise wait for completion.
  if v_assessment_id is null then
    return jsonb_build_object('ok', false, 'code', 'assessment_incomplete');
  end if;

  if v_invite.status = 'redeemed' then
    select status into v_existing_status
    from public.report_entitlements
    where user_id = p_user_id and assessment_id = v_assessment_id;
    if found and v_existing_status = 'active' then
      return jsonb_build_object('ok', true, 'assessment_id', v_assessment_id, 'already_owned', true);
    end if;
    return jsonb_build_object('ok', false, 'code', 'already_redeemed');
  end if;

  if v_invite.status <> 'pending' then
    return jsonb_build_object('ok', false, 'code', 'invalid_token');
  end if;

  -- Existing row (locked): active means already unlocked, revoked means
  -- reactivate as a free grant instead of duplicating under the unique key.
  select status into v_existing_status
  from public.report_entitlements
  where user_id = p_user_id and assessment_id = v_assessment_id
  for update;

  if found and v_existing_status = 'active' then
    update public.report_access_invites
    set status = 'redeemed', redeemed_at = now()
    where id = v_invite.id and status = 'pending';
    return jsonb_build_object('ok', true, 'assessment_id', v_assessment_id, 'already_owned', true);
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
    where user_id = p_user_id and assessment_id = v_assessment_id;
  else
    begin
      insert into public.report_entitlements
        (user_id, assessment_id, status, source, granted_by, granted_invite_id)
      values
        (p_user_id, v_assessment_id, 'active', 'admin_grant', v_invite.created_by, v_invite.id);
    exception when unique_violation then
      -- Lost a race with the Stripe webhook (a payment completed between our
      -- lock and insert). The paid row stands; consume the invite as owned.
      update public.report_access_invites
      set status = 'redeemed', redeemed_at = now()
      where id = v_invite.id and status = 'pending';
      return jsonb_build_object('ok', true, 'assessment_id', v_assessment_id, 'already_owned', true);
    end;
  end if;

  update public.report_access_invites
  set status = 'redeemed', redeemed_at = now()
  where id = v_invite.id and status = 'pending';

  return jsonb_build_object('ok', true, 'assessment_id', v_assessment_id, 'already_owned', false);
end;
$$;

-- Preserve the locked-down execution model on replace.
revoke all on function public.redeem_report_access_invite(text, uuid, text) from public, anon, authenticated;
grant execute on function public.redeem_report_access_invite(text, uuid, text) to service_role;

notify pgrst, 'reload schema';
