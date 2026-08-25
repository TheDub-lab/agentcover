"""
AgentCover backend — mobile console over the REAL safety_protocol engine.

This is not a mock. Every /gate and /bind call runs the actual
safety_protocol.SafetyProtocol enforcement layer (binding, scope, budget,
approval, kill switch) and the ChainWarden bounded-autonomy gate logic.

Run:
    PYTHONPATH=C:/Users/michael/safety-protocol/src python backend/server.py
The server uses only the Python standard library (zero extra deps),
so it runs anywhere the engine runs.
"""
from __future__ import annotations
import json
import os
import sys
import time
import uuid
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

# --- make the real engine importable ---------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
for _cand in (os.path.join(_ROOT, "..", "safety-protocol", "src"),
              "C:/Users/michael/safety-protocol/src",
              "/c/Users/michael/safety-protocol/src"):
    if os.path.isdir(_cand) and _cand not in sys.path:
        sys.path.insert(0, os.path.abspath(_cand))

from safety_protocol import (  # noqa: E402
    SafetyProtocol, ScopeRule, AuditTrail, BoundAgent, ActionRequest,
)

HOST = "127.0.0.1"
PORT = 8731

# Coverage tiers map to concrete engine policy. Higher tier = wider scope,
# bigger budget, lower approval threshold. This is the monetization bridge:
# a paid plan literally unlocks more agent autonomy, enforced by the engine.
TIERS = {
    "free":      dict(label="Observer",  budget_limit=50.0,    approval_threshold=10.0,  scope_multiplier=1),
    "basic":     dict(label="Guardian",  budget_limit=500.0,   approval_threshold=25.0,  scope_multiplier=3),
    "pro":       dict(label="Warden",    budget_limit=5000.0,  approval_threshold=100.0, scope_multiplier=10),
    "empowered": dict(label="Sovereign", budget_limit=50000.0, approval_threshold=500.0, scope_multiplier=30),
}

# In-memory registry of bound agents. (Shipaton demo: process-local; the
# engine's audit trail is the source of truth and is exportable.)
_LOCK = threading.Lock()
_AGENTS: dict[str, BoundAgent] = {}
_PROTOCOLS: dict[str, SafetyProtocol] = {}


def _default_scope(agent_id: str, multiplier: int) -> list[ScopeRule]:
    """Least-privilege allowlist. The agent may only 'pay' a registered
    merchant and only 'read' its own status endpoint. Scope widens with tier."""
    return [
        ScopeRule(
            action_type="pay",
            allowed_targets=["0xMerchant", "0xUtility"],
            match="exact",
            max_cost=100.0 * multiplier,
        ),
        ScopeRule(
            action_type="read",
            allowed_targets=["agent.local/status", "agent.local/audit"],
            match="prefix",
        ),
    ]


def _make_agent(agent_id: str, user_id: str, tier: str) -> BoundAgent:
    spec = TIERS.get(tier, TIERS["free"])
    proto = SafetyProtocol(
        agent_id=agent_id,
        user_id=user_id,
        scope_rules=_default_scope(agent_id, spec["scope_multiplier"]),
        budget_limit=spec["budget_limit"],
        approval_threshold_cost=spec["approval_threshold"],
        audit=AuditTrail(),
        allowed_action_types=["pay", "read", "spawn_subagent"],
    )
    agent = BoundAgent(agent_id, user_id, proto)
    return agent, proto


def _json(code: int, body: dict) -> bytes:
    return json.dumps(body, default=str).encode("utf-8")


def _read_body(req) -> dict:
    try:
        raw = req.rfile.read(int(req.headers.get("Content-Length", 0)))
        return json.loads(raw or b"{}")
    except Exception:
        return {}


class Handler(BaseHTTPRequestHandler):
    server_version = "AgentCover/0.1"

    def log_message(self, *a):  # quiet
        pass

    def _send(self, code, body):
        payload = _json(code, body)
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            self._send(200, {"status": "ok", "engine": "safety_protocol", "tiers": list(TIERS)})
            return
        if path == "/agents":
            with _LOCK:
                data = {aid: a.get_status() for aid, a in _AGENTS.items()}
            self._send(200, {"agents": data})
            return
        # /agent/<id>/status and /agent/<id>/audit
        parts = path.strip("/").split("/")
        if len(parts) >= 2 and parts[0] == "agent":
            aid = parts[1]
            with _LOCK:
                agent = _AGENTS.get(aid)
            if not agent:
                self._send(404, {"error": "agent not found"})
                return
            if len(parts) == 2 or parts[2] == "status":
                self._send(200, agent.get_status())
            elif parts[2] == "audit":
                with _LOCK:
                    entries = agent.protocol.audit.query(agent_id=aid)
                # Normalize to a stable shape the app renders.
                norm = [{
                    "seq": e.get("seq"),
                    "event": e.get("event_type"),
                    "ts": e.get("timestamp"),
                    "details": e.get("data"),
                    "hash": e.get("entry_hash"),
                } for e in entries]
                self._send(200, {"audit": norm})
            else:
                self._send(404, {"error": "unknown sub-path"})
            return
        self._send(404, {"error": "not found"})

    def do_POST(self):
        path = urlparse(self.path).path
        body = _read_body(self)

        if path == "/bind":
            agent_id = body.get("agent_id") or ("0x" + uuid.uuid4().hex[:10])
            user_id = body.get("user_id", "michael")
            tier = body.get("tier", "free")
            with _LOCK:
                agent, proto = _make_agent(agent_id, user_id, tier)
                _AGENTS[agent_id] = agent
                _PROTOCOLS[agent_id] = proto
            self._send(200, {
                "agent_id": agent_id,
                "tier": tier,
                "tier_label": TIERS.get(tier, TIERS["free"])["label"],
                "status": agent.get_status(),
            })
            return

        parts = path.strip("/").split("/")
        if len(parts) >= 3 and parts[0] == "agent":
            aid = parts[1]
            verb = parts[2]
            with _LOCK:
                agent = _AGENTS.get(aid)
            if not agent:
                self._send(404, {"error": "agent not found"})
                return

            if verb == "gate":
                # The enforcement layer. Runs the REAL engine.
                req = ActionRequest(
                    action_type=body.get("action_type", "pay"),
                    target=body.get("target", ""),
                    params=body.get("params", {}) or {},
                    method=body.get("method"),
                    estimated_cost=float(body.get("estimated_cost", 0.0) or 0.0),
                    urgency=body.get("urgency", "normal"),
                )
                result = agent.protocol.execute(req)
                self._send(200, {
                    "agent_id": aid,
                    "outcome": result.outcome.value,
                    "executed": result.executed,
                    "block_reason": result.block_reason,
                    "requires_approval_for": result.requires_approval_for,
                    "request_id": result.request_id,
                })
                return

            if verb == "killswitch":
                agent.protocol.engage_killswitch(body.get("reason", "mobile kill switch"))
                self._send(200, {"agent_id": aid, "state": agent.get_status()["protocol_state"]})
                return

            if verb == "reset":
                user_id = agent.user_id
                tier = body.get("tier", "free")
                with _LOCK:
                    new_agent, new_proto = _make_agent(aid, user_id, tier)
                    _AGENTS[aid] = new_agent
                    _PROTOCOLS[aid] = new_proto
                self._send(200, {"agent_id": aid, "state": "active", "note": "binding reset"})
                return

            self._send(404, {"error": "unknown verb"})
            return

        self._send(404, {"error": "not found"})


def main():
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"AgentCover backend on http://{HOST}:{PORT} (engine: safety_protocol)")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        srv.shutdown()


if __name__ == "__main__":
    main()
