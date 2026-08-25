import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { api, TIERS } from "./api";
import { theme } from "./theme";

export default function BindScreen({ agentId, setAgentId, tier, setTier }) {
  const [userId, setUserId] = useState("michael");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const bind = async (t) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await api.bind(userId, t);
      setAgentId(res.agent_id);
      setTier(t);
    } catch (e) {
      setErr(e.message || "bind failed");
    } finally {
      setBusy(false);
    }
  };

  const reset = async (t) => {
    if (!agentId) return bind(t);
    setBusy(true);
    setErr(null);
    try {
      await api.reset(agentId, t);
      setTier(t);
    } catch (e) {
      setErr(e.message || "reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h}>Bind an agent</Text>
      <Text style={styles.sub}>
        Tie an AI agent to a human. Every action it proposes runs through the safety_protocol
        enforcement engine — scope, budget, approval, and kill switch. Monetization is the unlock:
        a paid plan literally raises the agent's bounded autonomy, enforced by the engine.
      </Text>

      <Text style={styles.label}>Owner (user_id)</Text>
      <TextInput style={styles.input} value={userId} onChangeText={setUserId} autoCapitalize="none" />

      {agentId ? (
        <View style={styles.bound}>
          <Text style={styles.boundLabel}>BOUND AGENT</Text>
          <Text style={styles.boundId}>{agentId}</Text>
          <Text style={styles.boundTier}>Tier: {TIERS[tier]?.label} ({tier})</Text>
        </View>
      ) : (
        <Text style={styles.muted}>No agent bound yet.</Text>
      )}

      <Text style={styles.label}>Coverage tier (sets the engine's autonomy ceiling)</Text>
      <View style={styles.tiers}>
        {Object.entries(TIERS).map(([k, v]) => (
          <Pressable
            key={k}
            style={[styles.tierCard, tier === k && styles.tierActive]}
            onPress={() => (agentId ? reset(k) : bind(k))}
            disabled={busy}
          >
            <Text style={styles.tierName}>{v.label}</Text>
            <Text style={styles.tierBudget}>${v.budget} budget</Text>
            <Text style={styles.tierNote}>{v.note}</Text>
          </Pressable>
        ))}
      </View>

      {busy && <ActivityIndicator color={theme.accent} style={{ marginVertical: 12 }} />}
      {err && <Text style={styles.err}>{err}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 12 },
  h: { fontSize: 24, fontWeight: "800", color: theme.text },
  sub: { fontSize: 14, color: theme.muted, lineHeight: 20 },
  label: { fontSize: 12, color: theme.muted, textTransform: "uppercase", letterSpacing: 1, marginTop: 8 },
  input: { backgroundColor: theme.surface, borderRadius: 10, padding: 12, color: theme.text, borderWidth: 1, borderColor: theme.border },
  muted: { color: theme.muted },
  bound: { backgroundColor: theme.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: theme.accent },
  boundLabel: { fontSize: 11, color: theme.accent, letterSpacing: 1 },
  boundId: { fontSize: 16, fontWeight: "700", color: theme.text, fontFamily: "monospace" },
  boundTier: { fontSize: 13, color: theme.muted, marginTop: 4 },
  tiers: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tierCard: { width: "47%", backgroundColor: theme.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.border },
  tierActive: { borderColor: theme.accent },
  tierName: { fontSize: 17, fontWeight: "800", color: theme.text },
  tierBudget: { fontSize: 13, color: theme.accent, marginTop: 4 },
  tierNote: { fontSize: 12, color: theme.muted, marginTop: 6, lineHeight: 16 },
  err: { color: theme.danger, fontSize: 13 },
});
