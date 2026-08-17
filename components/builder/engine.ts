// Procedural model behind the Agent Studio. One superellipse-based outline
// describes every silhouette, so any agent can spring-morph into any other —
// shapes, moods, states and even the icon forms (loading dots, voice bars)
// are just points in the same parameter space.

export const TAU = Math.PI * 2;

/* ---------------------------------- shapes ----------------------------------- */

export type ShapeId =
  | "blob"
  | "orb"
  | "squircle"
  | "gem"
  | "drop"
  | "puff"
  | "dome"
  | "pill"
  | "cone"
  | "pebble"
  | "cloud";

export type ShapeDef = {
  label: string;
  /** superellipse exponents — top and bottom halves are independent, which is
      what makes flat-bottomed silhouettes (dome, cone, pebble) possible while
      staying continuous at the seam (r at y=0 only depends on ax) */
  n: number;
  nB: number;
  ax: number;
  ay: number;
  ayB: number;
  /** 0..1 — narrows the top of the silhouette (droplet) */
  taper: number;
  tilt: number;
  /** organic wobble amplitudes at two FIXED integer frequencies (3 and 8 lobes).
      Morphing amplitude keeps the outline closed at the seam — a fractional
      frequency mid-morph would leave a visible crease at θ = 0. */
  wobA: number;
  wobB: number;
};

export const SHAPES: Record<ShapeId, ShapeDef> = {
  blob: { label: "Blob", n: 2.5, nB: 2.5, ax: 1, ay: 0.97, ayB: 0.97, taper: 0.06, tilt: -4, wobA: 0.045, wobB: 0 },
  orb: { label: "Orb", n: 2, nB: 2, ax: 1, ay: 1, ayB: 1, taper: 0, tilt: 0, wobA: 0.015, wobB: 0 },
  squircle: { label: "Squircle", n: 3.8, nB: 3.8, ax: 0.97, ay: 0.97, ayB: 0.97, taper: 0, tilt: 0, wobA: 0.012, wobB: 0 },
  gem: { label: "Gem", n: 1.42, nB: 1.42, ax: 1.06, ay: 1.06, ayB: 1.06, taper: 0, tilt: 0, wobA: 0.02, wobB: 0 },
  drop: { label: "Drop", n: 2.35, nB: 2.35, ax: 0.95, ay: 1.04, ayB: 1.04, taper: 0.42, tilt: -7, wobA: 0.03, wobB: 0 },
  puff: { label: "Puff", n: 2.15, nB: 2.15, ax: 1, ay: 0.98, ayB: 0.98, taper: 0.04, tilt: 0, wobA: 0.012, wobB: 0.07 },
  dome: { label: "Dome", n: 2.2, nB: 5, ax: 1.02, ay: 0.92, ayB: 0.62, taper: 0.05, tilt: 0, wobA: 0.02, wobB: 0 },
  pill: { label: "Pill", n: 2.6, nB: 2.6, ax: 0.66, ay: 1.18, ayB: 1.18, taper: 0.05, tilt: 0, wobA: 0.02, wobB: 0 },
  cone: { label: "Cone", n: 1.5, nB: 4.5, ax: 1.05, ay: 1.1, ayB: 0.62, taper: 0.5, tilt: 2, wobA: 0.03, wobB: 0 },
  pebble: { label: "Pebble", n: 2.4, nB: 3.4, ax: 1.28, ay: 0.62, ayB: 0.5, taper: 0.08, tilt: -2, wobA: 0.03, wobB: 0 },
  cloud: { label: "Cloud", n: 2.2, nB: 4, ax: 1.15, ay: 0.85, ayB: 0.6, taper: 0.06, tilt: 0, wobA: 0.02, wobB: 0.11 },
};

export const SHAPE_IDS = Object.keys(SHAPES) as ShapeId[];

/** Samples on the outline. 48 keeps the Catmull-Rom conversion cheap enough to
    rebuild every animation frame while staying visually smooth at ~340px. */
const K = 48;
const STEP = TAU / K;

const radial = (
  c: number,
  s: number,
  n: number,
  nB: number,
  ax: number,
  ay: number,
  ayB: number,
  wobA: number,
  wobB: number,
  th: number,
  phase: number,
) => {
  // SVG y grows downward: sin < 0 is the top half
  const ne = s < 0 ? n : nB;
  const aye = s < 0 ? ay : ayB;
  let r = Math.pow(Math.pow(Math.abs(c) / ax, ne) + Math.pow(Math.abs(s) / aye, ne), -1 / ne);
  r *= 1 + wobA * Math.cos(3 * th + phase) + wobB * Math.cos(8 * th - phase * 1.6);
  return r;
};

