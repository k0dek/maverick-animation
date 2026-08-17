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
  | "brick"
  | "gem"
  | "shard"
  | "drop"
  | "egg"
  | "puff"
  | "star"
  | "dome"
  | "mushroom"
  | "pill"
  | "bean"
  | "cone"
  | "leaf"
  | "pebble"
  | "boulder"
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
  // n < 2 pinches the corners (shard, leaf); n > 4 squares them off (brick).
  // A strong 8-lobe wobble spikes the outline (star); a strong 3-lobe one
  // makes it lopsided (bean, boulder). Negative taper flares the top.
  brick: { label: "Brick", n: 7, nB: 7, ax: 1.02, ay: 0.84, ayB: 0.84, taper: 0.02, tilt: 0, wobA: 0.01, wobB: 0 },
  shard: { label: "Shard", n: 1.08, nB: 1.08, ax: 1.12, ay: 1.14, ayB: 1.14, taper: 0, tilt: 0, wobA: 0.015, wobB: 0 },
  egg: { label: "Egg", n: 2.2, nB: 2.5, ax: 0.92, ay: 1.12, ayB: 1.02, taper: 0.32, tilt: 0, wobA: 0.015, wobB: 0 },
  star: { label: "Star", n: 2, nB: 2, ax: 1.05, ay: 1.05, ayB: 1.05, taper: 0, tilt: 0, wobA: 0, wobB: 0.2 },
  mushroom: { label: "Mushroom", n: 2.1, nB: 6, ax: 1.04, ay: 0.9, ayB: 0.66, taper: -0.22, tilt: 0, wobA: 0.02, wobB: 0 },
  bean: { label: "Bean", n: 2.5, nB: 2.5, ax: 1.02, ay: 0.95, ayB: 0.95, taper: 0.05, tilt: 14, wobA: 0.095, wobB: 0 },
  leaf: { label: "Leaf", n: 1.35, nB: 1.35, ax: 1.2, ay: 0.82, ayB: 0.82, taper: 0, tilt: 38, wobA: 0.02, wobB: 0 },
  boulder: { label: "Boulder", n: 2.9, nB: 3.2, ax: 1.06, ay: 0.94, ayB: 0.88, taper: 0.04, tilt: -6, wobA: 0.06, wobB: 0.055 },
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
  | "graphite"
  | "slate"
  | "honey"
  | "lime"
  | "forest"
  | "mint"
  | "ocean"
  | "indigo"
  | "berry"
  | "rose"
  | "coral"
  | "ember";

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
  graphite: { label: "Graphite", from: "#565F6E", to: "#0C0F16", tint: "14,18,27" },
  slate: { label: "Slate", from: "#A8BDD6", to: "#3D5470", tint: "61,84,112" },
  honey: { label: "Honey", from: "#FFEF60", to: "#DCA200", tint: "255,162,2" },
  lime: { label: "Lime", from: "#FFEF60", to: "#58DC00", tint: "88,220,0" },
  forest: { label: "Forest", from: "#A6F17A", to: "#127A3F", tint: "18,122,63" },
  mint: { label: "Mint", from: "#7CFFD4", to: "#00B589", tint: "0,181,137" },
  ocean: { label: "Ocean", from: "#60F7FF", to: "#0051DC", tint: "2,113,227" },
  indigo: { label: "Indigo", from: "#A9B8FF", to: "#2B18C4", tint: "43,24,196" },
  berry: { label: "Berry", from: "#FF8AF0", to: "#7A1FD0", tint: "162,60,220" },
  rose: { label: "Rose", from: "#FFAEDC", to: "#D6216B", tint: "214,33,107" },
  coral: { label: "Coral", from: "#FFA98B", to: "#E5484D", tint: "229,72,77" },
  ember: { label: "Ember", from: "#FF7060", to: "#DC9700", tint: "247,107,21" },
};

export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];

/** "#RRGGBB" + alpha → rgba() string (the live backdrop blends palette hues). */
export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ----------------------------------- moods ----------------------------------- */

