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

const DEFAULT_TIMEOUT_MS = 45000;

async function request<T>(
  path: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "The server is taking too long to respond (it may be waking up). Please wait a moment and try again."
      );
    }
    throw new Error("Unable to reach server. Please try again.");
  } finally {
    clearTimeout(timer);
  }

  const parsed = (await res.json().catch(() => null)) as ApiBody<T> | null;
  return { ok: res.ok, status: res.status, body: parsed };
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ApiResult<T>> {
  return request<T>(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    timeoutMs
  );
}

export async function apiGet<T>(
  path: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ApiResult<T>> {
  return request<T>(path, { method: "GET" }, timeoutMs);
}

export async function apiDelete<T>(
  path: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ApiResult<T>> {
  return request<T>(path, { method: "DELETE" }, timeoutMs);
}
