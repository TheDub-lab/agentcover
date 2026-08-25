// Shared API client for the AgentCover backend (real safety_protocol engine).
import Constants from "expo-constants";

const BACKEND = Constants.expoConfig?.extra?.backendUrl || "http://127.0.0.1:8731";

export const TIERS = {
  free: { label: "Observer", budget: 50, note: "Watch your agent. No autonomy spend." },
  basic: { label: "Guardian", budget: 500, note: "Live pay gates, small budget." },
  pro: { label: "Warden", budget: 5000, note: "Wide scope, real autonomy." },
  empowered: { label: "Sovereign", budget: 50000, note: "Maximum bounded autonomy." },
};

async function req(method, path, body) {
  const res = await fetch(BACKEND + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const api = {
  health: () => req("GET", "/health"),
  bind: (user_id, tier) => req("POST", "/bind", { user_id, tier }),
  gate: (agentId, action) => req("POST", `/agent/${agentId}/gate`, action),
  killswitch: (agentId, reason) => req("POST", `/agent/${agentId}/killswitch`, { reason }),
  reset: (agentId, tier) => req("POST", `/agent/${agentId}/reset`, { tier }),
  status: (agentId) => req("GET", `/agent/${agentId}/status`),
  audit: (agentId) => req("GET", `/agent/${agentId}/audit`),
};
