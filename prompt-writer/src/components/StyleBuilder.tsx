"use client";

import { useState, useMemo } from "react";

const GENRES = [
  "Children's pop",
  "Educational hip-hop",
  "Folk",
  "EDM",
  "Indie pop",
  "Acoustic",
  "Gospel",
  "Funk",
  "Classroom chant",
  "Narrative ballad",
  "Jazz",
  "R&B",
  "Country",
  "Reggae",
  "Classical",
  "Lo-fi",
  "March",
  "Rock",
];

const SUB_GENRES = [
  "Educational",
  "Singalong",
  "Playful",
  "Storytelling",
  "Rhythmic",
  "Cinematic",
  "Lullaby",
  "Motivational",
  "Science-themed",
  "Math-themed",
  "Nature-themed",
];

const MOODS = [
  "Upbeat",
  "Playful",
  "Dreamy",
  "Energetic",
  "Warm",
  "Curious",
  "Wonder-filled",
  "Nostalgic",
  "Euphoric",
  "Gentle",
  "Anthemic",
  "Confident",
  "Mysterious",
  "Adventurous",
  "Calming",
  "Exciting",
];

const KEYS = [
  "C Major",
  "G Major",
  "D Major",
  "A Major",
  "E Major",
  "F Major",
  "Bb Major",
  "A Minor",
  "E Minor",
  "D Minor",
  "B Minor",
  "C Minor",
];

const INSTRUMENTS = [
  "Piano",
  "Ukulele",
  "Acoustic guitar",
  "Electric guitar",
  "Drums",
  "Synth",
  "Bass",
  "Xylophone",
  "Strings",
  "Trumpet",
  "Flute",
  "Hand claps",
  "Finger snaps",
  "Tambourine",
  "Marimba",
  "Kalimba",
  "Bells",
  "Recorder",
  "Violin",
  "Cello",
];

const VOCAL_STYLES = [
  "Clear",
  "Warm",
  "Breathy",
  "Raspy",
  "Smooth",
  "Energetic",
  "Gentle",
  "Powerful",
];

const VOCAL_RANGES = ["Soprano", "Alto", "Tenor", "Baritone", "Children's choir"];

const PRODUCTION = [
  "Clean mix",
  "Polished production",
  "Lo-fi warmth",
  "Live room reverb",
  "Stadium energy",
  "Warm reverb",
  "Crisp and bright",
  "Raw and organic",
];