export function buildPath(
  R: number,
  cx: number,
  cy: number,
  n: number,
  nB: number,
  ax: number,
  ay: number,
  ayB: number,
  taper: number,
  tiltDeg: number,
  wobA: number,
  wobB: number,
  phase: number,
): string {
  const xs = new Array<number>(K);
  const ys = new Array<number>(K);
  const tilt = (tiltDeg * Math.PI) / 180;
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);

  for (let i = 0; i < K; i++) {
    const th = i * STEP;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const r = radial(c, s, n, nB, ax, ay, ayB, wobA, wobB, th, phase);
    let x = R * r * c;
    const y = R * r * s;
    // (1 - y/R)/2 → 1 at the top: taper narrows the top
    x *= 1 - taper * ((1 - y / R) / 2);
    xs[i] = cx + x * ct - y * st;
    ys[i] = cy + x * st + y * ct;
  }

  // closed Catmull-Rom through the samples, emitted as cubic Béziers
  let d = `M${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`;
  for (let i = 0; i < K; i++) {
    const p0 = (i + K - 1) % K;
    const p2 = (i + 1) % K;
    const p3 = (i + 2) % K;
    const c1x = xs[i] + (xs[p2] - xs[p0]) / 6;
    const c1y = ys[i] + (ys[p2] - ys[p0]) / 6;
    const c2x = xs[p2] - (xs[p3] - xs[i]) / 6;
    const c2y = ys[p2] - (ys[p3] - ys[i]) / 6;
    d += `C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${xs[p2].toFixed(2)} ${ys[p2].toFixed(2)}`;
  }
  return d + "Z";
}

/** Single point on the live outline — limbs anchor to this so hands, ears and
    feet stay glued to the silhouette even mid-morph. */
export function pointAt(
  R: number,
  n: number,
  nB: number,
  ax: number,
  ay: number,
  ayB: number,
  taper: number,
  tiltDeg: number,
  wobA: number,
  wobB: number,
  phase: number,
  th: number,
): { x: number; y: number } {
  const c = Math.cos(th);
  const s = Math.sin(th);
  const r = radial(c, s, n, nB, ax, ay, ayB, wobA, wobB, th, phase);
  let x = R * r * c;
  const y = R * r * s;
  x *= 1 - taper * ((1 - y / R) / 2);
  const tilt = (tiltDeg * Math.PI) / 180;
  return { x: x * Math.cos(tilt) - y * Math.sin(tilt), y: x * Math.sin(tilt) + y * Math.cos(tilt) };
}

/* ---------------------------------- palettes --------------------------------- */

export type PaletteId =
  | "ember"
  | "coral"
  | "rose"
  | "berry"
  | "indigo"
  | "ocean"
  | "mint"
  | "forest"
  | "lime"
  | "honey"
  | "slate"
  | "graphite";

export type PaletteDef = {
  label: string;
  from: string;
  to: string;
  /** "r,g,b" accent used for page gradients, halos and selection rings */
  tint: string;
};

// ember/ocean/lime/honey are the exact gradients from the exported blob assets;
// the rest extend the family across the spectrum (graphite = the mono icon
// treatment). Every ramp stays mid-to-deep so the white eyes always read.
export const PALETTES: Record<PaletteId, PaletteDef> = {
  ember: { label: "Ember", from: "#FF7060", to: "#DC9700", tint: "247,107,21" },
  coral: { label: "Coral", from: "#FFA98B", to: "#E5484D", tint: "229,72,77" },
  rose: { label: "Rose", from: "#FFAEDC", to: "#D6216B", tint: "214,33,107" },
  berry: { label: "Berry", from: "#FF8AF0", to: "#7A1FD0", tint: "162,60,220" },
  indigo: { label: "Indigo", from: "#A9B8FF", to: "#2B18C4", tint: "43,24,196" },
  ocean: { label: "Ocean", from: "#60F7FF", to: "#0051DC", tint: "2,113,227" },
  mint: { label: "Mint", from: "#7CFFD4", to: "#00B589", tint: "0,181,137" },
  forest: { label: "Forest", from: "#A6F17A", to: "#127A3F", tint: "18,122,63" },
  lime: { label: "Lime", from: "#FFEF60", to: "#58DC00", tint: "88,220,0" },
  honey: { label: "Honey", from: "#FFEF60", to: "#DCA200", tint: "255,162,2" },
  slate: { label: "Slate", from: "#A8BDD6", to: "#3D5470", tint: "61,84,112" },
  graphite: { label: "Graphite", from: "#565F6E", to: "#0C0F16", tint: "14,18,27" },
};

