#!/usr/bin/env python3
"""Fake-C2 responder (sinkhole).

Pretends to be the far end of an attacker C2 so anything that gets code execution on the
lure keeps talking and reveals its next stage, instead of failing at a dropped packet.

How traffic gets here: sinkhole/apply.sh installs an nftables NAT redirect that sends
connections addressed to the listed C2 endpoints to SINK_PORT on this host. Nothing
leaves the box; every connection is logged to $EVIDENCE_DIR/fakec2.jsonl.

Ports: SINK_PORT (redirect target, default 9001) plus EXTRA_PORTS (direct listeners).
No dependencies, stdlib only. Everything here is inert: no real protocol emulation
beyond enough of a reply for the caller to believe it connected.
"""
import json
import os
import socket
import struct
import sys
import threading
import time

EVIDENCE_DIR = os.environ.get("EVIDENCE_DIR", "/evidence")
SINK_PORT = int(os.environ.get("SINK_PORT", "9001"))
EXTRA_PORTS = [int(p) for p in os.environ.get("EXTRA_PORTS", "").split(",") if p.strip()]
LOG = os.path.join(EVIDENCE_DIR, "fakec2.jsonl")
SO_ORIGINAL_DST = 80  # linux getsockopt for the pre-NAT destination

_lock = threading.Lock()


def log(rec: dict) -> None:
    rec["ts"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    line = json.dumps(rec, ensure_ascii=False)
    try:
        os.makedirs(EVIDENCE_DIR, exist_ok=True)
        with _lock:
            with open(LOG, "a", encoding="utf-8") as fh:
                fh.write(line + "\n")
    except Exception as exc:  # never die because the log failed
        print(f"[fakec2] log write failed: {exc}", file=sys.stderr)
        print(line)


def original_dst(conn: socket.socket):
    """Return (ip, port) the client actually dialled, before our redirect."""
    try:
        raw = conn.getsockopt(socket.SOL_IP, SO_ORIGINAL_DST, 16)
        port = struct.unpack("!H", raw[2:4])[0]
        ip = socket.inet_ntoa(raw[4:8])
        return ip, port
    except Exception:
        return None, None


def http_reply(body: bytes) -> bytes:
    return (
        b"HTTP/1.1 200 OK\r\n"
        b"Content-Type: application/json\r\n"
        b"Server: nginx\r\n"
        b"Connection: close\r\n"
        b"Content-Length: " + str(len(body)).encode() + b"\r\n\r\n" + body
    )


def preview(data: bytes) -> str:
    try:
        return data.decode("utf-8", "replace")[:400]
    except Exception:
        return data[:120].hex()


def handle(conn: socket.socket, addr, listen_port: int) -> None:
    src_ip, src_port = addr[0], addr[1]
    conn.settimeout(3.0)
    data = b""
    try:
        while len(data) < 4096:
            chunk = conn.recv(4096 - len(data))
            if not chunk:
                break
            data += chunk
            if b"\r\n\r\n" in data:
                break
    except Exception:
        pass

    dst_ip, dst_port = original_dst(conn)
    proto = "http" if data[:4] in (b"GET ", b"POST", b"HEAD", b"PUT ") else "raw"
    reply = (
        http_reply(b'{"ok":true,"node":"edge-1","build":"2024.11"}')
        if proto == "http"
        else b"OK\n"
    )
    sent = False
    try:
        conn.sendall(reply)
        sent = True
    except Exception:
        pass

    log(
        {
            "event": "fakec2_conn",
            "src_ip": src_ip,
            "src_port": src_port,
            "sink_port": listen_port,
            "original_dst_ip": dst_ip,
            "original_dst_port": dst_port,
            "proto": proto,
            "bytes_in": len(data),
            "answered": sent,
            "preview": preview(data),
        }
    )
    try:
        conn.close()
    except Exception:
        pass


def serve(port: int) -> None:
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        srv.bind(("0.0.0.0", port))
    except OSError as exc:
        print(f"[fakec2] cannot bind :{port}: {exc}", file=sys.stderr)
        return
    srv.listen(64)
    print(f"[fakec2] listening on :{port}", flush=True)
    while True:
        try:
            conn, addr = srv.accept()
        except Exception:
            continue
        threading.Thread(target=handle, args=(conn, addr, port), daemon=True).start()


def main() -> None:
    ports = [SINK_PORT] + [p for p in EXTRA_PORTS if p != SINK_PORT]
    print(f"[fakec2] sink_port={SINK_PORT} extra={EXTRA_PORTS} log={LOG}", flush=True)
    for port in ports[1:]:
        threading.Thread(target=serve, args=(port,), daemon=True).start()
    serve(ports[0])


if __name__ == "__main__":
    main()
