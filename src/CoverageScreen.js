import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRevenueCat } from "./useRevenueCat";
import { TIERS } from "./api";
import { theme } from "./theme";

export default function CoverageScreen() {
  const { offerings, entitlement, ready, purchase, restore } = useRevenueCat();

  const activeTier = entitlement && Object.keys(entitlement).length
    ? Object.keys(entitlement)[0]
    : "free";

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h}>Coverage</Text>
      <Text style={styles.sub}>
        Your plan sets the agent's bounded-autonomy ceiling in the engine. Higher coverage = wider
        scope and bigger spend budget, enforced at the protocol layer — not a cosmetic badge.
      </Text>

      <View style={styles.current}>
        <Text style={styles.currentLabel}>ACTIVE COVERAGE</Text>
        <Text style={styles.currentTier}>{TIERS[activeTier]?.label || activeTier}</Text>
        <Text style={styles.currentBudget}>${TIERS[activeTier]?.budget} autonomy budget</Text>
      </View>

      {!ready && <ActivityIndicator color={theme.accent} style={{ marginVertical: 12 }} />}

      {offerings ? (
        <>
          {Object.entries(TIERS).filter(([k]) => k !== "free").map(([k, v]) => {
            const pkg =
              offerings.current?.availablePackages?.find((p) => p.identifier?.includes(k)) ||
              offerings.current?.availablePackages?.[Object.keys(TIERS).filter((t) => t !== "free").indexOf(k)];
            return (
              <Pressable
                key={k}
                style={[styles.card, activeTier === k && styles.cardActive]}
                onPress={() => pkg && purchase(pkg)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierName}>{v.label}</Text>
                  <Text style={styles.tierNote}>{v.note}</Text>
                </View>
                <Text style={styles.price}>
                  {pkg?.product?.priceString || "Subscribe"}
                </Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.restore} onPress={restore}>
            <Text style={styles.restoreText}>Restore purchases</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.muted}>
          RevenueCat not configured in this build. Add your API keys in app.json to enable live
          subscriptions. The backend still enforces tier policy via /bind and /reset.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 12 },
  h: { fontSize: 24, fontWeight: "800", color: theme.text },
  sub: { fontSize: 14, color: theme.muted, lineHeight: 20 },
  current: { backgroundColor: theme.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.accent },
  currentLabel: { fontSize: 11, color: theme.accent, letterSpacing: 1 },
  currentTier: { fontSize: 22, fontWeight: "800", color: theme.text },
  currentBudget: { fontSize: 13, color: theme.muted, marginTop: 2 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border },
  cardActive: { borderColor: theme.accent },
  tierName: { fontSize: 18, fontWeight: "800", color: theme.text },
  tierNote: { fontSize: 12, color: theme.muted, marginTop: 4 },
  price: { fontSize: 15, fontWeight: "800", color: theme.accent },
  restore: { alignItems: "center", marginTop: 6 },
  restoreText: { color: theme.muted, fontSize: 13, textDecorationLine: "underline" },
  muted: { color: theme.muted, fontSize: 13, lineHeight: 18 },
});
