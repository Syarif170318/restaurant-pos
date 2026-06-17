import { useEffect, useState, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { getToken } from "./src/lib/auth";
import { api } from "./src/lib/api";
import { LoginScreen } from "./src/screens/LoginScreen";
import { ShiftScreen } from "./src/screens/ShiftScreen";
import { PosScreen } from "./src/screens/PosScreen";
import { PaymentScreen } from "./src/screens/PaymentScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";

export type RootStackParamList = {
  Login: undefined;
  Shift: undefined;
  Pos: undefined;
  Payment: { orderId: string };
  Orders: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);

  const checkShift = useCallback(async () => {
    const res = await api<{ status: string } | null>("/api/shifts");
    const open = !!(res.success && res.data?.status === "open");
    setShiftOpen(open);
    return open;
  }, []);

  useEffect(() => {
    getToken().then(async (t) => {
      if (t) {
        setLoggedIn(true);
        await checkShift();
      }
      setReady(true);
    });
  }, [checkShift]);

  async function handleLogin() {
    setLoggedIn(true);
    await checkShift();
  }

  function handleLogout() {
    setLoggedIn(false);
    setShiftOpen(false);
  }

  if (!ready) return null;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!loggedIn ? (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={handleLogin} />}
          </Stack.Screen>
        ) : !shiftOpen ? (
          <Stack.Screen name="Shift">
            {() => (
              <ShiftScreen
                onShiftReady={() => setShiftOpen(true)}
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Pos">
              {({ navigation }) => (
                <PosScreen
                  onPayment={(orderId) => navigation.navigate("Payment", { orderId })}
                  onOrders={() => navigation.navigate("Orders")}
                  onCloseShift={() => setShiftOpen(false)}
                  onLogout={handleLogout}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Payment">
              {({ route, navigation }) => (
                <PaymentScreen
                  orderId={route.params.orderId}
                  onDone={() => navigation.navigate("Pos")}
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Orders">
              {({ navigation }) => (
                <OrdersScreen
                  onSelect={(orderId) => navigation.navigate("Payment", { orderId })}
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
