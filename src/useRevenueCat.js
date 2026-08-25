// RevenueCat integration: coverage tiers are real subscriptions that unlock
// bounded autonomy in the engine. Configured at runtime (no config plugin needed).
import { useEffect, useState } from "react";
import Purchases from "react-native-purchases";
import Constants from "expo-constants";

const RC = Constants.expoConfig?.extra?.revenueCat || {};
const API_KEYS = { android: RC.androidApiKey, ios: RC.iosApiKey };

export function useRevenueCat() {
  const [offerings, setOfferings] = useState(null);
  const [entitlement, setEntitlement] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const key = API_KEYS.android || API_KEYS.ios;
        if (key && key !== "ANDROID_REVENUECAT_KEY" && key !== "IOS_REVENUECAT_KEY") {
          Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
          if (API_KEYS.android) await Purchases.configure({ apiKey: API_KEYS.android });
          const offs = await Purchases.getOfferings();
          const cust = await Purchases.getCustomerInfo();
          if (!active) return;
          setOfferings(offs);
          setEntitlement(cust?.entitlements?.active);
        }
      } catch (e) {
        // No RevenueCat key in dev: degrade gracefully, app still fully usable
        // against the backend with the free tier.
        console.warn("RevenueCat not configured:", e.message);
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => { active = false; };
  }, []);

  const purchase = async (pkg) => {
    try {
      const info = await Purchases.purchasePackage(pkg);
      setEntitlement(info.customerInfo?.entitlements?.active);
      return info;
    } catch (e) {
      throw e;
    }
  };

  const restore = async () => {
    const info = await Purchases.restorePurchases();
    setEntitlement(info.entitlements?.active);
    return info;
  };

  return { offerings, entitlement, ready, purchase, restore };
}