export default function StyleBuilder() {
  const [genre, setGenre] = useState("Children's pop");
  const [subGenre, setSubGenre] = useState("Educational");
  const [moods, setMoods] = useState<string[]>(["Playful", "Upbeat"]);
  const [tempo, setTempo] = useState(110);
  const [musicalKey, setMusicalKey] = useState("C Major");
  const [energy, setEnergy] = useState<"low" | "medium" | "high">("medium");
  const [instruments, setInstruments] = useState<string[]>([
    "Piano",
    "Ukulele",
    "Xylophone",
    "Hand claps",
  ]);
  const [vocalGender, setVocalGender] = useState<"male" | "female" | "both" | "none">("female");
  const [vocalStyle, setVocalStyle] = useState("Clear");
  const [vocalRange, setVocalRange] = useState("Soprano");
  const [production, setProduction] = useState<string[]>(["Clean mix", "Polished production"]);
  const [copied, setCopied] = useState(false);

  const toggleArrayItem = (
    arr: string[],
    setArr: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    setArr(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  const styleString = useMemo(() => {
    const parts: string[] = [];
    parts.push(genre);
    if (subGenre) parts.push(subGenre.toLowerCase());
    parts.push(...moods.map((m) => m.toLowerCase()));
    parts.push(`${tempo} BPM`);
    parts.push(musicalKey);
    parts.push(...instruments.map((i) => i.toLowerCase()));
    if (vocalGender !== "none") {
      const vocalDesc = `${vocalStyle.toLowerCase()} ${vocalGender} ${vocalRange.toLowerCase()} vocals`;
      parts.push(vocalDesc);
    }
    parts.push(...production.map((p) => p.toLowerCase()));
    return parts.join(", ");
  }, [genre, subGenre, moods, tempo, musicalKey, instruments, vocalGender, vocalStyle, vocalRange, production]);

  const charCount = styleString.length;
  const charClass = charCount <= 200 ? "ok" : charCount <= 500 ? "warn" : "over";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(styleString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card shadow-3">
      <div className="card-body p-4">
        <h5 className="card-title mb-4">
          <i className="fas fa-palette me-2" style={{ color: "var(--pw-style)" }} />
          Style Builder
        </h5>

        {/* Genre + Sub-genre */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="form-label fw-bold" style={{ fontSize: "0.85rem" }}>
              Genre
            </label>
            <select
              className="form-select"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold" style={{ fontSize: "0.85rem" }}>
              Sub-genre
            </label>
            <select
              className="form-select"
              value={subGenre}
              onChange={(e) => setSubGenre(e.target.value)}
            >
              {SUB_GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Moods */}
        <div className="mb-4">
          <label className="form-label fw-bold" style={{ fontSize: "0.85rem" }}>
            Mood
          </label>
          <div className="d-flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                className={`btn btn-sm ${moods.includes(m) ? "btn-warning" : "btn-outline-secondary"}`}
                onClick={() => toggleArrayItem(moods, setMoods, m)}
                style={{ fontSize: "0.8rem" }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Tempo + Key + Energy */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label fw-bold" style={{ fontSize: "0.85rem" }}>
              Tempo: {tempo} BPM
            </label>
            <input
              type="range"
              className="form-range"
              min={60}
              max={200}
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold" style={{ fontSize: "0.85rem" }}>
              Key
            </label>
            <select
              className="form-select"
              value={musicalKey}
              onChange={(e) => setMusicalKey(e.target.value)}
            >
              {KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold" style={{ fontSize: "0.85rem" }}>
              Energy
            </label>
            <div className="btn-group w-100" role="group">
              {(["low", "medium", "high"] as const).map((e) => (
                <button
                  key={e}
                  className={`btn ${energy === e ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setEnergy(e)}
                  style={{ fontSize: "0.8rem" }}
                >
                  {e.charAt(0).toUpperCase() + e.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Instruments */}
        <div className="mb-4">
          <label className="form-label fw-bold" style={{ fontSize: "0.85rem" }}>
            Instruments
          </label>
          <div className="instrument-grid">
            {INSTRUMENTS.map((inst) => (
              <div key={inst} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`inst-${inst}`}
                  checked={instruments.includes(inst)}
                  onChange={() => toggleArrayItem(instruments, setInstruments, inst)}
                />
                <label
                  className="form-check-label"
                  htmlFor={`inst-${inst}`}
                  style={{ fontSize: "0.85rem" }}
                >
                  {inst}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Vocals */}
        <div className="mb-4">
          <label className="form-label fw-bold" style={{ fontSize: "0.85rem" }}>
            Vocals
          </label>
          <div className="row g-3">
            <div className="col-md-4">
              <small className="text-muted d-block mb-1">Gender</small>
              {(["male", "female", "both", "none"] as const).map((g) => (
                <div key={g} className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="vocalGender"
                    id={`vg-${g}`}
                    checked={vocalGender === g}
                    onChange={() => setVocalGender(g)}
                  />
                  <label className="form-check-label" htmlFor={`vg-${g}`} style={{ fontSize: "0.8rem" }}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </label>
                </div>
              ))}
            </div>
            {vocalGender !== "none" && (
              <>
                <div className="col-md-4">
                  <small className="text-muted d-block mb-1">Style</small>
                  <select
                    className="form-select form-select-sm"
                    value={vocalStyle}
                    onChange={(e) => setVocalStyle(e.target.value)}
                  >
                    {VOCAL_STYLES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <small className="text-muted d-block mb-1">Range</small>
                  <select
                    className="form-select form-select-sm"
                    value={vocalRange}
                    onChange={(e) => setVocalRange(e.target.value)}
                  >
                    {VOCAL_RANGES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Production */}
        <div className="mb-4">
          <label className="form-label fw-bold" style={{ fontSize: "0.85rem" }}>
            Production
          </label>
          <div className="d-flex flex-wrap gap-2">
            {PRODUCTION.map((p) => (
              <button
                key={p}
                className={`btn btn-sm ${production.includes(p) ? "btn-info text-white" : "btn-outline-secondary"}`}
                onClick={() => toggleArrayItem(production, setProduction, p)}
                style={{ fontSize: "0.8rem" }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-3">
          <label className="form-label fw-bold" style={{ fontSize: "0.85rem" }}>
            Preview
          </label>
          <div className="style-preview">{styleString}</div>
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <span className={`char-count ${charClass}`}>
            {charCount} / 1000 chars
            {charCount > 200 && charCount <= 1000 && (
              <small className="ms-1">(optimal: under 200)</small>
            )}
          </span>
          <button className="btn btn-primary" onClick={handleCopy}>
            <i className={`fas ${copied ? "fa-check" : "fa-copy"} me-2`} />
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
        </div>
      </div>
    </div>
  );
}
