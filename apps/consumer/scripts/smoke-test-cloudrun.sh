#!/usr/bin/env bash
# Post-deploy smoke tests for the temporary Cloud Run staging setup.
# See docs/deployment/CLOUD_RUN_DEPLOYMENT.md §7.
#
# Usage:
#   ./scripts/smoke-test-cloudrun.sh --app consumer --url https://tareeq-consumer-staging-xxx.a.run.app
#   ./scripts/smoke-test-cloudrun.sh --app admin --url https://tareeq-admin-staging-xxx.a.run.app
#
# Exits non-zero if any check fails, so it can gate a GitHub Actions job.
set -uo pipefail

APP=""
URL=""

while [ $# -gt 0 ]; do
  case "$1" in
    --app) APP="$2"; shift 2 ;;
    --url) URL="${2%/}"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ "$APP" != "consumer" ] && [ "$APP" != "admin" ]; then
  echo "Usage: $0 --app consumer|admin --url <base-url>" >&2
  exit 2
fi
if [ -z "$URL" ]; then
  echo "Usage: $0 --app consumer|admin --url <base-url>" >&2
  exit 2
fi

FAILURES=0

# check NAME METHOD PATH EXPECTED_MAX_STATUS BODY
# EXPECTED_MAX_STATUS: pass if the actual status is <= this (e.g. 499 means
# "any non-5xx is fine" — used for routes we can't send a fully valid,
# authenticated payload to, where the point is just "the route executed
# without the server itself falling over", not full functional correctness.
check() {
  local name="$1" method="$2" path="$3" max_status="$4" body="${5:-}"
  local url="${URL}${path}"
  local status attempt

  # Up to 3 tries — Cloud Run's min-instances=0 means the first request
  # after an idle period pays a cold-start penalty; --max-time 30 should
  # already cover that, but a couple of retries absorbs any transient
  # 000 (connection-not-established-yet) blip without masking a real failure.
  for attempt in 1 2 3; do
    if [ -n "$body" ]; then
      status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
        -H "Content-Type: application/json" -d "$body" "$url" --max-time 30)
    else
      status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" --max-time 30)
    fi
    [ "$status" != "000" ] && break
    sleep 3
  done

  # "000" = curl never got a response at all (DNS/connect/timeout failure) —
  # always a hard failure, regardless of how lenient max_status is.
  if [ "$status" = "000" ]; then
    echo "FAIL  $name — $method $path → no response (unreachable after $attempt attempt(s))"
    FAILURES=$((FAILURES + 1))
  elif [ "$status" -ge 500 ] || [ "$status" -gt "$max_status" ]; then
    echo "FAIL  $name — $method $path → HTTP $status (expected <= $max_status, and never 5xx)"
    FAILURES=$((FAILURES + 1))
  else
    echo "PASS  $name — $method $path → HTTP $status"
  fi
}

echo "=== Smoke testing $APP at $URL ==="

# 1. Health check — no auth, no external calls (see app/api/health/route.ts)
check "Health check" GET "/api/health" 200

if [ "$APP" = "consumer" ]; then
  # 2. Homepage
  check "Homepage" GET "/" 200

  # 3. Kai chat — POST with a deliberately incomplete body. A 4xx proves the
  #    route executed (validated the body and rejected it); a 5xx means the
  #    server itself crashed handling the request.
  check "Kai chat reachable" POST "/api/kai/chat" 499 '{}'

  # 4. Analytics ingestion + indirect Supabase connectivity check — this
  #    route calls createSupabaseAdminClient() and writes to
  #    analytics_events on a valid batch. An empty/invalid batch still
  #    proves the route (and its Supabase client construction) executed
  #    without crashing; a 500 here is the strongest signal available from
  #    an unauthenticated smoke test that Supabase itself is unreachable or
  #    misconfigured, since /api/health deliberately avoids calling it.
  check "Analytics ingestion (+ Supabase reachability)" POST "/api/analytics/ingest" 499 '{"events":[]}'
else
  # 2. Admin login page
  check "Admin login page" GET "/admin/login" 200

  # 3. Analytics ingestion + indirect Supabase connectivity check (see
  #    consumer comment above — same endpoint shape, mirrors
  #    app/api/analytics/ingest/route.ts in this app).
  check "Analytics ingestion (+ Supabase reachability)" POST "/api/analytics/ingest" 499 '{"events":[]}'
fi

if [ "$FAILURES" -gt 0 ]; then
  echo "=== $APP: $FAILURES check(s) failed ==="
  exit 1
fi

echo "=== $APP: all checks passed ==="
