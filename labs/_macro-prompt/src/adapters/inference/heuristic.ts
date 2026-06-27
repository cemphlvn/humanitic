// Heuristic engine — offline, deterministic, zero dependencies.
// It honors the caller's `fallback` recipe. This is the default, so the whole loop
// runs end-to-end on a MacBook with no network and no API key — the offline ethic.

import type { CompleteRequest, InferenceAdapter } from "./index.ts";

export class HeuristicAdapter implements InferenceAdapter {
  id = "heuristic";
  online = false;
  async complete<T>(req: CompleteRequest<T>): Promise<T> {
    return await req.fallback();
  }
}
