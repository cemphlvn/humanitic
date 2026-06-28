// Macro-Prompt Lab — the judgment lab. One screen: paste → mark → run → review each
// candidate (keep/reject/edit/switch/inspect/explain) → learn only the approved set.
// Thin client over the real engine + .local store. Custom domain components, Preact+htm.
import { render } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { html } from "./lib/html.js";
import { api } from "./lib/api.js";
import { Highlighter, CATEGORIES } from "./lib/highlight.js";
import { Button, Panel, KindBadge, RelationBadge, ScoreBadge, EmptyState, InlineEditor, fuzzy } from "./lib/ui.js";

const ENGINES = ["heuristic", "server", "mlx", "claude"];

// ---------------- Engine status (honest) ----------------
function EngineBar({ status, engine, onEngine, onOpen }) {
  const e = status?.engine;
  const dotClass = !e ? "" : e.online ? "warn" : e.resolved === "heuristic" ? "" : "live";
  return html`
    <div class="enginebar">
      <span class=${"dot " + dotClass}></span>
      <select class="engine-select" value=${engine} onChange=${(ev) => onEngine(ev.target.value)} title="requested engine">
        ${ENGINES.map((n) => html`<option value=${n}>${n}</option>`)}
      </select>
      ${e && html`<span class="engine-note">
        ${e.fellBack ? html`<b class="fell">fell back → ${e.resolved}</b>` : html`<b>${e.resolved}</b>`}
        ${e.model ? " · " + e.model : ""} ${e.online ? "· leaves machine" : "· local"}
        <span class="engine-why">${e.note}</span>
      </span>`}
      <button class="link" onClick=${() => onOpen("models")}>models</button>
    </div>`;
}

