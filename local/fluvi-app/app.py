"""Fluvia lure — FICTIONAL crypto on/off-ramp (local instrumentation test).

Every asset here is a SEÑUELO: no real money, no real crypto, no real data.
The capture middleware records attacker behaviour to {EVIDENCE_DIR}/capture.jsonl.

Capture events:
  lure_content_read  — GET on public pages (order-of-navigation signal)
  auth_attempt       — admin/api login, RAW user+password (typos preserved) + result
  admin_action       — post-login dashboard access
  seed_touch         — access to a honeytoken (fake mnemonic / wallet.json)
  withdraw_attempt   — POST /api/v1/withdraw (amount, dest, sweep flag)
  api_call           — any API endpoint hit
  webhook_attempt    — POST /webhooks
  balance_query      — GET /api/v1/balance
"""
import json
import os
from datetime import datetime, timezone

from flask import Flask, request, jsonify, Response

EVIDENCE = os.environ.get("EVIDENCE_DIR", "/evidence")
LOG = os.path.join(EVIDENCE, "capture.jsonl")
os.makedirs(EVIDENCE, exist_ok=True)

app = Flask(__name__)

# --- FAKE ASSETS (señuelo, nunca real) ---
FAKE_MNEMONIC = "cliff broken canyon velvet mirror seven silver garden river copper lantern anchor"
FAKE_BALANCES = {"USDC": "1,847,200.44", "USDT": "93,210.17", "XMR": "412.88"}
FAKE_WALLET = "0x5B8eA1d3F6c9B2a7E4f0D8c5A1b3E7f9C2d6B4"
FAKE_API_KEY = "fl_live_9xX7fakefakefakefakefakefakef"
ADMIN_USERS = {"admin@fluvia.finance": "Fluvia2024!", "founder@fluvia.finance": "Fluvia2021!"}
FOUNDED = 2021
FOUNDER = "Diego Arévalo"


def emit(event, **kw):
    rec = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "ip": request.headers.get("X-Forwarded-For", request.remote_addr or ""),
        "ua": request.headers.get("User-Agent", ""),
        "method": request.method,
        "path": request.path,
        "event": event,
    }
    rec.update(kw)
    try:
        with open(LOG, "a") as f:
            f.write(json.dumps(rec) + "\n")
    except OSError:
        pass
    app.logger.info("capture:%s", json.dumps(rec))


@app.before_request
def lure_read():
    if request.method == "GET" and request.path in ("/", "/about", "/pricing", "/how-it-works", "/terms", "/api/docs"):
        emit("lure_content_read")


