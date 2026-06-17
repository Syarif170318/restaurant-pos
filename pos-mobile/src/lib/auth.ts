import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "pos_token";
const USER_KEY = "pos_user";

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  outletId?: string;
  outletName?: string;
  outletCode?: string;
}

export async function saveSession(token: string, user: User) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}
