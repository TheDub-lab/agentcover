import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { api } from "./api";
import { theme } from "./theme";

export default function AuditScreen({ agentId }) {
  const [entries, setEntries] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!agentId) return;
    setBusy(true);
    try {
      const res = await api.audit(agentId);
      setEntries(res.audit || []);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, [agentId]);

  return (
    <ScrollView
      contentContainerStyle={styles.wrap}
      refreshControl={<RefreshControl refreshing={busy} onRefresh={load} tintColor={theme.accent} />}
    >
      <Text style={styles.h}>Audit trail</Text>
      <Text style={styles.sub}>Immutable, attributable log of every binding, gate decision, and kill-switch event. This is the insurance evidence.</Text>
      {!agentId && <Text style={styles.warn}>Bind an agent on the Bind tab first.</Text>}
      {agentId && busy && <ActivityIndicator color={theme.accent} style={{ marginVertical: 8 }} />}
      {entries.length === 0 && agentId && <Text style={styles.muted}>No audit entries yet.</Text>}
      {entries.map((e, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.ts}>{new Date((e.ts || 0) * 1000).toLocaleTimeString()}</Text>
          <View style={styles.body}>
            <Text style={styles.evt}>{e.event}</Text>
            {e.details && <Text style={styles.detail}>{JSON.stringify(e.details)}</Text>}
          </View>
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
  muted: { color: theme.muted },
  row: { flexDirection: "row", gap: 10, backgroundColor: theme.surface, borderRadius: 8, padding: 10, marginBottom: 6 },
  ts: { fontSize: 11, color: theme.muted, fontFamily: "monospace", width: 70 },
  body: { flex: 1 },
  evt: { fontSize: 14, fontWeight: "700", color: theme.accent },
  detail: { fontSize: 11, color: theme.muted, fontFamily: "monospace", marginTop: 2 },
});
