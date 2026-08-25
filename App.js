import "react-native-gesture-handler";
import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "react-native";
import BindScreen from "./src/BindScreen";
import GateScreen from "./src/GateScreen";
import AuditScreen from "./src/AuditScreen";
import CoverageScreen from "./src/CoverageScreen";
import { theme } from "./src/theme";

const Tab = createBottomTabNavigator();

export default function App() {
  const [agentId, setAgentId] = useState(null);
  const [tier, setTier] = useState("free");

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: "800" },
          tabBarStyle: { backgroundColor: theme.bg, borderTopColor: theme.border },
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.muted,
        }}
      >
        <Tab.Screen name="Bind">
          {() => <BindScreen agentId={agentId} setAgentId={setAgentId} tier={tier} setTier={setTier} />}
        </Tab.Screen>
        <Tab.Screen name="Gate">
          {() => <GateScreen agentId={agentId} />}
        </Tab.Screen>
        <Tab.Screen name="Audit">
          {() => <AuditScreen agentId={agentId} />}
        </Tab.Screen>
        <Tab.Screen name="Coverage">
          {() => <CoverageScreen />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
