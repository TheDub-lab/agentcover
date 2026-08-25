import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { api } from "./api";
import { theme } from "./theme";

const PRESETS = [
  { label: "Pay merchant (in scope)", action_type: "pay", target: "0xMerchant", estimated_cost: 40 },
  { label: "Pay stranger (out of scope)", action_type: "pay", target: "0xStranger", estimated_cost: 40 },
  { label: "Over budget", action_type: "pay", target: "0xMerchant", estimated_cost: 9999 },
  { label: "Read own status", action_type: "read", target: "agent.local/status", estimated_cost: 0 },
];

const OUTCOME_COLOR = {
  allowed: theme.good,
  blocked_scope: theme.danger,
  blocked_budget: theme.danger,
  blocked_killswitch: theme.danger,
  pending_approval: theme.warn,
};

export default function GateScreen({ agentId }) {
  const [action, setAction] = useState(PRESETS[0]);
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!agentId) return;
    setBusy(true);
    try {
      const res = await api.gate(agentId, action);
      setLog((l) => [{ ...res, action, ts: Date.now() }, ...l].slice(0, 30));
    } finally {
      setBusy(false);
    }
  };

  const kill = async () => {
    if (!agentId) return;
    setBusy(true);
    try {
      await api.killswitch(agentId, "mobile kill switch");
      setLog((l) => [{ outcome: "blocked_killswitch", note: "KILL SWITCH ENGAGED", ts: Date.now() }, ...l].slice(0, 30));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h}>Gate</Text>
      <Text style={styles.sub}>Every tap runs the real engine. The agent never acts without passing the protocol.</Text>

      {!agentId && <Text style={styles.warn}>Bind an agent on the Bind tab first.</Text>}

      <Text style={styles.label}>Propose an action</Text>
      {PRESETS.map((p) => (
        <Pressable
          key={p.label}
          style={[styles.preset, action.label === p.label && styles.presetActive]}
          onPress={() => setAction(p)}
          disabled={!agentId}
        >
          <Text style={styles.presetName}>{p.label}</Text>
          <Text style={styles.presetMeta}>{p.action_type} → {p.target} (${p.estimated_cost})</Text>
        </Pressable>
      ))}

      <View style={styles.row}>
        <Pressable style={[styles.btn, styles.go]} onPress={run} disabled={!agentId || busy}>
          <Text style={styles.btnText}>Run through gate</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.kill]} onPress={kill} disabled={!agentId || busy}>
          <Text style={styles.btnText}>Kill switch</Text>
        </Pressable>
      </View>

      {busy && <ActivityIndicator color={theme.accent} style={{ marginVertical: 8 }} />}

      <Text style={styles.label}>Live enforcement log</Text>
      {log.length === 0 && <Text style={styles.muted}>No events yet.</Text>}
      {log.map((e, i) => (
        <View key={i} style={[styles.evt, { borderLeftColor: OUTCOME_COLOR[e.outcome] || theme.muted }]}>
          <Text style={[styles.evtOutcome, { color: OUTCOME_COLOR[e.outcome] || theme.muted }]}>
            {(e.outcome || "").toUpperCase()}
          </Text>
          {e.action && <Text style={styles.evtMeta}>{e.action.action_type} → {e.action.target}</Text>}
          {e.block_reason && <Text style={styles.evtReason}>{e.block_reason}</Text>}
          {e.note && <Text style={styles.evtReason}>{e.note}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 10 },
  h: { fontSize: 24, fontWeight: "800", color: theme.text },
  sub: { fontSize: 14, color: theme.muted, lineHeight: 20 },
  warn: { color: theme.warn, fontSize: 14 },
  label: { fontSize: 12, color: theme.muted, textTransform: "uppercase", letterSpacing: 1, marginTop: 8 },
  preset: { backgroundColor: theme.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: theme.border },
  presetActive: { borderColor: theme.accent },
  presetName: { fontSize: 15, fontWeight: "700", color: theme.text },
  presetMeta: { fontSize: 12, color: theme.muted, fontFamily: "monospace", marginTop: 2 },
  row: { flexDirection: "row", gap: 10, marginTop: 6 },
  btn: { flex: 1, borderRadius: 10, padding: 14, alignItems: "center" },
  go: { backgroundColor: theme.accent },
  kill: { backgroundColor: theme.danger },
  btnText: { color: "#06121A", fontWeight: "800", fontSize: 15 },
  muted: { color: theme.muted },
  evt: { backgroundColor: theme.surface, borderRadius: 8, padding: 12, borderLeftWidth: 4, marginBottom: 8 },
  evtOutcome: { fontSize: 15, fontWeight: "800" },
  evtMeta: { fontSize: 12, color: theme.muted, fontFamily: "monospace", marginTop: 2 },
  evtReason: { fontSize: 12, color: theme.text, marginTop: 4, lineHeight: 16 },
});
