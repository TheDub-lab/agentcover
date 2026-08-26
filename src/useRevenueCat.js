// RevenueCat integration: coverage tiers are real subscriptions that unlock
// bounded autonomy in the engine. The native module is wired at build time only
// when react-native-purchases is installed; this wrapper degrades gracefully so
// the app builds and runs without it (dev / store-submission builds).
import { useEffect, useState } from "react";
import Constants from "expo-constants";

const RC = Constants.expoConfig?.extra?.revenueCat || {};
const API_KEYS = { android: RC.androidApiKey, ios: RC.iosApiKey };
const HAS_KEY =
  API_KEYS.android && API_KEYS.android !== "ANDROID_REVENUECAT_KEY";

// Lazy require so the native module is never statically linked in builds that
// don't include react-native-purchases (avoids Gradle native-module failures).
function getPurchases() {
  try {
    return require("react-native-purchases");
  } catch {
    return null;
  }
}

export function useRevenueCat() {
  const [offerings, setOfferings] = useState(null);
  const [entitlement, setEntitlement] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!HAS_KEY) return; // no key -> free tier, app fully usable
        const Purchases = getPurchases();
        if (!Purchases) return;
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        if (API_KEYS.android)
          await Purchases.configure({ apiKey: API_KEYS.android });
        const offs = await Purchases.getOfferings();
        const cust = await Purchases.getCustomerInfo();
        if (!active) return;
        setOfferings(offs);
        setEntitlement(cust?.entitlements?.active);
      } catch (e) {
        console.warn("RevenueCat not configured:", e?.message);
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const purchase = async (pkg) => {
    const Purchases = getPurchases();
    if (!Purchases) throw new Error("RevenueCat not available in this build");
    const info = await Purchases.purchasePackage(pkg);
    setEntitlement(info.customerInfo?.entitlements?.active);
    return info;
  };

  const restore = async () => {
    const Purchases = getPurchases();
    if (!Purchases) throw new Error("RevenueCat not available in this build");
    const info = await Purchases.restorePurchases();
    setEntitlement(info.entitlements?.active);
    return info;
  };

  return { offerings, entitlement, ready, purchase, restore };
}
