# AgentCover — Shipaton 2026 entry

**A mobile safety & insurance console for AI agents, built on a real enforcement engine.**

AgentCover ties an AI agent to a human owner and runs every action the agent
proposes through the `safety_protocol` enforcement layer — binding, scope,
budget, approval, and kill switch. Nothing executes without passing the
protocol. The mobile app is the operator console; the backend runs the actual
engine. Monetization is the unlock: a paid coverage tier literally raises the
agent's bounded-autonomy ceiling, enforced in code, not cosmetics.

## Why this fits Shipaton

- **Ships a real mobile app** (Expo, Android-first) with RevenueCat subscriptions.
- **Real monetization story** (HAMM Award): coverage tiers = subscriptions that
  map to concrete engine policy (budget + scope width).
- **Protects people** (Peace Prize): safer agents = safer users; every action is
  attributable to its owner and auditable.
- **Polished, demonstrable** (Design Award): dark console UI, live gate log,
  immutable audit trail, one-tap kill switch.

## Architecture

```
┌─────────────────┐      JSON/HTTP       ┌────────────────────────────┐
│  AgentCover app  │  ─────────────────▶ │  backend/server.py (stdlib) │
│  (Expo / React   │ ◀─────────────────  │  runs the REAL engine:      │
│   Native, RC)    │     allow/block/    │  safety_protocol.Safety-    │
│                 │     audit/kill      │  Protocol + ChainWarden gate │
└─────────────────┘                      └────────────────────────────┘
        │                                          │
        │ RevenueCat subscriptions                 │ enforces tier policy
        ▼                                          ▼
  Coverage tiers (Observer/Guardian/Warden/Sovereign)  →  budget + scope ceiling
```

The engine is **not reimplemented** in JavaScript. The app drives the Python
`safety_protocol` library (the same one in `github.com/TheDub-lab/safety-protocol`)
through a small standard-library HTTP server. That is the honest core of the
entry: the enforcement is infrastructure, not a prompt instruction.

## Run locally (dev)

```bash
# 1) backend — needs the safety_protocol engine on PYTHONPATH
cd agentcover/backend
PYTHONPATH=C:/Users/michael/safety-protocol/src ^
  C:/Users/michael/safety-protocol/.venv/Scripts/python.exe server.py
#   → http://127.0.0.1:8731

# 2) app
cd agentcover
npm install
npx expo start          # scan QR with Expo Go (Android) or run in emulator
```

The app's `backendUrl` is read from `app.json → extra.backendUrl`. Point it at
your backend (for a device on the same LAN, use your machine's IP).

## RevenueCat

- Keys go in `app.json → extra.revenueCat` (androidApiKey / iosApiKey).
- Entitlements drive the active tier shown in the Coverage tab.
- Offerings map to the four engine tiers; purchasing raises the agent's
  autonomy ceiling via `POST /agent/:id/reset`.

## API (backend)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/bind` | bind an agent to an owner at a coverage tier |
| POST | `/agent/:id/gate` | run an action through the enforcement engine |
| POST | `/agent/:id/killswitch` | freeze the protocol, block all actions |
| POST | `/agent/:id/reset` | re-bind at a new tier (after purchase) |
| GET  | `/agent/:id/status` | binding + monitor state |
| GET  | `/agent/:id/audit` | immutable audit trail |

## Proof it works

Backend enforcement (real engine output):

```
$ curl -X POST .../agent/<id>/gate -d '{"action_type":"pay","target":"0xMerchant","estimated_cost":40}'
{"outcome":"allowed","executed":true}

$ curl -X POST .../agent/<id>/gate -d '{"action_type":"pay","target":"0xStranger","estimated_cost":40}'
{"outcome":"blocked_scope","block_reason":"No scope rule permits action 'pay' on target '0xStranger' — denied by default"}

$ curl -X POST .../agent/<id>/killswitch -d '{"reason":"mobile test"}'
{"state":"frozen"}
$ curl -X POST .../agent/<id>/gate -d '{"action_type":"pay","target":"0xMerchant","estimated_cost":10}'
{"outcome":"blocked_killswitch"}
```

App build: `npx expo export --platform web` → 656 modules bundled, clean export.

## Submission checklist (Devpost)

- [x] App builds: `npx expo export --platform web` (656 modules, clean)
- [x] Native Android project generates: `npx expo prebuild --platform android` (✔)
- [x] EAS build config: `eas.json` (preview/production → AAB, internal track)
- [x] Demo video < 2 min: `captures/agentcover_demo.mp4` (20s, real engine frames)
- [x] Screenshot 1179×2556: `assets/screenshot.png` (replace with live emulator capture)
- [x] 1024×1024 icon: `assets/icon.png`
- [ ] **Publish to Google Play** (needs your $25 dev account + first release Aug 1–Sep 30) — the hard eligibility gate
- [ ] RevenueCat keys + offerings in `app.json → extra.revenueCat` (needs your RC project)
- [ ] Free trial OR promo code for judges
- [ ] #BuildInPublic posts + growth numbers (for Grand Prize)
- [ ] Eligible award categories: Peace Prize, HAMM, Design, #BuildInPublic, Grand

### Re-render the demo video
```bash
cd agentcover
python3 -c "..."  # (see captures/ + render_frames.py)
# frames from live backend: backend must be running on :8731
C:/Users/michael/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe render_frames.py
cd captures && ffmpeg -y -loop 1 -t 4 -i frame1_bind.png -loop 1 -t 4 -i frame2_allow.png \
  -loop 1 -t 4 -i frame3_block.png -loop 1 -t 4 -i frame4_kill.png -loop 1 -t 4 -i frame5_audit.png \
  -filter_complex "[0][1][2][3][4]concat=n=5:v=1:a=0,scale=1180:2556[v]" -map "[v]" -r 30 \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart agentcover_demo.mp4
```
Note: scale to even width (1180) — x264/yuv420p requires even dimensions.

## Honest limitations

- Backend is process-local in the demo (audit trail is the source of truth and
  is exportable). For production, persist agents + audit to a store.
- ChainWarden on-chain gate is simulated in the demo with the same interface as
  production (deployable to Sepolia testnet, free).
- Web build verified; store submission needs a paid Google Play account ($25).
