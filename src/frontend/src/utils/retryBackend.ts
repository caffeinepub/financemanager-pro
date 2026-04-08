import { getActorAsync, resetActor } from "./actorStore";

/**
 * Retries a backend call up to `maxAttempts` times when the canister is stopped (IC0508).
 * On a stopped-canister error it resets the actor and waits briefly before retrying.
 */
export async function retryBackendCall<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isStoppedError =
        msg.includes("is stopped") ||
        msg.includes("IC0508") ||
        msg.includes("stopped");
      if (!isStoppedError || attempt === maxAttempts) {
        throw err;
      }
      // Reset actor so the next attempt gets a fresh connection
      resetActor();
      // Wait before retrying: 2s, 4s
      await new Promise((res) => setTimeout(res, attempt * 2000));
      // Pre-warm the actor
      await getActorAsync().catch(() => {});
    }
  }
  throw lastError;
}
