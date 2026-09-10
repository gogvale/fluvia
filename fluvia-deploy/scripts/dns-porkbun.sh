#!/usr/bin/env bash
# DNS automation + verification for the Fluvia domain, via the Porkbun API v3.
# Runs from the operator machine (NOT the lure host — keep credentials off the box).
#
#   export PORKBUN_API_KEY=... PORKBUN_SECRET_API_KEY=...
#   # or put them in ~/.hermes/creds/porkbun.txt as KEY=... / SECRET=...
#
#   bash dns-porkbun.sh ping                        # credentials valid?
#   bash dns-porkbun.sh list <host>                 # records of its zone
#   bash dns-porkbun.sh set  <host> <ip> [--www]    # point <host> (and www) at <ip>
#   bash dns-porkbun.sh del  <host> [--www]         # remove those A records
#   bash dns-porkbun.sh check <host> <ip>           # resolve + https + CT-log presence
#
# <host> may be an apex (cottonsky.shop) or a subdomain (test.cottonsky.shop): the zone is
# resolved against the account's domain list, so `set`/`del` work for both.
set -euo pipefail

API="https://api.porkbun.com/api/json/v3"

load_creds() {
  if [ -z "${PORKBUN_API_KEY:-}" ] || [ -z "${PORKBUN_SECRET_API_KEY:-}" ]; then
    local f="${PORKBUN_CREDS:-$HOME/.hermes/creds/porkbun.txt}"
    [ -f "$f" ] || { echo "ERROR: set PORKBUN_API_KEY/PORKBUN_SECRET_API_KEY or create $f" >&2; exit 1; }
    # shellcheck disable=SC1090
    . "$f"
  fi
  export PORKBUN_API_KEY PORKBUN_SECRET_API_KEY
}

call() { # call <path> <json-extra>
  curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"apikey\":\"$PORKBUN_API_KEY\",\"secretapikey\":\"$PORKBUN_SECRET_API_KEY\"$2}" \
    --max-time 25 "$API/$1"
}

# split <host> into "<zone> <prefix>" using the account's domain list
resolve_zone() {
  local host="$1"
  call domain/listAll "" | python3 -c "
import json,sys
host = sys.argv[1].lower().rstrip('.')
try:
    domains = [d['domain'].lower() for d in json.load(sys.stdin).get('domains', [])]
except Exception:
    print('ERROR: cannot list domains'); raise SystemExit(1)
matches = [d for d in domains if host == d or host.endswith('.' + d)]
if not matches:
    print(f'ERROR: {host} is not under any domain in this account'); raise SystemExit(1)
zone = max(matches, key=len)
prefix = host[:-len(zone)].rstrip('.')
print(zone, prefix)" "$host"
}

cmd_ping() { load_creds; call ping ""; echo; }