// ---------------- Editor + highlight/annotation ----------------
function Editor({ text, onText, onRun, busy }) {
  const [mode, setMode] = useState("edit"); // edit | mark
  const [marks, setMarks] = useState([]);
  const [cat, setCat] = useState("important");
  const passage = useRef(null);
  const hl = useRef(null);

  useEffect(() => {
    if (mode !== "mark" || !passage.current) return;
    const h = new Highlighter(passage.current, (m) => {
      if (confirm(`Mark “${text.slice(m.start, m.end).slice(0, 40)}” — remove it?`)) { h.remove(m.id); setMarks(h.serialize()); }
    });
    h.setMarks(marks);
    hl.current = h;
  }, [mode]); // re-init when entering mark mode

  const addMark = () => { const m = hl.current?.markSelection(cat); if (m) setMarks(hl.current.serialize()); };
  const spans = () => hl.current?.spans() || marks.map((m) => ({ start: m.start, end: m.end }));

  return html`
    <div class="editor">
      <div class="editor-tabs">
        <button class=${"seg " + (mode === "edit" ? "on" : "")} onClick=${() => setMode("edit")}>Write</button>
        <button class=${"seg " + (mode === "mark" ? "on" : "")} onClick=${() => setMode("mark")}>Mark spans</button>
      </div>
      ${mode === "edit"
        ? html`<textarea class="paste" placeholder="Paste a prompt, a message, a paragraph — anything with intent."
                 value=${text} onInput=${(e) => onText(e.target.value)}></textarea>`
        : html`<div class="mark-wrap">
            <div class="mark-toolbar">
              ${Object.entries(CATEGORIES).map(([k, v]) => html`
                <button class=${"cat " + (cat === k ? "on" : "")} style=${`--c:${v.color}`} onClick=${() => setCat(k)}>${v.label}</button>`)}
              <button class="btn ghost small" onClick=${addMark} title="mark the current selection">Mark selection</button>
            </div>
            <div class="passage" ref=${passage}>${text}</div>
            <p class="hint">${hl.current && hl.current.supported === false ? "Highlight API unavailable — use Write mode." : "Select text, then click Mark selection. Click a mark to remove it."} ${marks.length ? `· ${marks.length} mark(s)` : ""}</p>
          </div>`}
      <div class="run-row">
        <${Button} kind="spot" onClick=${() => onRun(null)} disabled=${busy || !text.trim()}>${busy ? "Running…" : "Run ▷"}<//>
        ${mode === "mark" && marks.length ? html`<${Button} kind="ghost" onClick=${() => onRun(spans(), true)} disabled=${busy} title="you marked these — extract them as-is">Run marked spans<//>` : null}
        <span class="kbd-hint">⌘K for commands</span>
      </div>
    </div>`;
}

// ---------------- Snippet card (the Result Review Kit) ----------------
function SnippetCard({ c, approved, onKeep, onReject, onPatch, onSwitch, onMap }) {
  const [showSrc, setShowSrc] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  return html`
    <div class=${"card " + (approved ? "kept " : "") + c.kind}>
      <div class="card-top">
        <span class="kindbtn" title="switch concept ↔ intent" onClick=${onSwitch}><${KindBadge} kind=${c.kind} /></span>
        <${InlineEditor} value=${c.gloss} onSave=${(v) => onPatch({ gloss: v })} multiline=${c.kind === "intent"} cls="gloss" />
        <span class="card-badges">
          <${ScoreBadge} score=${c.score} title=${c.score.why} />
          <${RelationBadge} relation=${c.placement.relation} onClick=${() => onMap(c)} />
        </span>
      </div>
      ${c.kind === "intent" && html`<div class="movestamp"><span class="stamp">move</span>
        <${InlineEditor} value=${c.move || "directive"} onSave=${(v) => onPatch({ move: v })} cls="move" /></div>`}
      <div class="card-actions">
        <button class=${"act keep " + (approved ? "on" : "")} onClick=${onKeep}>${approved ? "✓ kept" : "keep"}</button>
        <button class="act reject" onClick=${onReject}>reject</button>
        <button class="act muted" onClick=${() => setShowWhy(!showWhy)}>why score</button>
        <button class="act muted" onClick=${() => setShowSrc(!showSrc)}>source</button>
      </div>
      ${showWhy && html`<p class="reveal">${c.score.why}</p>`}
      ${showSrc && html`<p class="reveal src">“${c.source}”</p>`}
    </div>`;
}

// ---------------- Rejection explorer ----------------
function RejectionExplorer({ rejected, onOverride, onMakeRule }) {
  const groups = {};
  for (const r of rejected) (groups[r.failedAssumption || "other"] ||= []).push(r);
  if (!rejected.length) return html`<${EmptyState}>Nothing set aside.<//>`;
  return html`<div class="rejex">
    ${Object.entries(groups).map(([gate, items]) => html`
      <div class="rej-group">
        <div class="rej-gate">${gate} <span class="rej-n">${items.length}</span></div>
        ${items.map((r) => html`<div class="rej-item">
          <div class="rej-frag">“${r.text.length > 90 ? r.text.slice(0, 90) + "…" : r.text}”</div>
          <div class="rej-acts">
            <button class="act muted" onClick=${() => onOverride(r.text)}>override & keep</button>
            <button class="act muted" onClick=${() => onMakeRule(r.text)}>make rule</button>
          </div>
        </div>`)}
      </div>`)}
  </div>`;
}

