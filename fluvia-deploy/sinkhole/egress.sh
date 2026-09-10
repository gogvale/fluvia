#!/usr/bin/env bash
# Egress lockdown for Run 2 (host level, nftables). Idempotent — safe to re-run.
#
#   usage: bash sinkhole/egress.sh [--allow-acme] [--off]
#
# What it does: allows loopback, established/related, DNS and NTP; drops (and logs) every
# other outbound and forwarded packet. That covers BOTH the host and the containers —
# container egress traverses the FORWARD chain, so an OUTPUT-only rule would leave the
# lure free to phone home.
#
# The C2 sinkhole still works: it redirects in the nat table (priority -110), i.e. BEFORE
# this filter, so sinkholed flows are answered locally and never reach the DROP.
#
# --allow-acme opens outbound 80/443 for the duration of a cert issuance; use it only
# while Caddy is getting its certificate, then re-run without the flag. `--off` removes
# the whole table.
set -euo pipefail

TABLE=egress
[ "$(id -u)" -eq 0 ] || { echo "need root" >&2; exit 1; }

if [ "${1:-}" = "--off" ]; then
  nft delete table inet "$TABLE" 2>/dev/null || true
  echo "egress: disabled (no rules)"
  exit 0
fi

ALLOW_ACME=0
[ "${1:-}" = "--allow-acme" ] && ALLOW_ACME=1

WAN="${IFACE:-$(ip route | awk '/^default/{print $5; exit}')}"; WAN="${WAN:-eth0}"

nft delete table inet "$TABLE" 2>/dev/null || true
nft add table inet "$TABLE"

nft "add chain inet $TABLE output  { type filter hook output  priority 0; policy accept; }"
nft "add chain inet $TABLE forward { type filter hook forward priority 0; policy accept; }"

for chain in output forward; do
  nft "add rule inet $TABLE $chain oifname lo accept"
  # GOTCHA 1: after the sinkhole's nat REDIRECT the destination is rewritten to 127.0.0.1
  # but the packet is evaluated by this chain IN THE SAME PASS with the original oifname
  # (eth0), so `oifname lo` does not match and the drop rule would kill the very flows we
  # want to answer. Accept loopback-destined/sourced traffic explicitly — it can never
  # leave the box.
  nft "add rule inet $TABLE $chain ip daddr 127.0.0.0/8 accept"
  nft "add rule inet $TABLE $chain ip saddr 127.0.0.0/8 accept"
  # GOTCHA 2: docker publishes ports through the userland proxy (docker-proxy), which
  # reaches the containers with a HOST-ORIGINATED connection into the bridge network.
  # Dropping that silently takes the whole lure offline. Private ranges are on-host only.
  nft "add rule inet $TABLE $chain ip daddr { 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 } accept"
  nft "add rule inet $TABLE $chain ct state established,related accept"
  nft "add rule inet $TABLE $chain ct state invalid drop"
  nft "add rule inet $TABLE $chain udp dport 53 accept"
  nft "add rule inet $TABLE $chain tcp dport 53 accept"
  nft "add rule inet $TABLE $chain udp dport 123 accept"
  if [ "$ALLOW_ACME" = "1" ]; then
    nft "add rule inet $TABLE $chain tcp dport { 80, 443 } accept"
  fi
  nft "add rule inet $TABLE $chain counter log prefix \"EGRESS-DROP \" drop"
done

# GOTCHA 3: inbound traffic to published containers must keep flowing — only the
# container→internet direction (bridge in, WAN out) is what we are locking.
nft insert rule inet "$TABLE" forward iifname "$WAN" accept

echo "egress: locked (wan=$WAN acme-open=$ALLOW_ACME)"
nft list table inet "$TABLE" | sed 's/^/  /'