/** An eye is ONE stroked polyline — never two overlapping shapes, which come
    apart the moment a blink squashes them. Three points cover the whole
    alphabet: collinear vertical = pill, bent = caret, collinear horizontal =
    dash. Morphing between glyphs is just lerping six numbers, and round caps
    plus round joins keep it a single continuous form at every step.

    Points are in unit box coords (x, y ∈ [-0.5, 0.5]) measured on the stroke
    CENTRE line; the renderer insets them by half the stroke, so a glyph
    spanning the full range ends up exactly the size of its eye box. */
export type EyeGlyph = {
  p: [number, number, number, number, number, number];
  /** stroke thickness, as a fraction of the eye box width */
  sw: number;
};

const pill = (sy = 1): EyeGlyph => ({ p: [0, -0.5 * sy, 0, 0, 0, 0.5 * sy], sw: 1 });
/** ^ — a single bent stroke, not two legs meeting */
const caret: EyeGlyph = { p: [-0.5, 0.28, 0, -0.32, 0.5, 0.28], sw: 0.46 };
const dash: EyeGlyph = { p: [-0.5, 0, 0, 0, 0.5, 0], sw: 0.44 };

export type EyeSide = {
  g: EyeGlyph;
  /** width / height scale, relative to the configured eye size */
  w: number;
  h: number;
  /** horizontal slant, in degrees — the lid angle that carries most of the mood */
  skew: number;
  rot: number;
  dx: number;
  dy: number;
};

const E = (
  g: EyeGlyph,
  { w = 1, h = 1, skew = 0, rot = 0, dx = 0, dy = 0 }: Partial<Omit<EyeSide, "g">> = {},
): EyeSide => ({ g, w, h, skew, rot, dx, dy });

export type MoodEyes = { L: EyeSide; R: EyeSide; gapK: number };

export type MoodBody = {
  rot: number;
  dy: number;
  breathDepth: number;
  breathSpeed: number;
};

export type MoodId =
  | "neutral"
  | "attentive"
  | "happy"
  | "laughing"
  | "excited"
  | "proud"
  | "curious"
  | "confused"
  | "suspicious"
  | "unimpressed"
  | "focused"
  | "angry"
  | "sad"
  | "scared"
  | "shy"
  | "sleepy";

export type MoodDef = { label: string; eyes: MoodEyes; body: MoodBody };

