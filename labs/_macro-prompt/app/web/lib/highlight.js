// Highlight / Annotation tool — a real custom library (not a fake "Mark" button).
// Built on the native CSS Custom Highlight API (Baseline 2025: Safari 17.2+, Chrome 105+):
// zero DOM mutation, so marks survive re-render; persisted as character offsets so they
// can drive "re-extract from marked spans only". Select text → mark with a CATEGORY →
// colored highlight → click to select → edit/delete.

export const CATEGORIES = {
  important:       { label: "important",      color: "rgba(214,69,37,0.30)" },
  assumption:      { label: "assumption",     color: "rgba(46,111,94,0.30)" },
  "reusable-move": { label: "reusable move",  color: "rgba(185,137,0,0.32)" },
  "risky-private": { label: "risky / private",color: "rgba(160,40,40,0.34)" },
  unclear:        { label: "unclear",         color: "rgba(120,120,160,0.30)" },
};

const supported = typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight !== "undefined";

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || !supported) return;
  const sheet = new CSSStyleSheet();
  for (const [cat, { color }] of Object.entries(CATEGORIES)) {
    sheet.insertRule(`::highlight(mpl-${cat}) { background-color: ${color}; border-radius: 2px; }`);
  }
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  stylesInjected = true;
}

function offsetToRange(container, start, end) {
  let count = 0, sNode = null, sOff = 0, eNode = null, eOff = 0;
  const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) {
    const node = walk.currentNode, len = node.length;
    if (sNode === null && count + len > start) { sNode = node; sOff = start - count; }
    if (eNode === null && count + len >= end) { eNode = node; eOff = end - count; break; }
    count += len;
  }
  if (sNode === null || eNode === null) return null;
  const r = document.createRange();
  r.setStart(sNode, sOff); r.setEnd(eNode, eOff);
  return r;
}

function selectionOffsets(container) {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;
  const pre = document.createRange();
  pre.setStart(container, 0);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length;
  const end = start + range.toString().length;
  return end > start ? { start, end } : null;
}

export class Highlighter {
  constructor(container, onClickMark) {
    this.container = container;
    this.marks = []; // {id, start, end, category}
    this.onClickMark = onClickMark;
    this.supported = supported;
    injectStyles();
    container.addEventListener("click", (e) => this._onClick(e));
  }

  // Mark the current text selection. Returns the new mark, or null if nothing selected.
  markSelection(category) {
    const off = selectionOffsets(this.container);
    if (!off) return null;
    const mark = { id: "h" + Math.random().toString(36).slice(2, 9), start: off.start, end: off.end, category };
    this.marks.push(mark);
    window.getSelection()?.removeAllRanges();
    this.render();
    return mark;
  }

  remove(id) { this.marks = this.marks.filter((m) => m.id !== id); this.render(); }
  setCategory(id, category) { const m = this.marks.find((x) => x.id === id); if (m) { m.category = category; this.render(); } }
  clear() { this.marks = []; this.render(); }
  setMarks(marks) { this.marks = marks.slice(); this.render(); }
  serialize() { return this.marks.map(({ id, start, end, category }) => ({ id, start, end, category })); }

  // Excerpt the marked spans (for "re-extract from marked spans only").
  spans() { return this.marks.map((m) => ({ start: m.start, end: m.end })); }

  // (Re)paint highlights. Call after the passage DOM changes (text must be unchanged).
  render() {
    if (!this.supported) return;
    for (const cat of Object.keys(CATEGORIES)) {
      const existing = CSS.highlights.get("mpl-" + cat);
      if (existing) existing.clear();
    }
    const byCat = {};
    for (const m of this.marks) {
      const range = offsetToRange(this.container, m.start, m.end);
      if (!range) continue;
      (byCat[m.category] ||= []).push(range);
    }
    for (const [cat, ranges] of Object.entries(byCat)) {
      let hl = CSS.highlights.get("mpl-" + cat);
      if (!hl) { hl = new Highlight(); CSS.highlights.set("mpl-" + cat, hl); }
      for (const r of ranges) hl.add(r);
    }
  }

  _onClick(e) {
    if (!this.onClickMark || !this.marks.length) return;
    const caret = document.caretRangeFromPoint?.(e.clientX, e.clientY);
    if (!caret) return;
    const pre = document.createRange();
    pre.setStart(this.container, 0);
    pre.setEnd(caret.startContainer, caret.startOffset);
    const at = pre.toString().length;
    const hit = this.marks.find((m) => at >= m.start && at < m.end);
    if (hit) this.onClickMark(hit, e);
  }
}
