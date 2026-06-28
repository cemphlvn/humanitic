// Lab UI kit — tiny purpose-built primitives, not a generic component library.
import { html } from "./html.js";
import { useState, useRef, useEffect } from "preact/hooks";

export const Button = ({ kind = "", onClick, disabled, title, children }) =>
  html`<button class=${"btn " + kind} onClick=${onClick} disabled=${disabled} title=${title}>${children}</button>`;

export const Panel = ({ title, right, children }) => html`
  <section class="panel">
    <header class="panel-h"><span class="eyebrow">${title}</span><span class="panel-right">${right}</span></header>
    <div class="panel-b">${children}</div>
  </section>`;

export const KindBadge = ({ kind }) =>
  html`<span class=${"badge kind kind-" + kind} title=${kind}>${kind === "concept" ? "C" : "I"}</span>`;

export const RelationBadge = ({ relation, onClick }) =>
  html`<span class=${"badge rel rel-" + relation} onClick=${onClick} title="ontology placement — click to map">${relation}</span>`;

export const ScoreBadge = ({ score, title }) => {
  const s = typeof score === "number" ? score : (score?.score ?? 0);
  const t = s >= 0.7 ? "hi" : s >= 0.45 ? "mid" : "lo";
  return html`<span class=${"badge score score-" + t} title=${title || "research-goal score"}>${s.toFixed(2)}</span>`;
};

export const EmptyState = ({ children }) => html`<p class="empty">${children}</p>`;

// Click-to-edit text — first-class snippet curation.
export function InlineEditor({ value, onSave, multiline = false, placeholder = "—", cls = "" }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  const ref = useRef(null);
  useEffect(() => { setV(value); }, [value]);
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select?.(); } }, [editing]);
  const commit = () => { setEditing(false); const t = v.trim(); if (t && t !== value) onSave(t); else setV(value); };
  if (!editing)
    return html`<span class=${"inline-edit " + cls} title="click to edit" onClick=${() => setEditing(true)}>${value || html`<em>${placeholder}</em>`}</span>`;
  const common = {
    ref, value: v, class: "inline-input " + cls,
    onInput: (e) => setV(e.target.value), onBlur: commit,
    onKeyDown: (e) => {
      if (e.key === "Enter" && !multiline) { e.preventDefault(); commit(); }
      if (e.key === "Escape") { setV(value); setEditing(false); }
    },
  };
  return multiline ? html`<textarea ...${common} rows="2"></textarea>` : html`<input ...${common} />`;
}

// substring fuzzy — fine for the corpus sizes here (research: dep only past ~200 items)
export function fuzzy(items, query, key = (x) => x) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items
    .map((it) => { const i = key(it).toLowerCase().indexOf(q); return i < 0 ? null : { it, i }; })
    .filter(Boolean)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.it);
}