def page(title, body):
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{title}</title>
<style>body{{background:#060809;color:#F5F7FA;font-family:Inter,system-ui,sans-serif;margin:2rem auto;max-width:780px;padding:0 1rem;line-height:1.6}}
a{{color:#2DD4BF}} code{{background:#10141B;padding:2px 6px;border-radius:4px;color:#34D399}}
.dim{{color:#5B6472}} hr{{border-color:#1E242E}}</style></head>
<body><nav><a href="/">home</a> · <a href="/about">about</a> · <a href="/pricing">pricing</a> · <a href="/api/docs">api</a> · <a href="/admin/login">admin</a></nav><hr>
{body}
<footer class="dim"><hr>Fluvia · Founded {FOUNDED} · Mexico City · <em>get paid in dollars</em></footer></body></html>"""


# ---------------- public pages ----------------

@app.route("/")
def home():
    return page("Fluvia — get paid in dollars", """
<h1 style="font-size:2.4rem;line-height:1.2">Get paid in dollars.<br>Settle in minutes.</h1>
<p style="color:#98A2B3">The on/off-ramp that makes stablecoins boring enough to actually use.
Invoice, get paid, settle in USDC/USDT — no correspondent bank, no SWIFT, no 5-day hold.</p>
<p><strong>We accept USDC · USDT · Monero (XMR)</strong> — no KYC for crypto rails.</p>
<p><a href="/how-it-works">How it works</a> · <a href="/api/docs">Developer API</a></p>
<p class="dim">$390B+ settled on stablecoin rails · 71% of LATAM B2B already runs on stablecoins</p>
""")


@app.route("/about")
def about():
    return page("About — Fluvia", f"""
<h1>About</h1>
<p>Fluvia was founded in <strong>{FOUNDED}</strong> by <strong>{FOUNDER}</strong>, an ex-payments
ops lead who got tired of watching cross-border money sit in someone else's pipeline.</p>
<p class="dim">Small team. Mexico City. We build the last mile — the on/off-ramp.</p>
""")


@app.route("/pricing")
def pricing():
    return page("Pricing — Fluvia", """
<h1>Pricing</h1>
<table style="width:100%;border-collapse:collapse">
<tr style="color:#98A2B3"><th>Service</th><th>Fee</th></tr>
<tr><td>On-ramp (fiat → USDC/USDT)</td><td>0.5%</td></tr>
<tr><td>Stablecoin conversion</td><td>0.1%</td></tr>
<tr><td>Payout to local bank</td><td>flat, published</td></tr>
<tr><td>Monero rail (no KYC)</td><td>0.4%</td></tr>
</table>
""")


@app.route("/how-it-works")
def how():
    return page("How it works — Fluvia", """
<h1>How it works</h1>
<ol><li>Link an account, get a deposit address per asset.</li>
<li>Hold &amp; convert — live pricing, flat published rate.</li>
<li>Payout to a local bank or any wallet. MPC + multisig, treasury cold.</li></ol>
""")


@app.route("/api/docs")
def apidocs():
    return page("API docs — Fluvia", f"""
<h1>API</h1>
<p>Base: <code>https://api.fluvia.finance/v1</code> · auth: <code>fl_live_*</code> key</p>
<ul>
<li><code>GET /api/v1/rates</code></li>
<li><code>GET /api/v1/balance</code></li>
<li><code>POST /api/v1/deposit-address</code></li>
<li><code>POST /api/v1/withdraw</code></li>
</ul>
<p class="dim">Example key: <code>{FAKE_API_KEY}</code></p>
""")


# ---------------- API (capture surfaces) ----------------

@app.route("/api/v1/rates")
def rates():
    emit("api_call", endpoint="rates")
    return jsonify({"USDC/USD": 1.0, "USDT/USD": 1.0, "XMR/USD": 218.44, "source": "chainlink"})


@app.route("/api/v1/balance")
def balance():
    emit("balance_query")
    return jsonify({"balances": FAKE_BALANCES, "wallet": FAKE_WALLET})


@app.route("/api/v1/deposit-address", methods=["GET", "POST"])
def deposit():
    emit("api_call", endpoint="deposit-address")
    return jsonify({"asset": "USDC", "network": "ethereum", "address": FAKE_WALLET})


@app.route("/api/v1/withdraw", methods=["GET", "POST"])
def withdraw():
    amount = request.values.get("amount", "")
    dest = request.values.get("dest_address", request.values.get("to", ""))
    sweep = amount.lower() in ("all", "max", "999999", "999999999") or amount in ("1847200.44", "1847200")
    emit("withdraw_attempt", amount=amount, dest_address=dest, sweep=sweep)
    # never executes — returns a fake "pending" state
    return jsonify({"status": "pending", "amount": amount, "dest": dest, "note": "queued for sweep job"})


@app.route("/webhooks", methods=["GET", "POST"])
def webhooks():
    emit("webhook_attempt")
    return jsonify({"received": True})


@app.route("/api/v1/keys")
def keys():
    emit("api_call", endpoint="keys")
    return jsonify({"keys": [{"key": FAKE_API_KEY, "scope": "full", "prefix": "fl_live_"}]})


# ---------------- admin (bait) ----------------

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        user = request.form.get("username", "")
        password = request.form.get("password", "")
        ok = ADMIN_USERS.get(user) == password
        # capture RAW credentials BEFORE validating — typos preserved
        emit("auth_attempt", user=user, password=password, result="ok" if ok else "fail", surface="admin")
        if ok:
            return '<meta http-equiv="refresh" content="0;url=/admin/dashboard">'
        return page("admin — login", "<h1>Login</h1><p style='color:#F87171'>Invalid credentials.</p>")
    return page("admin — login", """
<h1>Admin login</h1>
<form method="post">
<input name="username" placeholder="email" style="background:#10141B;border:1px solid #1E242E;color:#F5F7FA;padding:6px"><br><br>
<input name="password" type="password" placeholder="password" style="background:#10141B;border:1px solid #1E242E;color:#F5F7FA;padding:6px"><br><br>
<button style="background:#2DD4BF;color:#060809;border:0;padding:8px 16px;border-radius:6px;cursor:pointer">Sign in</button>
</form>""")


@app.route("/admin/dashboard")
def admin_dashboard():
    emit("admin_action", surface="dashboard")
    return page("admin — dashboard", f"""
<h1>Dashboard</h1>
<p>Treasury balances:</p><ul><li>USDC <strong>{FAKE_BALANCES['USDC']}</strong></li><li>USDT <strong>{FAKE_BALANCES['USDT']}</strong></li><li>XMR <strong>{FAKE_BALANCES['XMR']}</strong></li></ul>
<p><a href="/api/v1/export-seed" style="color:#F87171">Export wallet seed</a></p>
<p class="dim">// TODO: fix auth on this page</p>
""")


@app.route("/api/v1/export-seed")
def export_seed():
    emit("seed_touch", surface="admin-export-seed")
    return jsonify({"mnemonic": FAKE_MNEMONIC, "note": "self-custody recovery phrase"})


# ---------------- honeytokens ----------------

@app.route("/wallet.json")
def wallet_json():
    emit("seed_touch", surface="wallet.json")
    return jsonify({"wallet": FAKE_WALLET, "mnemonic": FAKE_MNEMONIC, "provider": "alchemy"})


@app.route("/backup/recovery-phrase.txt")
def backup_phrase():
    emit("seed_touch", surface="backup/recovery-phrase.txt")
    return Response(FAKE_MNEMONIC, mimetype="text/plain")


# ---------------- vibe-coded tells ----------------

@app.route("/api/debug")
def debug():
    emit("api_call", endpoint="debug")
    return jsonify({"app": "fluvia", "env": "production", "debug": True, "jwt_secret": "fluvia_super_secret_jwt_2024"})


@app.route("/api/health")
def health():
    emit("api_call", endpoint="health")
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000)