// ---------------- Ontology mini-map ----------------
function OntologyMap({ data, onClose }) {
  const [cmp, setCmp] = useState(null);
  const cx = 150, cy = 130, R = 95;
  const ns = data.neighbors.slice(0, 6);
  return html`<div class="overlay" onClick=${onClose}><div class="sheet map" onClick=${(e) => e.stopPropagation()}>
    <header class="sheet-h"><span class="eyebrow">Ontology · ${data.relation}</span><button class="x" onClick=${onClose}>×</button></header>
    <svg viewBox="0 0 300 260" class="minimap">
      ${ns.map((n, i) => { const a = (i / Math.max(1, ns.length)) * Math.PI * 2 - Math.PI / 2; const d = R * (1.05 - Math.min(0.9, n.score)); const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        return html`<g><line x1=${cx} y1=${cy} x2=${x} y2=${y} class="edge" /><text x=${(cx + x) / 2} y=${(cy + y) / 2 - 3} class="edge-l">${n.score.toFixed(2)}</text>
          <circle cx=${x} cy=${y} r="9" class=${"node " + n.snippet.kind} onClick=${() => setCmp(n)} /></g>`; })}
      <circle cx=${cx} cy=${cy} r="13" class="node center" />
    </svg>
    <div class="map-legend"><b>${data.center.gloss}</b> — nearest by meaning; closer = more similar. Click a neighbor to compare.</div>
    ${ns.length === 0 && html`<${EmptyState}>Novel — nothing close in your library yet.<//>`}
    ${cmp && html`<div class="compare">
      <div class="cmp-col"><span class="eyebrow">this</span><p>${data.center.gloss}</p></div>
      <div class="cmp-mid">${cmp.score.toFixed(2)}<br/>similar</div>
      <div class="cmp-col"><span class="eyebrow">neighbor</span><p>${cmp.snippet.gloss}</p></div>
    </div>`}
  </div></div>`;
}

// ---------------- Command bar ----------------
function CommandBar({ actions, onClose }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const list = fuzzy(actions, q, (a) => a.label);
  const go = (a) => { onClose(); a.run(); };
  return html`<div class="overlay top" onClick=${onClose}><div class="sheet cmd" onClick=${(e) => e.stopPropagation()}>
    <input ref=${ref} class="cmd-input" placeholder="Type a command…" value=${q}
      onInput=${(e) => { setQ(e.target.value); setI(0); }}
      onKeyDown=${(e) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setI((i + 1) % Math.max(1, list.length)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setI((i - 1 + list.length) % Math.max(1, list.length)); }
        else if (e.key === "Enter") { e.preventDefault(); list[i] && go(list[i]); }
        else if (e.key === "Escape") onClose();
      }} />
    <ul class="cmd-list">
      ${list.map((a, idx) => html`<li class=${idx === i ? "on" : ""} onMouseEnter=${() => setI(idx)} onClick=${() => go(a)}>
        <span>${a.label}</span><span class="cmd-hint">${a.hint || ""}</span></li>`)}
      ${!list.length && html`<li class="muted">no match</li>`}
    </ul>
  </div></div>`;
}

function Sheet({ title, onClose, children, wide }) {
  return html`<div class="overlay" onClick=${onClose}><div class=${"sheet " + (wide ? "wide" : "")} onClick=${(e) => e.stopPropagation()}>
    <header class="sheet-h"><span class="eyebrow">${title}</span><button class="x" onClick=${onClose}>×</button></header>
    <div class="sheet-b">${children}</div>
  </div></div>`;
}

// ======================= App =======================
function App() {
  const [text, setText] = useState("");
  const [engine, setEngine] = useState("heuristic");
  const [status, setStatus] = useState(null);
  const [cands, setCands] = useState([]);
  const [approved, setApproved] = useState({});
  const [rejected, setRejected] = useState([]);
  const [library, setLibrary] = useState([]);
  const [filters, setFilters] = useState(null);
  const [macros, setMacros] = useState([]);
  const [tray, setTray] = useState([]);
  const [overlay, setOverlay] = useState(null);
  const [map, setMap] = useState(null);
  const [models, setModels] = useState([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const flash = useCallback((m) => { setToast(m); clearTimeout(flash._t); flash._t = setTimeout(() => setToast(""), 1800); }, []);

  const loadStatus = useCallback((eng) => api.status(eng || engine).then(setStatus).catch(() => {}), [engine]);
  useEffect(() => { loadStatus(); }, [engine]);
  useEffect(() => { api.library().then((d) => setLibrary(d.snippets)).catch(() => {}); api.getFilters().then(setFilters).catch(() => {}); api.macros().then((d) => setMacros(d.macros)).catch(() => {}); }, []);

  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOverlay((o) => (o === "cmd" ? null : "cmd")); } if (e.key === "Escape") setOverlay(null); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);

  const run = async (spans, bypass = false) => {
    setBusy(true);
    try {
      const r = await api.extract(text, spans, engine, bypass);
      setCands(r.candidates); setApproved({}); setRejected(r.rejected); loadStatus();
      flash(`${r.candidates.length} candidate(s), ${r.rejected.length} set aside`);
    } catch (e) { flash("run failed: " + e.message); } finally { setBusy(false); }
  };
  const override = async (frag) => {
    setBusy(true);
    try { const r = await api.extract(frag, null, engine, true); setCands((c) => [...c, ...r.candidates]); flash(`+${r.candidates.length} from override`); }
    catch (e) { flash(e.message); } finally { setBusy(false); }
  };

  const patch = (id, p) => setCands((cs) => cs.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const switchKind = (id) => setCands((cs) => cs.map((c) => (c.id === id ? { ...c, kind: c.kind === "concept" ? "intent" : "concept" } : c)));
  const keep = (id) => setApproved((a) => ({ ...a, [id]: !a[id] }));
  const reject = (id) => { setCands((cs) => cs.filter((c) => c.id !== id)); setApproved((a) => { const n = { ...a }; delete n[id]; return n; }); };
  const approvedList = () => cands.filter((c) => approved[c.id]);

  const learn = async () => {
    const set = approvedList();
    if (!set.length) return flash("Keep some snippets first.");
    try { const r = await api.learn(set.map((c) => ({ kind: c.kind, gloss: c.gloss, move: c.move, source: c.source }))); const lib = await api.library(); setLibrary(lib.snippets); setCands((cs) => cs.filter((c) => !approved[c.id])); setApproved({}); flash(`Learned ${r.saved} → library`); }
    catch (e) { flash(e.message); }
  };

  const openMap = (c) => {
    const byId = Object.fromEntries(library.map((s) => [s.id, s]));
    const neighbors = (c.placement.neighbors || []).map((n) => ({ score: n.score, snippet: byId[n.id] || { gloss: n.id, kind: "concept" } }));
    setMap({ center: { gloss: c.gloss, kind: c.kind }, relation: c.placement.relation, neighbors });
  };

  const actions = [
    { label: "Run", hint: "extract", run: () => run(null) },
    { label: "Learn approved", hint: "save", run: learn },
    { label: "Open Library", run: () => setOverlay("library") },
    { label: "Open Filters", run: () => setOverlay("filters") },
    { label: "Open Macros", run: () => setOverlay("macros") },
    { label: "Switch engine", hint: "cycle", run: () => setEngine((x) => ENGINES[(ENGINES.indexOf(x) + 1) % ENGINES.length]) },
    { label: "Clear input", run: () => setText("") },
  ];

  const keptCount = approvedList().length;

  return html`
    <div class="app">
      <header class="topbar">
        <div class="brand"><span class="mark">✦</span> Macro-Prompt Lab</div>
        <${EngineBar} status=${status} engine=${engine} onEngine=${setEngine} onOpen=${() => api.models().then((d) => { setModels(d.models); setOverlay("models"); })} />
        <div class="topbar-r">
          <button class="link" onClick=${() => setOverlay("filters")}>Filters</button>
          <button class="link" onClick=${() => setOverlay("library")}>Library ${library.length ? `· ${library.length}` : ""}</button>
          <button class="link" onClick=${() => setOverlay("macros")}>Macros</button>
          <button class="link" onClick=${() => setOverlay("cmd")}>⌘K</button>
        </div>
      </header>

      <main class="lab">
        <section class="col-left">
          <${Editor} text=${text} onText=${setText} onRun=${run} busy=${busy} />
          <${Panel} title=${`Set aside ${rejected.length ? "· " + rejected.length : ""}`}>
            <${RejectionExplorer} rejected=${rejected} onOverride=${override}
              onMakeRule=${(t) => { window.__prefillRule = t.split(/\s+/).slice(0, 2).join("\\s+"); setOverlay("filters"); }} />
          <//>
        </section>

        <section class="col-right">
          <div class="queue-head">
            <span class="eyebrow">Results ${cands.length ? "· " + cands.length : ""} ${keptCount ? `· ${keptCount} kept` : ""}</span>
            <${Button} kind="spot" onClick=${learn} disabled=${!keptCount}>Learn ${keptCount || ""} approved<//>
          </div>
          ${cands.length
            ? cands.map((c) => html`<${SnippetCard} key=${c.id + c.kind} c=${c} approved=${!!approved[c.id]}
                onKeep=${() => keep(c.id)} onReject=${() => reject(c.id)} onPatch=${(p) => patch(c.id, p)}
                onSwitch=${() => switchKind(c.id)} onMap=${openMap} />`)
            : rejected.length
              ? html`<${EmptyState}>0 candidates — all ${rejected.length} fragment(s) were set aside (see “Set aside”). Loosen Filters, or use “override & keep”.<//>`
              : html`<${EmptyState}>Run the editor to get reviewable concept & intent snippets. Keep the good ones, then Learn.<//>`}
        </section>
      </main>

      ${map && html`<${OntologyMap} data=${map} onClose=${() => setMap(null)} />`}
      ${overlay === "cmd" && html`<${CommandBar} actions=${actions} onClose=${() => setOverlay(null)} />`}
      ${overlay === "filters" && filters && html`<${FiltersSheet} filters=${filters} onSave=${async (f) => { const nf = await api.putFilters(f); setFilters(nf); loadStatus(); setOverlay(null); flash("Filters saved"); }} onClose=${() => setOverlay(null)} />`}
      ${overlay === "library" && html`<${LibrarySheet} library=${library} onClose=${() => setOverlay(null)}
        onRemove=${async (id) => { await api.removeSnippet(id); const d = await api.library(); setLibrary(d.snippets); }}
        onTray=${(s) => { setTray((t) => [...t, { type: "snippet", id: s.id, gloss: s.gloss, kind: s.kind }]); flash("Added to tray"); }}
        onContribute=${(s) => contributeFlow(s, flash, setLibrary)} />`}
      ${overlay === "macros" && html`<${MacrosSheet} tray=${tray} setTray=${setTray} macros=${macros} library=${library}
        onSave=${async (name, items) => { await api.saveMacro(name, items); const d = await api.macros(); setMacros(d.macros); flash("Macro saved"); }}
        onDelete=${async (id) => { await api.deleteMacro(id); const d = await api.macros(); setMacros(d.macros); }}
        onCopy=${(txt) => { navigator.clipboard?.writeText(txt); flash("Copied"); }} onClose=${() => setOverlay(null)} />`}
      ${overlay === "models" && html`<${Sheet} title="Local models on this machine" onClose=${() => setOverlay(null)}>
        ${models.length ? models.slice(0, 30).map((m) => html`<div class="model-row"><b>${m.provider}</b> ${m.name} <span class="muted">${m.note}</span></div>`) : html`<${EmptyState}>None found. Start mlx_lm.server or ollama, then set MPL_SERVER_URL.<//>`}
      <//>`}

      ${toast && html`<div class="toast show">${toast}</div>`}
    </div>`;
}

async function contributeFlow(s, flash, setLib) {
  try {
    const pre = await api.contributePreview(s.id);
    if (!pre.ok) return flash("Cannot share: " + pre.reason);
    if (!confirm(`Contribute this de-identified abstract to the commons?\n\n“${pre.share.abstract}”\n\ntags: ${pre.share.tags.join(", ")}`)) return;
    await api.contribute(s.id);
    const d = await api.library(); setLib(d.snippets);
    flash("Contributed (de-identified)");
  } catch (e) { flash(e.message); }
}

function FiltersSheet({ filters, onSave, onClose }) {
  const [f, setF] = useState(JSON.parse(JSON.stringify(filters)));
  const [label, setLabel] = useState("");
  const [pat, setPat] = useState(window.__prefillRule || "");
  useEffect(() => { window.__prefillRule = ""; }, []);
  const addRule = () => { if (!pat.trim()) return; try { new RegExp(pat, "i"); } catch { return alert("regex doesn't compile"); } setF({ ...f, rules: [...f.rules, { id: "r" + Date.now().toString(36), label: label || pat, pattern: pat }] }); setLabel(""); setPat(""); };
  return html`<${Sheet} title="Filtering — you decide what gets through" onClose=${onClose}>
    <label class="switch"><input type="checkbox" checked=${f.humanitik} onChange=${(e) => setF({ ...f, humanitik: e.target.checked })} />
      <span><b>Humanitik filtering</b><p>Shared public assumptions: drop secrets, PII, and substance-free filler. Opt out anytime.</p></span></label>
    <div class="divider"></div>
    <p class="sub"><b>Your own rules</b> — set aside anything matching a regex you write.</p>
    ${f.rules.map((r, i) => html`<div class="rule"><b>${r.label}</b> <code>${r.pattern}</code><button class="x" onClick=${() => setF({ ...f, rules: f.rules.filter((_, j) => j !== i) })}>×</button></div>`)}
    <div class="rule-add"><input placeholder="label" value=${label} onInput=${(e) => setLabel(e.target.value)} />
      <input placeholder="regex e.g. \\bTODO\\b" value=${pat} onInput=${(e) => setPat(e.target.value)} />
      <button class="btn ghost small" onClick=${addRule}>Add</button></div>
    <div class="divider"></div>
    <label class="switch"><input type="checkbox" checked=${f.genai.enabled} onChange=${(e) => setF({ ...f, genai: { ...f.genai, enabled: e.target.checked } })} />
      <span><b>GenAI filter</b><p>Let your local model judge each fragment against an instruction (needs a model engine).</p></span></label>
    <textarea class="ta" placeholder="e.g. Keep only fragments about reasoning or alignment." value=${f.genai.instruction} onInput=${(e) => setF({ ...f, genai: { ...f.genai, instruction: e.target.value } })}></textarea>
    <div class="sheet-foot"><button class="btn spot" onClick=${() => onSave(f)}>Save filters</button></div>
  <//>`;
}

