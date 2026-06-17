import { API_BASE_URL } from "../config";
import { getToken } from "./auth";
import { enqueue, flushQueue, getQueue } from "./offline-queue";

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; error?: string; offline?: boolean }> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const method = options.method ?? "GET";
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    return res.json();
  } catch {
    if (isMutating && options.body) {
      await enqueue(path, method, JSON.parse(options.body as string));
      return { success: true, offline: true, data: { queued: true } as T };
    }
    return { success: false, error: "Network error" };
  }
}

export async function syncOfflineQueue(): Promise<number> {
  return flushQueue(async (path, method, body) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body,
      });
      const json = await res.json();
      return !!json.success;
    } catch {
      return false;
    }
  });
}

export async function offlineQueueSize(): Promise<number> {
  return (await getQueue()).length;
}

export async function fetchText(path: string): Promise<string | null> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) return null;
  return res.text();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
