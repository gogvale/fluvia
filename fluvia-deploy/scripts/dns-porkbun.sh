#!/usr/bin/env bash
# DNS automation + verification for the Fluvia domain, via the Porkbun API v3.
# Runs from the operator machine (NOT the lure host — keep credentials off the box).
#
#   export PORKBUN_API_KEY=... PORKBUN_SECRET_API_KEY=...
#   # or put them in ~/.hermes/creds/porkbun.txt as KEY=... / SECRET=...
#
#   bash dns-porkbun.sh ping                 # credentials valid?
#   bash dns-porkbun.sh list <domain>        # current records
#   bash dns-porkbun.sh set  <domain> <ip>   # point @ and www at <ip> (create or edit)
#   bash dns-porkbun.sh check <domain> <ip>  # resolve + compare + CT-log presence
set -euo pipefail

API="https://api.porkbun.com/api/json/v3"

load_creds() {
  if [ -z "${PORKBUN_API_KEY:-}" ] || [ -z "${PORKBUN_SECRET_API_KEY:-}" ]; then
    local f="${PORKBUN_CREDS:-$HOME/.hermes/creds/porkbun.txt}"
    [ -f "$f" ] || { echo "ERROR: set PORKBUN_API_KEY/PORKBUN_SECRET_API_KEY or create $f" >&2; exit 1; }
    # shellcheck disable=SC1090
    . "$f"
  fi
}

call() { # call <path> <json-extra>
  curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"apikey\":\"$PORKBUN_API_KEY\",\"secretapikey\":\"$PORKBUN_SECRET_API_KEY\"$2}" \
    --max-time 25 "$API/$1"
}

cmd_ping() { load_creds; call ping ""; echo; }

cmd_list() {
  load_creds; local d="$1"
  call "dns/retrieve/$d" "" | python3 -c "
import json,sys
r=json.load(sys.stdin)
if r.get('status')!='SUCCESS': print('ERROR:', r); raise SystemExit(1)
for rec in r.get('records',[]):
    if rec['type'] in ('A','AAAA','CNAME'):
        print(f\"  {rec['type']:5} {rec['name']:35} -> {rec['content']}  (ttl {rec['ttl']}, id {rec['id']})\")"
}

# upsert an A record: edit if an A record with that name exists, else create
upsert_a() {
  local d="$1" name="$2" ip="$3"
  local existing
  existing=$(call "dns/retrieve/$d" "" | python3 -c "
import json,sys
r=json.load(sys.stdin)
want=sys.argv[1]
for rec in r.get('records',[]):
    if rec['type']=='A' and rec['name'].rstrip('.')==want:
        print(rec['id']); break" "$name")
  if [ -n "$existing" ]; then
    call "dns/edit/$d/$existing" ", \"name\":\"$name\", \"type\":\"A\", \"content\":\"$ip\", \"ttl\":\"600\"" \
      | python3 -c "import json,sys; r=json.load(sys.stdin); print(f'  edited  {sys.argv[2]:35} -> {sys.argv[3]}  [{r.get(\"status\")}]')" - "$name" "$ip"
  else
    call "dns/create/$d" ", \"name\":\"$name\", \"type\":\"A\", \"content\":\"$ip\", \"ttl\":\"600\"" \
      | python3 -c "import json,sys; r=json.load(sys.stdin); print(f'  created {sys.argv[2]:35} -> {sys.argv[3]}  [{r.get(\"status\")}]')" - "$name" "$ip"
  fi
}

cmd_set() {
  load_creds; local d="$1" ip="$2"
  echo "pointing $d at $ip"
  upsert_a "$d" "" "$ip"
  upsert_a "$d" "www" "$ip"
}

cmd_check() {
  local d="$1" want="$2"
  echo "== resolution =="
  for h in "$d" "www.$d"; do
    got=$(dig +short "$h" @1.1.1.1 | tail -1)
    if [ "$got" = "$want" ]; then echo "  OK    $h -> $got"; else echo "  FAIL  $h -> ${got:-<none>} (expected $want)"; fi
  done
  echo "== https =="
  code=$(curl -sk -o /dev/null -w "%{http_code}" "https://$d/" --max-time 15 || true)
  echo "  https://$d -> $code"
  echo "== certificate transparency (discovery channel) =="
  curl -s --max-time 20 "https://crt.sh/?q=$d&output=json" | python3 -c "
import json,sys
try: rows=json.load(sys.stdin)
except Exception: print('  (crt.sh unavailable)'); raise SystemExit
if not rows: print('  no CT entries yet (normal right after issuance)')
else:
    for r in rows[:5]:
        print(f\"  {r.get('not_before','')[:10]}  {r.get('issuer_name','')[:60]}\")"
}

case "${1:-}" in
  ping)  cmd_ping ;;
  list)  cmd_list "${2:?domain}" ;;
  set)   cmd_set "${2:?domain}" "${3:?ip}" ;;
  check) cmd_check "${2:?domain}" "${3:?ip}" ;;
  *) echo "usage: $0 {ping | list <domain> | set <domain> <ip> | check <domain> <ip>}" >&2; exit 2 ;;
esac