export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];

/** "#RRGGBB" + alpha → rgba() string (the live backdrop blends palette hues). */
export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ----------------------------------- moods ----------------------------------- */

/** One glowing bar of an eye. Every eye is TWO strokes, which is enough to
    draw the whole kaomoji alphabet — overlapping vertical = pill, hinged at
    the top = ^, crossed = x, turned flat = -, stubby wide = o — while staying
    spring-morphable between any two glyphs. Offsets are fractions of the eye
    height so the faces survive the eye sliders. */
export type Stroke = { rot: number; dx: number; dy: number; sy: number; op: number };
export type EyeGlyph = { a: Stroke; b: Stroke; wK: number };

const S = (rot: number, dx: number, dy: number, sy: number, op: number): Stroke => ({ rot, dx, dy, sy, op });
const pill = (sy = 1): EyeGlyph => ({ a: S(0, 0, 0, sy, 1), b: S(0, 0, 0, sy, 0), wK: 1 });
/** ^ — two legs overlapping at the apex, so they fuse into ONE bent stroke
    (the glow lives on the eye container, not the legs — see EyeStroke) */
const caret: EyeGlyph = { a: S(42, -0.13, 0.02, 0.58, 1), b: S(-42, 0.13, 0.02, 0.58, 1), wK: 0.72 };
const cross: EyeGlyph = { a: S(45, 0, 0, 0.78, 1), b: S(-45, 0, 0, 0.78, 1), wK: 0.85 };
const dash: EyeGlyph = { a: S(90, 0, 0, 0.5, 1), b: S(90, 0, 0, 0.5, 0), wK: 1 };
const closed: EyeGlyph = { a: S(90, 0, 0, 0.35, 1), b: S(90, 0, 0, 0.35, 0), wK: 1 };
const dot: EyeGlyph = { a: S(0, 0, 0, 0.5, 1), b: S(0, 0, 0, 0.5, 0), wK: 1.4 };

export type MoodEyes = {
  L: EyeGlyph;
  R: EyeGlyph;
  tiltL: number;
  tiltR: number;
  dy: number;
  gapK: number;
  hK: number;
};

export type MoodBody = {
  rot: number;
  dy: number;
  breathDepth: number;
  breathSpeed: number;
};

export type MoodId =
  | "neutral"
  | "happy"
  | "sad"
  | "excited"
  | "sleepy"
  | "curious"
  | "focused"
  | "joyful"
  | "squeezed"
  | "surprised"
  | "dizzy"
  | "meh"
  | "smitten"
  | "tearful"
  | "angry"
  | "shy";

export type MoodDef = { label: string; line: string; eyes: MoodEyes; body: MoodBody };