cmd_list() {
  load_creds; local host="$1"; read -r zone prefix < <(resolve_zone "$host")
  echo "zone=$zone prefix=${prefix:-<apex>}"
  call "dns/retrieve/$zone" "" | python3 -c "
import json,sys
r=json.load(sys.stdin)
if r.get('status')!='SUCCESS': print('ERROR:', r); raise SystemExit(1)
for rec in r.get('records',[]):
    if rec['type'] in ('A','AAAA','CNAME','TXT'):
        print(f\"  {rec['type']:5} {rec['name']:38} -> {rec['content'][:60]}  (ttl {rec['ttl']}, id {rec['id']})\")"
}

# upsert one A record: edit if it exists, else create. name '' = apex.
upsert_a() {
  local zone="$1" name="$2" ip="$3" id=""
  id=$(call "dns/retrieve/$zone" "" | python3 -c "
import json,sys
want=sys.argv[1].strip('.').lower()
r=json.load(sys.stdin)
for rec in r.get('records',[]):
    n=rec['name'].rstrip('.').lower()
    apex_ok = (want=='' and n==sys.argv[2].lower())
    if rec['type']=='A' and (n==want or apex_ok):
        print(rec['id']); break" "$name" "$zone")
  local label="${name:-<apex>}"
  if [ -n "$id" ]; then
    call "dns/edit/$zone/$id" ", \"name\":\"$name\", \"type\":\"A\", \"content\":\"$ip\", \"ttl\":\"600\"" \
      | python3 -c "import json,sys;r=json.load(sys.stdin);print(f\"  edit   {sys.argv[1]:38} -> {sys.argv[2]}  [{r.get('status')}] {r.get('message','')}\")" "$label" "$ip"
  else
    call "dns/create/$zone" ", \"name\":\"$name\", \"type\":\"A\", \"content\":\"$ip\", \"ttl\":\"600\"" \
      | python3 -c "import json,sys;r=json.load(sys.stdin);print(f\"  create {sys.argv[1]:38} -> {sys.argv[2]}  [{r.get('status')}] {r.get('message','')}\")" "$label" "$ip"
  fi
}

cmd_set() {
  load_creds; local host="$1" ip="$2" with_www="${3:-}"
  read -r zone prefix < <(resolve_zone "$host")
  echo "zone=$zone prefix=${prefix:-<apex>} -> $ip"
  upsert_a "$zone" "$prefix" "$ip"
  [ "$with_www" = "--www" ] && upsert_a "$zone" "${prefix:+$prefix.}www" "$ip"
  return 0
}

cmd_del() {
  load_creds; local host="$1" with_www="${2:-}"
  read -r zone prefix < <(resolve_zone "$host")
  local targets="$host"
  [ "$with_www" = "--www" ] && targets="$host ${prefix:+$prefix.}www.$zone"
  for want in $targets; do
    call "dns/retrieve/$zone" "" | python3 -c "
import json,sys,subprocess,os
want=sys.argv[1].rstrip('.').lower()
r=json.load(sys.stdin)
ids=[rec['id'] for rec in r.get('records',[]) if rec['name'].rstrip('.').lower()==want]
if not ids: print(f'  no A/other record for {want}'); raise SystemExit
for i in ids:
    out=subprocess.run(['curl','-s','-X','POST','-H','Content-Type: application/json','-d',
        json.dumps({'apikey':os.environ['PORKBUN_API_KEY'],'secretapikey':os.environ['PORKBUN_SECRET_API_KEY']}),
        f\"https://api.porkbun.com/api/json/v3/dns/delete/{sys.argv[2]}/{i}\"],capture_output=True,text=True).stdout
    print(f\"  delete {want:38} id={i}  [{json.loads(out).get('status')}] (all types)\")" "$want" "$zone"
  done
  return 0
}

cmd_check() {
  local host="$1" want="$2"
  echo "== resolution =="
  for h in "$host" "www.$host"; do
    got=$(dig +short "$h" @1.1.1.1 | tail -1)
    if [ "$got" = "$want" ]; then echo "  OK    $h -> $got"; else echo "  note  $h -> ${got:-<none>}"; fi
  done
  echo "== https =="
  code=$(curl -sk -o /dev/null -w "%{http_code}" "https://$host/" --max-time 15 || true)
  echo "  https://$host -> $code"
  echo "  cert:"; echo | timeout 12 openssl s_client -connect "$host:443" -servername "$host" 2>/dev/null | openssl x509 -noout -subject -issuer -dates 2>/dev/null | sed 's/^/    /'
  echo "== certificate transparency (discovery channel) =="
  curl -s --max-time 20 "https://crt.sh/?q=$host&output=json" | python3 -c "
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
  list)  cmd_list "${2:?host}" ;;
  set)   cmd_set "${2:?host}" "${3:?ip}" "${4:-}" ;;
  del)   cmd_del "${2:?host}" "${3:-}" ;;
  check) cmd_check "${2:?host}" "${3:?ip}" ;;
  *) echo "usage: $0 {ping | list <host> | set <host> <ip> [--www] | del <host> [--www] | check <host> <ip>}" >&2; exit 2 ;;
esac
