// Backend API base + helper. Auth uses an httpOnly cookie, so every
// request must go out with credentials: "include".

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export interface ApiBody<T> {
  message?: string;
  data?: T;
}

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  body: ApiBody<T> | null;
}

export async function apiPost<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const parsed = (await res.json().catch(() => null)) as ApiBody<T> | null;
  return { ok: res.ok, status: res.status, body: parsed };
}