// sad reuses the onboarding slump exactly: inner corners up (±22°), lids at 0.72,
// the whole body leaning -6° — so the builder stays in character with the funnel.
// The kaomoji row (^_^, >_<, o_o, x_x, -_-, :*, T_T) builds on the same strokes;
// >_< is just ^_^ with each eye turned 90° toward the other.
export const MOODS: Record<MoodId, MoodDef> = {
  neutral: {
    label: "Neutral",
    line: "Ready when you are.",
    eyes: { L: pill(1), R: pill(1), tiltL: 0, tiltR: 0, dy: 0, gapK: 1, hK: 1 },
    body: { rot: 0, dy: 0, breathDepth: 0.012, breathSpeed: 0.26 },
  },
  happy: {
    label: "Happy",
    line: "Feeling great today!",
    eyes: { L: pill(0.88), R: pill(0.88), tiltL: -8, tiltR: 8, dy: -3, gapK: 1.02, hK: 1 },
    body: { rot: 0, dy: -1, breathDepth: 0.016, breathSpeed: 0.34 },
  },
  sad: {
    label: "Sad",
    line: "Oh… okay.",
    eyes: { L: pill(0.72), R: pill(0.72), tiltL: 22, tiltR: -22, dy: 3, gapK: 1, hK: 1 },
    body: { rot: -6, dy: 3, breathDepth: 0.008, breathSpeed: 0.18 },
  },
  excited: {
    label: "Excited",
    line: "Let's go — what's first?",
    eyes: { L: pill(1.14), R: pill(1.14), tiltL: -4, tiltR: 4, dy: -5, gapK: 1.06, hK: 1.06 },
    body: { rot: 0, dy: -2, breathDepth: 0.022, breathSpeed: 0.5 },
  },
  sleepy: {
    label: "Sleepy",
    line: "Five more minutes…",
    eyes: { L: pill(0.34), R: pill(0.34), tiltL: -6, tiltR: 6, dy: 4, gapK: 1, hK: 1 },
    body: { rot: -3, dy: 2, breathDepth: 0.02, breathSpeed: 0.12 },
  },
  curious: {
    label: "Curious",
    line: "Ooh — what's that?",
    eyes: { L: pill(1.08), R: pill(0.72), tiltL: -3, tiltR: 10, dy: -2, gapK: 1.04, hK: 1 },
    body: { rot: 3, dy: 0, breathDepth: 0.014, breathSpeed: 0.3 },
  },
  focused: {
    label: "Focused",
    line: "On it.",
    eyes: { L: pill(0.56), R: pill(0.56), tiltL: 6, tiltR: -6, dy: -1, gapK: 0.94, hK: 1 },
    body: { rot: 0, dy: 0, breathDepth: 0.008, breathSpeed: 0.22 },
  },
  joyful: {
    label: "^_^",
    line: "Best. Day. Ever.",
    eyes: { L: caret, R: caret, tiltL: 0, tiltR: 0, dy: -2, gapK: 1.04, hK: 1 },
    body: { rot: 0, dy: -1, breathDepth: 0.018, breathSpeed: 0.4 },
  },
  squeezed: {
    label: ">_<",
    line: "Ngh — almost there…",
    // rotated glyphs occupy the eye HEIGHT horizontally, so they need extra
    // gap (and a size trim) to read as two distinct chevrons
    eyes: { L: caret, R: caret, tiltL: 90, tiltR: -90, dy: 0, gapK: 1.3, hK: 0.82 },
    body: { rot: 0, dy: 0, breathDepth: 0.006, breathSpeed: 0.7 },
  },
  surprised: {
    label: "o_o",
    line: "Wait — what?!",
    eyes: { L: dot, R: dot, tiltL: 0, tiltR: 0, dy: -2, gapK: 1.06, hK: 1 },
    body: { rot: 0, dy: -2, breathDepth: 0.005, breathSpeed: 0.6 },
  },
  dizzy: {
    label: "x_x",
    line: "Whoa, everything's spinning…",
    eyes: { L: cross, R: cross, tiltL: 0, tiltR: 0, dy: 0, gapK: 1, hK: 1 },
    body: { rot: 0, dy: 1, breathDepth: 0.012, breathSpeed: 0.2 },
  },
  meh: {
    label: "-_-",
    line: "Meh.",
    eyes: { L: dash, R: dash, tiltL: 0, tiltR: 0, dy: 1, gapK: 1, hK: 1 },
    body: { rot: -2, dy: 1, breathDepth: 0.008, breathSpeed: 0.16 },
  },
  smitten: {
    label: ":*",
    line: "Mwah! You're the best.",
    eyes: { L: pill(0.9), R: closed, tiltL: -6, tiltR: 8, dy: -2, gapK: 1.02, hK: 1 },
    body: { rot: 2, dy: -1, breathDepth: 0.02, breathSpeed: 0.45 },
  },
  tearful: {
    label: "T_T",
    line: "I'm fine. Totally fine…",
    eyes: { L: pill(0.85), R: pill(0.85), tiltL: 0, tiltR: 0, dy: 2, gapK: 1, hK: 1 },
    body: { rot: -5, dy: 3, breathDepth: 0.01, breathSpeed: 0.15 },
  },
  angry: {
    label: "Angry",
    line: "Grrr. Not okay.",
    // inverse of sad: inner corners DOWN, lids narrowed
    eyes: { L: pill(0.6), R: pill(0.6), tiltL: -20, tiltR: 20, dy: -1, gapK: 0.96, hK: 1 },
    body: { rot: 0, dy: 0, breathDepth: 0.01, breathSpeed: 0.55 },
  },
  shy: {
    label: "Shy",
    line: "Oh… hi.",
    eyes: { L: pill(0.5), R: pill(0.5), tiltL: 0, tiltR: 0, dy: 3, gapK: 1.12, hK: 0.9 },
    body: { rot: -3, dy: 2, breathDepth: 0.012, breathSpeed: 0.2 },
  },
};

export const MOOD_IDS = Object.keys(MOODS) as MoodId[];

/* ----------------------------------- states ---------------------------------- */

/** `idle` is the resting state — the mascot with no effect running. The rest
    are the expressive states worth demoing. */
export type StateId = "idle" | "loading" | "voice" | "alert" | "celebrating" | "sleeping";

export const STATES: Record<StateId, { label: string }> = {
  idle: { label: "Idle" },
  loading: { label: "Loading" },
  voice: { label: "Voice" },
  alert: { label: "Alert" },
  celebrating: { label: "Celebrating" },
  sleeping: { label: "Sleeping" },
};

