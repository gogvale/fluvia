#!/usr/bin/env bash
# Sinkhole redirect: send connections to the C2 endpoints in targets.txt to the local
# fake-c2 responder (SINK_PORT). Idempotent — safe to re-run.
#
#   usage: bash sinkhole/apply.sh [targets-file] [sink-port]
#
# Ordering note: this uses the nat table (hook priority -110) so it rewrites the
# destination BEFORE the egress filter drops the packet — sinkholed flows are answered,
# everything else still hits the egress wall.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

TARGETS="${1:-targets.txt}"
# accept a path relative to the repo root too (setup.sh passes it either way)
[ -f "$TARGETS" ] || TARGETS="$HERE/$TARGETS"
[ -f "$TARGETS" ] || { echo "targets file not found: $1" >&2; exit 1; }
SINK_PORT="${2:-9001}"
TABLE=sinkhole

if [ "$(id -u)" -ne 0 ]; then echo "need root" >&2; exit 1; fi

# prerouting (forwarded/container traffic) + output (host-generated traffic)
sysctl -qw net.ipv4.conf.all.route_localnet=1 2>/dev/null || true

nft delete table ip "$TABLE" 2>/dev/null || true
nft add table ip "$TABLE"
nft "add chain ip $TABLE pre  { type nat hook prerouting priority -110; policy accept; }"
nft "add chain ip $TABLE out  { type nat hook output     priority -110; policy accept; }"

count=0
while read -r line; do
  line="${line%%#*}"; line="$(echo "$line" | tr -d '[:space:]')"
  [ -z "$line" ] && continue
  ip="${line%%:*}"; port="${line##*:}"
  [ "$ip" = "$port" ] && port="*"   # no ':' in the line -> all ports
  for chain in pre out; do
    if [ "$port" = "*" ]; then
      nft "add rule ip $TABLE $chain ip daddr $ip tcp redirect to :$SINK_PORT"
    else
      nft "add rule ip $TABLE $chain ip daddr $ip tcp dport $port redirect to :$SINK_PORT"
    fi
  done
  count=$((count + 1))
done < "$TARGETS"

echo "sinkhole: $count target(s) redirected to :$SINK_PORT"
nft list table ip "$TABLE" | sed 's/^/  /'
