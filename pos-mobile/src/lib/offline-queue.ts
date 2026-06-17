import * as SecureStore from "expo-secure-store";

const QUEUE_KEY = "pos_offline_queue";

export interface QueuedRequest {
  id: string;
  path: string;
  method: string;
  body: string;
  createdAt: string;
}

export async function getQueue(): Promise<QueuedRequest[]> {
  const raw = await SecureStore.getItemAsync(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function enqueue(path: string, method: string, body: object) {
  const queue = await getQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    path,
    method,
    body: JSON.stringify(body),
    createdAt: new Date().toISOString(),
  });
  await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(queue));
}

export async function flushQueue(
  fetcher: (path: string, method: string, body: string) => Promise<boolean>,
): Promise<number> {
  const queue = await getQueue();
  const remaining: QueuedRequest[] = [];
  let synced = 0;
  for (const item of queue) {
    const ok = await fetcher(item.path, item.method, item.body);
    if (ok) synced++;
    else remaining.push(item);
  }
  await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(remaining));
  return synced;
}