// sad keeps the onboarding slump (inner corners up, lids low, body leaning),
// so the studio stays in character with the funnel. The kaomoji row
// (^_^, >_<, o_o, x_x, -_-, :*, T_T) builds on the same two strokes.
export const MOODS: Record<MoodId, MoodDef> = {
  neutral: {
    label: "Neutral",
    eyes: { L: E(pill()), R: E(pill()), gapK: 1 },
    body: { rot: 0, dy: 0, breathDepth: 0.012, breathSpeed: 0.26 },
  },
  attentive: {
    label: "Attentive",
    eyes: {
      L: E(pill(), { h: 1.12, w: 1.05, dy: -0.04 }),
      R: E(pill(), { h: 1.12, w: 1.05, dy: -0.04 }),
      gapK: 1.02,
    },
    body: { rot: 0, dy: -1, breathDepth: 0.016, breathSpeed: 0.4 },
  },
  happy: {
    label: "Happy",
    eyes: {
      L: E(pill(0.88), { rot: -8, dy: -0.07 }),
      R: E(pill(0.88), { rot: 8, dy: -0.07 }),
      gapK: 1.02,
    },
    body: { rot: 0, dy: -1, breathDepth: 0.016, breathSpeed: 0.34 },
  },
  laughing: {
    label: "Laughing",
    eyes: { L: E(caret, { h: 0.72, dy: -0.05 }), R: E(caret, { h: 0.72, dy: -0.05 }), gapK: 1.04 },
    body: { rot: 0, dy: -2, breathDepth: 0.032, breathSpeed: 0.95 },
  },
  excited: {
    label: "Excited",
    eyes: {
      L: E(pill(), { h: 1.2, w: 1.08, rot: -4, dy: -0.11 }),
      R: E(pill(), { h: 1.2, w: 1.08, rot: 4, dy: -0.11 }),
      gapK: 1.06,
    },
    body: { rot: 0, dy: -2, breathDepth: 0.022, breathSpeed: 0.5 },
  },
  proud: {
    label: "Proud",
    eyes: { L: E(caret, { h: 0.6 }), R: E(caret, { h: 0.6 }), gapK: 1.06 },
    body: { rot: 0, dy: -3, breathDepth: 0.02, breathSpeed: 0.28 },
  },
  curious: {
    label: "Curious",
    eyes: {
      L: E(pill(), { h: 1.1, rot: -3, dy: -0.05 }),
      R: E(pill(), { h: 0.68, rot: 10, dy: 0.02 }),
      gapK: 1.04,
    },
    body: { rot: 3, dy: 0, breathDepth: 0.014, breathSpeed: 0.3 },
  },
  confused: {
    label: "Confused",
    // deliberately lopsided: a small squashed eye beside a wide slanted one
    eyes: {
      L: E(pill(), { w: 0.85, h: 0.46, dy: 0.02 }),
      R: E(pill(), { w: 1.5, h: 0.44, rot: -20, skew: -12, dy: -0.04 }),
      gapK: 1.08,
    },
    body: { rot: 5, dy: 0, breathDepth: 0.012, breathSpeed: 0.28 },
  },
  suspicious: {
    label: "Suspicious",
    eyes: {
      L: E(pill(), { h: 0.36, skew: 12, dy: 0.04 }),
      R: E(pill(), { h: 0.36, skew: -12, dy: 0.04 }),
      gapK: 0.98,
    },
    body: { rot: 2, dy: 1, breathDepth: 0.01, breathSpeed: 0.22 },
  },
  unimpressed: {
    label: "Unimpressed",
    eyes: {
      L: E(dash, { h: 0.62, dy: 0.05 }),
      R: E(dash, { h: 0.62, dy: 0.05 }),
      gapK: 1,
    },
    body: { rot: -2, dy: 1, breathDepth: 0.007, breathSpeed: 0.15 },
  },
  focused: {
    label: "Focused",
    eyes: {
      L: E(pill(0.56), { rot: 6 }),
      R: E(pill(0.56), { rot: -6 }),
      gapK: 0.94,
    },
    body: { rot: 0, dy: 0, breathDepth: 0.008, breathSpeed: 0.22 },
  },
  angry: {
    label: "Angry",
    // inverse of sad: inner corners driven DOWN, lids narrowed and slanted
    eyes: {
      L: E(pill(), { h: 0.58, rot: -20, skew: -10 }),
      R: E(pill(), { h: 0.58, rot: 20, skew: 10 }),
      gapK: 0.96,
    },
    body: { rot: 0, dy: 0, breathDepth: 0.01, breathSpeed: 0.6 },
  },
  sad: {
    label: "Sad",
    eyes: {
      L: E(pill(0.72), { rot: 22, dy: 0.07 }),
      R: E(pill(0.72), { rot: -22, dy: 0.07 }),
      gapK: 1,
    },
    body: { rot: -6, dy: 3, breathDepth: 0.008, breathSpeed: 0.18 },
  },
  scared: {
    label: "Scared",
    eyes: {
      L: E(pill(), { w: 1.25, h: 1.22, dy: 0.03 }),
      R: E(pill(), { w: 1.25, h: 1.22, dy: 0.03 }),
      gapK: 1.06,
    },
    body: { rot: 0, dy: 2, breathDepth: 0.006, breathSpeed: 1.15 },
  },
  shy: {
    label: "Shy",
    eyes: {
      L: E(pill(0.5), { h: 0.9, dy: 0.07 }),
      R: E(pill(0.5), { h: 0.9, dy: 0.07 }),
      gapK: 1.12,
    },
    body: { rot: -3, dy: 2, breathDepth: 0.012, breathSpeed: 0.2 },
  },
  sleepy: {
    label: "Sleepy",
    eyes: {
      L: E(pill(0.34), { rot: -6, dy: 0.09 }),
      R: E(pill(0.34), { rot: 6, dy: 0.09 }),
      gapK: 1,
    },
    body: { rot: -3, dy: 2, breathDepth: 0.02, breathSpeed: 0.12 },
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
    eyes: {
      size: Math.round((0.85 + Math.random() * 0.4) * 100) / 100,
      height: Math.round(34 + Math.random() * 24),
      gap: Math.round(32 + Math.random() * 20),
      y: Math.round(-40 + Math.random() * 18),
    },
  };
}