export const STATE_IDS = Object.keys(STATES) as StateId[];

/** States where the agent morphs into a pure icon form.
    "bang" = the exclamation mark (stem + dot). */
export const MORPHS: Partial<Record<StateId, "dots" | "bars" | "bang">> = {
  loading: "dots",
  voice: "bars",
  alert: "bang",
};

/* ----------------------------------- limbs ----------------------------------- */

export type HandsId = "none" | "side" | "raised" | "wave";

export const HANDS: Record<HandsId, { label: string; line: string }> = {
  none: { label: "None", line: "Traveling light." },
  side: { label: "Side", line: "Look — hands!" },
  raised: { label: "Raised", line: "Hands up!" },
  wave: { label: "Wave", line: "Hey, hi, hello!" },
};

export const HANDS_IDS = Object.keys(HANDS) as HandsId[];

/* ---------------------------------- texture ---------------------------------- */

export type BlendMode = "screen" | "soft-light" | "overlay" | "lighten" | "multiply";

export const BLEND_MODES: { id: BlendMode; label: string }[] = [
  { id: "screen", label: "Screen" },
  { id: "soft-light", label: "Soft" },
  { id: "overlay", label: "Overlay" },
  { id: "lighten", label: "Lighten" },
  { id: "multiply", label: "Multiply" },
];

/** Live material controls — exposed in the builder so the felt can be tuned
    by eye; the chosen values ship in the exported config. */
export type TextureSettings = {
  /** goo blur radius — how liquid the limb/satellite merges are */
  melt: number;
  /** grain amplitude 0..1 */
  grain: number;
  /** noise base frequency — smaller = coarser speckle */
  scale: number;
  /** mean brightness of the noise sheet 0..1 (with screen/lighten, keep low
      so only the bright speckles read — that's the "white grain" look) */
  bright: number;
  blend: BlendMode;
};

export const TEX0: TextureSettings = { melt: 5, grain: 0.35, scale: 0.9, bright: 0.18, blend: "screen" };

/* ----------------------------------- config ---------------------------------- */

export type EyeSettings = {
  /** proportional scale on width/height/gap together */
  size: number;
  height: number;
  /** distance between eye centers */
  gap: number;
  /** vertical offset from the face center (negative = up) */
  y: number;
};

export const EYES0: EyeSettings = { size: 1.4, height: 46, gap: 38, y: -30 };

export type AgentConfig = {
  name: string;
  shape: ShapeId;
  palette: PaletteId;
  mood: MoodId;
  state: StateId;
  hands: HandsId;
  eyes: EyeSettings;
};

export type PresetDef = {
  id: string;
  name: string;
  shape: ShapeId;
  palette: PaletteId;
  mood: MoodId;
  hands: HandsId;
};

// the five agents the paywall already sells: Scout, Onyx, Prism, Atlas, Nova.
// Limbless by default (bloub-style clean silhouettes) — hands/ears/feet stay
// available as options.
export const PRESETS: PresetDef[] = [
  { id: "nova", name: "Nova", shape: "blob", palette: "ember", mood: "happy", hands: "none" },
  { id: "atlas", name: "Atlas", shape: "dome", palette: "ocean", mood: "neutral", hands: "none" },
  { id: "scout", name: "Scout", shape: "drop", palette: "lime", mood: "curious", hands: "none" },
  { id: "prism", name: "Prism", shape: "gem", palette: "berry", mood: "excited", hands: "none" },
  { id: "onyx", name: "Onyx", shape: "squircle", palette: "graphite", mood: "focused", hands: "none" },
];

export function presetConfig(p: PresetDef): AgentConfig {
  return {
    name: p.name,
    shape: p.shape,
    palette: p.palette,
    mood: p.mood,
    state: "idle",
    hands: p.hands,
    eyes: { ...EYES0 },
  };
}

export const DEFAULT_CONFIG: AgentConfig = presetConfig(PRESETS[0]);

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function randomConfig(current: AgentConfig): AgentConfig {
  return {
    ...current,
    shape: pick(SHAPE_IDS),
    palette: pick(PALETTE_IDS),
    mood: pick(MOOD_IDS),
    // clean silhouettes most of the time; hands are the occasional surprise
    hands: pick(["none", "none", "none", "side", "wave"] as const),
    eyes: {
      size: Math.round((0.85 + Math.random() * 0.4) * 100) / 100,
      height: Math.round(34 + Math.random() * 24),
      gap: Math.round(32 + Math.random() * 20),
      y: Math.round(-40 + Math.random() * 18),
    },
  };
}
