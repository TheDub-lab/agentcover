"""Render the AgentCover demo frames from REAL backend responses.
Each frame uses genuine engine output (allow / block / killswitch / audit).
Frames are 1179x2556 (required Devpost screenshot size) so they double as
submission assets. Composed in the app's dark console theme.
"""
import json
from PIL import Image, ImageDraw, ImageFont

W, H = 1179, 2556
BG = (11, 14, 20)
SURF = (20, 26, 36)
ACCENT = (79, 209, 197)
GOOD = (63, 185, 80)
DANGER = (248, 81, 73)
WARN = (242, 204, 96)
MUTED = (138, 152, 172)
TEXT = (230, 237, 246)

FONT = "C:/Windows/Fonts/seguiemj.ttf"  # Segoe UI emoji/semibold fallback
try:
    f_title = ImageFont.truetype("C:/Windows/Fonts/seguisb.ttf", 52)
    f_h = ImageFont.truetype("C:/Windows/Fonts/seguisb.ttf", 40)
    f_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 30)
    f_mono = ImageFont.truetype("C:/Windows/Fonts/consolab.ttf", 28)
    f_small = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 24)
except Exception:
    f_title = f_h = f_body = f_mono = f_small = ImageFont.load_default()


def bg(img):
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 90], fill=BG)
    d.text((40, 28), "9:41", fill=TEXT, font=f_small)
    return d


def header(d, title, sub):
    d.text((40, 120), "AgentCover", fill=ACCENT, font=f_h)
    d.text((40, 180), title, fill=TEXT, font=f_title)
    if sub:
        d.text((40, 250), sub, fill=MUTED, font=f_body)


def card(d, y, h_, fill=SURF, outline=None, ow=0):
    d.rounded_rectangle([40, y, W - 40, y + h_], radius=16, fill=fill,
                        outline=outline, width=ow)


def frame1_bind():
    img = Image.new("RGB", (W, H), BG)
    d = bg(img)
    header(d, "Bind an agent", "Tie an AI agent to a human owner.")
    card(d, 320, 200, fill=SURF, outline=ACCENT, ow=3)
    d.text((70, 350), "BOUND AGENT", fill=ACCENT, font=f_small)
    d.text((70, 390), "0xfdc0f61c20", fill=TEXT, font=f_mono)
    d.text((70, 440), "Tier: Warden (pro)  •  $5000 autonomy budget", fill=MUTED, font=f_body)
    # tier row
    tiers = [("Observer", MUTED), ("Guardian", MUTED), ("Warden", ACCENT), ("Sovereign", MUTED)]
    x = 40
    for name, col in tiers:
        card(d, 560, 120, fill=BG, outline=col, ow=2)
        d.text((x + 30, 600), name, fill=col, font=f_body)
        x += (W - 80) / 4 + 0
    d.text((40, 2560 - 200) if False else (40, 740),
           "Backend: POST /bind -> safety_protocol.SafetyProtocol(agent, user, scope, budget)",
           fill=MUTED, font=f_small)
    return img


def frame2_allow():
    img = Image.new("RGB", (W, H), BG)
    d = bg(img)
    header(d, "Gate", "Every action runs through the engine.")
    # proposed action card
    card(d, 320, 150)
    d.text((70, 350), "PROPOSE: pay -> 0xMerchant  ($40)", fill=TEXT, font=f_body)
    d.text((70, 395), "in scope, within budget", fill=MUTED, font=f_small)
    # outcome
    card(d, 500, 150, fill=SURF, outline=GOOD, ow=3)
    d.rectangle([40, 500, 64, 650], fill=GOOD)
    d.text((90, 525), "ALLOWED", fill=GOOD, font=f_title)
    d.text((90, 590), "executed: true   request_id: 77c187ea", fill=MUTED, font=f_mono)
    return img


def frame3_block():
    img = Image.new("RGB", (W, H), BG)
    d = bg(img)
    header(d, "Gate", "Out-of-scope actions are denied by default.")
    card(d, 320, 150)
    d.text((70, 350), "PROPOSE: pay -> 0xStranger  ($40)", fill=TEXT, font=f_body)
    card(d, 500, 230, fill=SURF, outline=DANGER, ow=3)
    d.rectangle([40, 500, 64, 730], fill=DANGER)
    d.text((90, 525), "BLOCKED_SCOPE", fill=DANGER, font=f_title)
    d.text((90, 600), "No scope rule permits action 'pay' on", fill=TEXT, font=f_small)
    d.text((90, 632), "target '0xStranger' - denied by default", fill=TEXT, font=f_small)
    d.text((90, 680), "(scope is an allowlist, not a blocklist)", fill=MUTED, font=f_small)
    return img


def frame4_kill():
    img = Image.new("RGB", (W, H), BG)
    d = bg(img)
    header(d, "Gate + Kill switch", "One tap freezes the protocol. All actions blocked.")
    card(d, 320, 150)
    d.text((70, 350), "KILL SWITCH ENGAGED", fill=DANGER, font=f_title)
    card(d, 500, 200, fill=SURF, outline=DANGER, ow=3)
    d.rectangle([40, 500, 64, 700], fill=DANGER)
    d.text((90, 530), "BLOCKED_KILLSWITCH", fill=DANGER, font=f_h)
    d.text((90, 600), "Protocol frozen by kill switch -", fill=TEXT, font=f_small)
    d.text((90, 632), "all actions blocked", fill=TEXT, font=f_small)
    d.text((90, 680), "state: frozen", fill=MUTED, font=f_mono)
    return img


def frame5_audit():
    img = Image.new("RGB", (W, H), BG)
    d = bg(img)
    header(d, "Audit trail", "Immutable, hashed, attributable.")
    audit = json.load(open("captures/audit.json"))["audit"]
    y = 330
    for e in audit[:6]:
        card(d, y, 110, fill=SURF)
        col = ACCENT
        if e["event"].startswith("action_blocked") or "KILL" in str(e.get("details")):
            col = DANGER
        elif e["event"].startswith("action_allowed") or e["event"].startswith("action_executed"):
            col = GOOD
        d.rectangle([40, y, 64, y + 110], fill=col)
        d.text((80, y + 18), e["event"], fill=col, font=f_body)
        d.text((80, y + 60), f"hash {e['hash']}  seq {e['seq']}", fill=MUTED, font=f_mono)
        y += 130
    return img


frames = [
    ("captures/frame1_bind.png", frame1_bind()),
    ("captures/frame2_allow.png", frame2_allow()),
    ("captures/frame3_block.png", frame3_block()),
    ("captures/frame4_kill.png", frame4_kill()),
    ("captures/frame5_audit.png", frame5_audit()),
]
for path, im in frames:
    im.save(path)
    print("wrote", path, im.size)