function LibrarySheet({ library, onRemove, onTray, onContribute, onClose }) {
  const [q, setQ] = useState("");
  const items = fuzzy(library, q, (s) => s.gloss + " " + (s.move || ""));
  return html`<${Sheet} title=${`Library · ${library.length}`} onClose=${onClose} wide=${true}>
    <input class="search" placeholder="search snippets…" value=${q} onInput=${(e) => setQ(e.target.value)} />
    ${items.length ? items.map((s) => html`<div class="lib-row">
      <${KindBadge} kind=${s.kind} /> <span class="lib-g">${s.gloss}</span>
      ${s.optInShare ? html`<span class="badge shared">shared</span>` : null}
      <span class="lib-acts">
        <button class="act muted" onClick=${() => onTray(s)}>+ tray</button>
        <button class="act muted" onClick=${() => onContribute(s)}>contribute</button>
        <button class="act muted" onClick=${() => onRemove(s.id)}>remove</button>
      </span></div>`) : html`<${EmptyState}>${library.length ? "no matches" : "Learn snippets and they collect here."}<//>`}
  <//>`;
}

function MacrosSheet({ tray, setTray, macros, library, onSave, onDelete, onCopy, onClose }) {
  const [name, setName] = useState("");
  const [free, setFree] = useState("");
  const drag = useRef(null);
  const asText = (items) => items.map((it) => (it.type === "text" ? it.text : (library.find((s) => s.id === it.id)?.gloss ?? it.gloss ?? ""))).filter(Boolean).join("\n");
  return html`<${Sheet} title="Macro-prompts — compose & reuse" onClose=${onClose} wide=${true}>
    <p class="sub">Composing tray — drag to reorder, then save a reusable macro-prompt.</p>
    <div class="tray">
      ${tray.length ? tray.map((it, i) => html`<div class=${"tray-item " + (it.type || "snippet")} draggable=${true}
        onDragStart=${() => (drag.current = i)} onDragOver=${(e) => e.preventDefault()}
        onDrop=${() => { const f = drag.current; if (f === i) return; const n = tray.slice(); const [m] = n.splice(f, 1); n.splice(i, 0, m); setTray(n); }}>
        <span class="grip">⠿</span><span class="g">${it.type === "text" ? it.text : (library.find((s) => s.id === it.id)?.gloss ?? it.gloss)}</span>
        <button class="x" onClick=${() => setTray(tray.filter((_, j) => j !== i))}>×</button></div>`)
        : html`<p class="tray-empty">Add snippets from the Library (+ tray), or free text below.</p>`}
    </div>
    <div class="rule-add"><input placeholder="free text line…" value=${free} onInput=${(e) => setFree(e.target.value)} onKeyDown=${(e) => { if (e.key === "Enter" && free.trim()) { setTray([...tray, { type: "text", text: free.trim() }]); setFree(""); } }} />
      <button class="btn ghost small" onClick=${() => { if (free.trim()) { setTray([...tray, { type: "text", text: free.trim() }]); setFree(""); } }}>Add text</button></div>
    <div class="rule-add"><input placeholder="macro name" value=${name} onInput=${(e) => setName(e.target.value)} />
      <button class="btn spot small" onClick=${() => { if (name.trim() && tray.length) { onSave(name.trim(), tray); setName(""); } }}>Save macro</button>
      <button class="btn ghost small" onClick=${() => onCopy(asText(tray))} disabled=${!tray.length}>Copy assembled</button></div>
    <div class="divider"></div>
    <p class="sub">Saved</p>
    ${macros.length ? macros.slice().reverse().map((m) => html`<div class="macro-row"><b>${m.name}</b> <span class="muted">${m.items.length} part(s)</span>
      <span class="lib-acts"><button class="act muted" onClick=${() => onCopy(asText(m.items))}>copy</button>
        <button class="act muted" onClick=${() => setTray(m.items.slice())}>load</button>
        <button class="act muted" onClick=${() => onDelete(m.id)}>delete</button></span></div>`) : html`<${EmptyState}>No saved macro-prompts yet.<//>`}
  <//>`;
}

render(html`<${App} />`, document.getElementById("root"));
