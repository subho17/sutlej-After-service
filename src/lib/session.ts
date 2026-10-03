// Single source of truth for "does this browser hold a valid API session?".
//
// Every backend route sits behind `requireAuth`, so a tab without the
// httpOnly `sutlej_token` cookie gets a 401 on every call. The portals used
// to read that 401 as "the list is empty" and render it as fact — hiding
// every order behind a sign-in problem they never mentioned — while polling
// kept re-asking an endpoint that could never succeed.
//
// The API layer reports each response here; <AuthGuard/> turns a negative
// answer into a redirect to that portal's login page, and the polling loops
// skip their tick so a signed-out tab stops hammering the server.

export type SessionStatus = "unknown" | "signed-in" | "signed-out";

let status: SessionStatus = "unknown";
const listeners = new Set<(status: SessionStatus) => void>();

export function getSessionStatus(): SessionStatus {
  return status;
}

export function subscribeSession(listener: (status: SessionStatus) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setStatus(next: SessionStatus): void {
  if (status === next) return;
  status = next;
  for (const listener of listeners) listener(status);
}

/** Reported by the API layer when an endpoint answered 401. */
export function reportUnauthorized(): void {
  setStatus("signed-out");
}

/** Reported by the API layer after any successful authenticated call. */
export function reportAuthorized(): void {
  setStatus("signed-in");
}

/**
 * Forget the cached answer — called after login and logout, both of which
 * change the cookie and make whatever we believed stale.
 */
export function resetSession(): void {
  setStatus("unknown");
}
