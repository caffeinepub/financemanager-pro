import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";

// Start initializing the anonymous actor immediately when the app loads.
// This way, by the time the user opens any dialog, the actor is already ready.
let _actorPromise: Promise<backendInterface> = createActorWithConfig();

/**
 * Returns the pre-initialized backend actor.
 * Awaiting this is nearly instant if already resolved, or waits up to ~1s on first load.
 */
export function getActorAsync(): Promise<backendInterface> {
  return _actorPromise;
}

/** Reset the actor (e.g. when identity changes). */
export function resetActor(
  options?: Parameters<typeof createActorWithConfig>[0],
): void {
  _actorPromise = createActorWithConfig(options);
}
