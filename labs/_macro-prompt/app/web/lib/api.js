// Thin client over the local engine API. Same-origin; no external calls.
async function j(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.status);
  return res.json();
}

export const api = {
  status: (engine) => j("GET", "/api/status" + (engine ? "?engine=" + encodeURIComponent(engine) : "")),
  extract: (text, spans, engine, bypassGate) => j("POST", "/api/extract", { text, spans, engine, bypassGate }),
  learn: (snippets) => j("POST", "/api/learn", { snippets }),
  library: () => j("GET", "/api/library"),
  removeSnippet: (id) => j("DELETE", "/api/library/" + encodeURIComponent(id)),
  neighbors: (id) => j("GET", "/api/library/" + encodeURIComponent(id) + "/neighbors"),
  getFilters: () => j("GET", "/api/filters"),
  putFilters: (cfg) => j("PUT", "/api/filters", cfg),
  macros: () => j("GET", "/api/macros"),
  saveMacro: (name, items) => j("POST", "/api/macros", { name, items }),
  deleteMacro: (id) => j("DELETE", "/api/macros/" + encodeURIComponent(id)),
  contributePreview: (id) => j("POST", "/api/contribute/preview", { id }),
  contribute: (id) => j("POST", "/api/contribute", { id }),
  models: () => j("GET", "/api/models"),
};
