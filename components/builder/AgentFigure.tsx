"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { POP } from "@/components/onboarding/primitives";
import {
  buildPath,
  MOODS,
  MORPHS,
  PALETTES,
  pointAt,
  SHAPES,
  TAU,
  type EyeSettings,
  type HandsId,
  type MoodId,
  type PaletteId,
  type ShapeId,
  type StateId,
  TEX0,
  type Stroke,
  type TextureSettings,
} from "./engine";

/* springs for the rig — gooey for the silhouette, snappier for the face */
const SHAPE_SPRING = { stiffness: 110, damping: 20 };
const FACE_SPRING = { stiffness: 170, damping: 22 };
const GAZE_SPRING = { stiffness: 160, damping: 19 };
const FORM_SPRING = { stiffness: 120, damping: 18 };

/** How far the pointer can pull the gaze, matching the source lab's clamp. */
const GAZE_CAP = 0.6;

const CONFETTI = ["#FF7060", "#0271E3", "#58DC00", "#FFB800", "#FF8AF0"];


// icon forms the body morphs into (same parameter space as the shapes)
const ICON_DOT = { n: 2, nB: 2, ax: 1, ay: 1, ayB: 1, taper: 0, tilt: 0, wobA: 0, wobB: 0 };
const ICON_BAR = { n: 3.2, nB: 3.2, ax: 0.16, ay: 1, ayB: 1, taper: 0, tilt: 0, wobA: 0, wobB: 0 };
// "!" stem — negative taper widens the top, like the glyph
const ICON_BANG = { n: 2.7, nB: 2.7, ax: 0.2, ay: 1, ayB: 1, taper: -0.28, tilt: 0, wobA: 0, wobB: 0 };

type ShapeMVs = {
  n: MotionValue<number>;
  nB: MotionValue<number>;
  ax: MotionValue<number>;
  ay: MotionValue<number>;
  ayB: MotionValue<number>;
  taper: MotionValue<number>;
  tilt: MotionValue<number>;
  wobA: MotionValue<number>;
  wobB: MotionValue<number>;
};

type StrokeSprings = {
  rot: MotionValue<number>;
  dx: MotionValue<number>;
  dy: MotionValue<number>;
  sy: MotionValue<number>;
  op: MotionValue<number>;
};

type Particle = {
  id: number;
  x0: number;
  dx: number;
  peak: number;
  fall: number;
  color: string;
  size: number;
  round: boolean;
  spin: number;
  dur: number;
};

type Props = {
  shape: ShapeId;
  palette: PaletteId;
  mood: MoodId;
  state: StateId;
  hands: HandsId;
  eyes: EyeSettings;
  /** material tuning — baked to TEX0 in the studio, exposed for future use */
  texture?: TextureSettings;
  /** element whose pointer the agent watches (defaults to the stage itself) */
  trackRef?: React.RefObject<HTMLElement | null>;
  blinkSignal?: number;
  winkSignal?: number;
  hopSignal?: number;
  onPoke?: () => void;
  size?: number;
};

function useStrokeSprings(): StrokeSprings {
  return {
    rot: useSpring(0, FACE_SPRING),
    dx: useSpring(0, FACE_SPRING),
    dy: useSpring(0, FACE_SPRING),
    sy: useSpring(1, FACE_SPRING),
    op: useSpring(1, FACE_SPRING),
  };
}

export default function AgentFigure({
  shape,
  palette,
  mood,
  state,
  hands,
  eyes,
  texture = TEX0,
  trackRef,
  blinkSignal = 0,
  winkSignal = 0,
  hopSignal = 0,
  onPoke,
  size = 340,
}: Props) {
  const reduced = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerOn = useRef(false);
  const idRef = useRef(1);
  const [parts, setParts] = useState<Particle[]>([]);
  const [zeds, setZeds] = useState<{ id: number; big: boolean }[]>([]);
  const [drops, setDrops] = useState<{ id: number; side: -1 | 1 }[]>([]);
  const [hearts, setHearts] = useState<{ id: number; dx: number; s: number }[]>([]);

  const R = size * 0.3;
  const cx = size / 2;
  const cy = size / 2;
  const pal = PALETTES[palette];
  const morph = MORPHS[state] ?? null;

  /* Melting is only needed when something actually has to fuse with the body
     (a limb, or an icon-morph satellite). The goo blur works on premultiplied
     pixels, so the rim it adds darkens toward black — reading as an outline.
     Springing the blur to 0 removes that rim entirely for a plain limbless
     mascot, while still melting (and un-melting) smoothly when limbs appear. */
  const needsGoo = hands !== "none" || morph !== null;
  const gooBlur = useSpring(needsGoo ? texture.melt : 0, { stiffness: 90, damping: 20 });
  useEffect(() => {
    gooBlur.set(needsGoo ? texture.melt : 0);
  }, [needsGoo, texture.melt, gooBlur]);

  /* ------------------------------- silhouette -------------------------------- */

  // useSpring only reads the initial value on the first render; the effect
  // below is what retargets the springs on shape change or icon morph
  const def0 = SHAPES[shape];
  const sp: ShapeMVs = {
    n: useSpring(def0.n, SHAPE_SPRING),
    nB: useSpring(def0.nB, SHAPE_SPRING),
    ax: useSpring(def0.ax, SHAPE_SPRING),
    ay: useSpring(def0.ay, SHAPE_SPRING),
    ayB: useSpring(def0.ayB, SHAPE_SPRING),
    taper: useSpring(def0.taper, SHAPE_SPRING),
    tilt: useSpring(def0.tilt, SHAPE_SPRING),
    wobA: useSpring(def0.wobA, SHAPE_SPRING),
    wobB: useSpring(def0.wobB, SHAPE_SPRING),
  };
  /** avatar ↔ icon scale (applied to the body PATH, not the group — the icon
      satellites share the goo group and must not shrink with it) */
  const formScale = useSpring(1, FORM_SPRING);
  /** 1 = face + limbs shown; 0 = folded away for the icon form */
  const face = useSpring(1, FACE_SPRING);

  useEffect(() => {
    const t =
      morph === "dots" ? ICON_DOT : morph === "bars" ? ICON_BAR : morph === "bang" ? ICON_BANG : SHAPES[shape];
    sp.n.set(t.n);
    sp.nB.set(t.nB);
    sp.ax.set(t.ax);
    sp.ay.set(t.ay);
    sp.ayB.set(t.ayB);
    sp.taper.set(t.taper);
    sp.tilt.set(t.tilt);
    sp.wobA.set(t.wobA);
    sp.wobB.set(t.wobB);
    formScale.set(morph === "dots" ? 0.16 : morph === "bars" ? 0.3 : morph === "bang" ? 0.26 : 1);
    face.set(morph ? 0 : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, morph]);

  /* clock — phases ACCUMULATE so a tempo change bends the sine instead of
     snapping it (breath speed changes with mood/state) */
  const frame = useMotionValue(0);
  const ph = useRef({ wob: 0, breath: 0 });
  const breathDepth = useSpring(0.012, FACE_SPRING);
  const breathSpeed = useRef(0.26);
  useAnimationFrame((t, delta) => {
    const dt = Math.min(delta, 64) / 1000;
    ph.current.wob += dt * 0.5;
    ph.current.breath += dt * breathSpeed.current * TAU;
    frame.set(t);
  });

  /** icon-form drivers live in PATH space, not on the body group */
  const pulse = useMotionValue(1);
  const iconY = useMotionValue(0);

  const d = useTransform(
    [frame, sp.n, sp.nB, sp.ax, sp.ay, sp.ayB, sp.taper, sp.tilt, sp.wobA, sp.wobB, formScale, pulse, iconY],
    (v) => {
      const [, n, nB, ax, ay, ayB, taper, tilt, wobA, wobB, form, pu, iy] = v as number[];
      return buildPath(
        R * form, cx, cy + iy, n, nB, ax, ay * pu, ayB * pu, taper, tilt,
        reduced ? 0 : wobA,
        reduced ? 0 : wobB,
        ph.current.wob,
      );
    },
  );

  /* ------------------------------- body motion ------------------------------- */

  const squash = useMotionValue(1);
  const lean = useSpring(1, FACE_SPRING);
  const hopY = useMotionValue(0);
  const bodyRotM = useSpring(0, FACE_SPRING);
  const bodyDY = useSpring(0, FACE_SPRING);
  const gazeX = useSpring(0, GAZE_SPRING);
  const gazeY = useSpring(0, GAZE_SPRING);

  const bodyX = useTransform(gazeX, (g) => g * 10);
  const bodyY = useTransform([hopY, bodyDY, gazeY], (v) => {
    const [h, dy, g] = v as number[];
    return h + dy + g * 7;
  });
  const bodyRot = useTransform([bodyRotM, gazeX], (v) => {
    const [r, g] = v as number[];
    return r + g * 4;
  });
  // squash keeps volume: scaleY × 1/scaleX — breath drives both slightly out of
  // phase so the idle never reads as a mechanical pulse
  const scaleY = useTransform(frame, () => {
    const b = reduced ? 0 : breathDepth.get();
    return (1 + b * Math.sin(ph.current.breath)) * squash.get() * lean.get();
  });
  const scaleX = useTransform(frame, () => {
    const b = reduced ? 0 : breathDepth.get();
    return ((1 + b * 0.6 * Math.sin(ph.current.breath + 0.8)) / squash.get()) * lean.get();
  });

  const shadowScale = useTransform([hopY, formScale], (v) => {
    const [h, f] = v as number[];
    return (1 + (h / (R * 0.36)) * 0.22) * (0.35 + 0.65 * f);
  });
  const shadowOp = useTransform([hopY, formScale], (v) => {
    const [h, f] = v as number[];
    return (1 + (h / (R * 0.36)) * 0.5) * (0.5 + 0.5 * f);
  });

  /* ---------------------------------- eyes ------------------------------------ */

  const wS = useSpring(23 * eyes.size, FACE_SPRING);
  const hS = useSpring(eyes.height * eyes.size, FACE_SPRING);
  const gapS = useSpring(eyes.gap * eyes.size, FACE_SPRING);
  const eyS = useSpring(eyes.y, FACE_SPRING);

  useEffect(() => {
    wS.set(23 * eyes.size);
    hS.set(eyes.height * eyes.size);
    gapS.set(eyes.gap * eyes.size);
    eyS.set(eyes.y);
  }, [eyes.size, eyes.height, eyes.gap, eyes.y, wS, hS, gapS, eyS]);

  // each eye = two glowing strokes (see EyeGlyph in the engine)
  const La = useStrokeSprings();
  const Lb = useStrokeSprings();
  const Ra = useStrokeSprings();
  const Rb = useStrokeSprings();
  const wKL = useSpring(1, FACE_SPRING);
  const wKR = useSpring(1, FACE_SPRING);
  const tiltL = useSpring(0, FACE_SPRING);
  const tiltR = useSpring(0, FACE_SPRING);
  const dyE = useSpring(0, FACE_SPRING);
  const gapK = useSpring(1, FACE_SPRING);
  const hK = useSpring(1, FACE_SPRING);
  /** state-driven lid position (sleeping ≈ 0) */
  const openL = useSpring(1, FACE_SPRING);
  const openR = useSpring(1, FACE_SPRING);
  const blinkL = useMotionValue(1);
  const blinkR = useMotionValue(1);

  /* eyes conform to the silhouette: short shapes (pebble) get smaller,
     lower-set eyes, tall shapes (pill) taller ones, and tapered shapes
     (drop, cone) pull the eyes together where the body narrows — the face
     deforms WITH the shape instead of floating at fixed offsets */
  const fitY = useTransform(sp.ay, (a) => 0.5 + 0.5 * a);
  const fitX = useTransform([sp.ax, sp.taper, eyS], (v) => {
    const [ax, taper, ey] = v as number[];
    const ny = Math.max(-1, Math.min(1, ey / R)); // eye line, in body units
    const taperK = Math.max(1 - taper * ((1 - ny) / 2), 0.4);
    return (0.6 + 0.4 * ax) * taperK;
  });
  // the whole face also leans with the silhouette's tilt (blob -4°, drop -7°)
  const faceTiltL = useTransform([tiltL, sp.tilt], (v) => {
    const [t, st] = v as number[];
    return t + st;
  });
  const faceTiltR = useTransform([tiltR, sp.tilt], (v) => {
    const [t, st] = v as number[];
    return t + st;
  });

  /* blinks and lids compress the eye's HEIGHT rather than transform-scaling
     it — a scaled box-shadow glow smears visibly, a re-laid-out one doesn't */
  const eyeHL = useTransform([hS, hK, blinkL, openL, fitY], (v) => {
    const [h, k, b, o, fy] = v as number[];
    return Math.max(h * k * b * o * fy, 2);
  });
  const eyeHR = useTransform([hS, hK, blinkR, openR, fitY], (v) => {
    const [h, k, b, o, fy] = v as number[];
    return Math.max(h * k * b * o * fy, 2);
  });
  const eyeWL = useTransform([wS, wKL], (v) => {
    const [w, k] = v as number[];
    return w * k;
  });
  const eyeWR = useTransform([wS, wKR], (v) => {
    const [w, k] = v as number[];
    return w * k;
  });
  // eye offsets shrink with the icon form so they stay glued to the body
  // while it collapses into a dot (the lids close in the same beat)
  const eyeLx = useTransform([gapS, gapK, eyeWL, gazeX, formScale, fitX], (v) => {
    const [g, k, w, gx, f, fx] = v as number[];
    return ((-(g * k * fx) / 2) * f - w / 2) + gx * 34 * f;
  });
  const eyeRx = useTransform([gapS, gapK, eyeWR, gazeX, formScale, fitX], (v) => {
    const [g, k, w, gx, f, fx] = v as number[];
    return (((g * k * fx) / 2) * f - w / 2) + gx * 34 * f;
  });
  const eyeYL = useTransform([eyS, dyE, eyeHL, gazeY, formScale, fitY], (v) => {
    const [y, dy, h, gy, f, fy] = v as number[];
    return ((y + dy) * fy + gy * 24) * f - h / 2;
  });
  const eyeYR = useTransform([eyS, dyE, eyeHR, gazeY, formScale, fitY], (v) => {
    const [y, dy, h, gy, f, fy] = v as number[];
    return ((y + dy) * fy + gy * 24) * f - h / 2;
  });

  /* mood/state → face + posture targets. States override where they must:
     sleeping closes the lids no matter the mood, celebrating borrows ^_^,
     the icon morphs neutralize posture so the icon animates on its own. */
  useEffect(() => {
    const m = MOODS[mood];
    let b = { ...m.body };
    let open = 1;
    switch (state) {
      case "celebrating":
        b = { ...MOODS.happy.body, breathSpeed: 0.5 };
        break;
      case "sleeping":
        open = 0.07;
        b = { rot: -4, dy: 3, breathDepth: 0.03, breathSpeed: 0.12 };
        break;
      case "loading":
      case "voice":
        b = { rot: 0, dy: 0, breathDepth: 0, breathSpeed: 0.2 };
        break;
    }
    const e = state === "celebrating" ? MOODS.joyful.eyes : m.eyes;
    const apply = (s: StrokeSprings, v: Stroke) => {
      s.rot.set(v.rot);
      s.dx.set(v.dx);
      s.dy.set(v.dy);
      s.sy.set(v.sy);
      s.op.set(v.op);
    };
    apply(La, e.L.a);
    apply(Lb, e.L.b);
    apply(Ra, e.R.a);
    apply(Rb, e.R.b);
    wKL.set(e.L.wK);
    wKR.set(e.R.wK);
    tiltL.set(e.tiltL);
    tiltR.set(e.tiltR);
    dyE.set(e.dy);
    gapK.set(e.gapK);
    hK.set(e.hK);
    openL.set(open);
    openR.set(open);
    bodyRotM.set(b.rot);
    bodyDY.set(b.dy);
    breathDepth.set(b.breathDepth);
    breathSpeed.current = b.breathSpeed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, state]);

  /* ---------------------------------- limbs ----------------------------------- */

  // hand angles are springs so switching side ↔ raised slides them around the
  // body; celebrating auto-raises whatever hands the agent has
  const thL = useSpring(160, FACE_SPRING);
  const thR = useSpring(20, FACE_SPRING);
  const wigL = useMotionValue(0);
  const wigR = useMotionValue(0);
  const scHand = useSpring(hands !== "none" ? 1 : 0, FACE_SPRING);

  useEffect(() => {
    scHand.set(hands !== "none" ? 1 : 0);
  }, [hands, scHand]);

  useEffect(() => {
    const raised = hands === "raised" || (state === "celebrating" && hands !== "none");
    thL.set(raised ? 205 : 160);
    thR.set(raised ? 335 : hands === "wave" ? 332 : 20);
  }, [hands, state, thL, thR]);

  // hand life: a constant lazy sway, plus the wave loop on the right hand
  useEffect(() => {
    if (morph || hands === "none") {
      wigL.set(0);
      wigR.set(0);
      return;
    }
    const ctrls = [
      animate(wigL, [0, 3, 0, -3, 0], { duration: 5, repeat: Infinity, ease: "easeInOut" }),
      hands === "wave"
        ? animate(wigR, [0, -22, 16, -22, 16, 0], { duration: 1.7, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut", delay: 0.4 })
        : animate(wigR, [0, -3, 0, 3, 0], { duration: 5.6, repeat: Infinity, ease: "easeInOut" }),
    ];
    return () => ctrls.forEach((c) => c.stop());
  }, [hands, morph, wigL, wigR]);

  /* --------------------------------- behaviors -------------------------------- */

  /* transient moves start from the CURRENT value (null keyframe), so mashing
     a button blends like a CSS transition instead of restarting from zero */
  const blink = (mv: MotionValue<number>) =>
    animate(mv, [null, 0.08, 1], { duration: 0.36, times: [0, 0.5, 1], ease: "easeInOut" });

  // natural blink cycle (the onboarding avatars blink every ~2.8s too)
  useEffect(() => {
    if (state === "sleeping" || morph) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        blink(blinkL);
        blink(blinkR);
        loop();
      }, 2400 + Math.random() * 2200);
    };
    loop();
    return () => clearTimeout(t);
  }, [state, morph, blinkL, blinkR]);

  // wandering gaze while the pointer is away — each state looks somewhere else
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const set = (x: number, y: number) => {
      if (!pointerOn.current) {
        gazeX.set(x);
        gazeY.set(y);
      }
    };
    const loop = () => {
      switch (state) {
        case "idle":
          set((Math.random() - 0.5) * 0.9, -0.05 + (Math.random() - 0.5) * 0.5);
          t = setTimeout(loop, 2000 + Math.random() * 2200);
          break;
        case "celebrating":
          set(0, -0.25);
          t = setTimeout(loop, 1000);
          break;
        default: // sleeping and the icon morphs hold still
          set(0, state === "sleeping" ? 0.1 : 0);
          t = setTimeout(loop, 1500);
          break;
      }
    };
    loop();
    return () => clearTimeout(t);
  }, [state, gazeX, gazeY]);

  // pointer tracking over the whole preview card, clamped like the source lab
  useEffect(() => {
    const el = trackRef?.current ?? stageRef.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const st = stageRef.current;
      if (!st) return;
      const r = st.getBoundingClientRect();
      // aim from the eye line, not the geometric center
      let gx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      let gy = (e.clientY - (r.top + r.height * 0.42)) / (r.height / 2);
      const m = Math.hypot(gx, gy);
      if (m > GAZE_CAP) {
        gx = (gx / m) * GAZE_CAP;
        gy = (gy / m) * GAZE_CAP;
      }
      pointerOn.current = true;
      gazeX.set(gx);
      gazeY.set(gy);
    };
    const leave = () => {
      pointerOn.current = false;
      gazeX.set(0);
      gazeY.set(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [trackRef, gazeX, gazeY]);

  const spawnConfetti = () => {
    setParts((prev) => [
      ...prev,
      ...Array.from({ length: 14 }, () => ({
        id: idRef.current++,
        x0: (Math.random() - 0.5) * 44,
        dx: (Math.random() - 0.5) * 190,
        peak: 60 + Math.random() * 80,
        fall: 110 + Math.random() * 40,
        color: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
        size: 5 + Math.random() * 3.5,
        round: Math.random() > 0.5,
        spin: 220 + Math.random() * 340,
        dur: 1.05 + Math.random() * 0.35,
      })),
    ]);
  };

  const hop = () => {
    if (morph) return; // the icon forms own their loops
    animate(hopY, [null, -R * 0.36, 0], { duration: 0.62, times: [0, 0.44, 1], ease: ["easeOut", "easeIn"] });
    animate(squash, [null, 1.08, 0.92, 1.04, 1], { duration: 0.8, times: [0, 0.32, 0.62, 0.8, 1], ease: "easeInOut" });
  };

  const poke = () => {
    animate(squash, [null, 0.88, 1.06, 1], { duration: 0.5, times: [0, 0.35, 0.7, 1], ease: "easeInOut" });
    blink(blinkL);
    blink(blinkR);
    onPoke?.();
  };

  // celebrating: hop + confetti on entry, then keep the party going
  useEffect(() => {
    if (state !== "celebrating") return;
    const burst = () => {
      hop();
      if (!reduced) spawnConfetti();
    };
    burst();
    const iv = setInterval(burst, 2400);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // loading: the body IS the middle dot — bounce it in step with the satellites
  useEffect(() => {
    if (morph !== "dots") return;
    const ctrl = animate(iconY, [0, -13, 0], {
      duration: 0.8,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 0.4,
      delay: 0.65,
    });
    return () => {
      ctrl.stop();
      iconY.set(0);
    };
  }, [morph, iconY]);

  // voice: the body is the center bar of the equalizer
  useEffect(() => {
    if (morph !== "bars") {
      pulse.set(1);
      return;
    }
    const ctrl = animate(pulse, [1, 1.4, 1], { duration: 0.7, ease: "easeInOut", repeat: Infinity, delay: 0.3 });
    return () => {
      ctrl.stop();
      pulse.set(1);
    };
  }, [morph, pulse]);

  // alert: the body is the "!" stem — hop for attention
  useEffect(() => {
    if (morph !== "bang") return;
    const ctrl = animate(iconY, [0, -8, 0], {
      duration: 0.5,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 1.2,
      delay: 0.5,
    });
    return () => {
      ctrl.stop();
      iconY.set(0);
    };
  }, [morph, iconY]);

  // sleeping: a slow drift of z's
  useEffect(() => {
    if (state !== "sleeping") return;
    setZeds([{ id: idRef.current++, big: true }]);
    const iv = setInterval(
      () => setZeds((z) => [...z.slice(-3), { id: idRef.current++, big: Math.random() > 0.5 }]),
      2200,
    );
    return () => {
      clearInterval(iv);
      setZeds([]);
    };
  }, [state]);

  // T_T — tears drip from under both eyes
  useEffect(() => {
    if (mood !== "tearful" || morph) return;
    const spawn = () =>
      setDrops((d) => [
        ...d.slice(-6),
        { id: idRef.current++, side: -1 as const },
        { id: idRef.current++, side: 1 as const },
      ]);
    spawn();
    const iv = setInterval(spawn, 1500);
    return () => {
      clearInterval(iv);
      setDrops([]);
    };
  }, [mood, morph]);

  // :* — little hearts float off
  useEffect(() => {
    if (mood !== "smitten" || morph) return;
    const spawn = () =>
      setHearts((h) => [
        ...h.slice(-4),
        { id: idRef.current++, dx: (Math.random() - 0.3) * 26, s: 0.8 + Math.random() * 0.6 },
      ]);
    spawn();
    const iv = setInterval(spawn, 1400);
    return () => {
      clearInterval(iv);
      setHearts([]);
    };
  }, [mood, morph]);

  // x_x — a woozy sway (declared after the mood sync so its cleanup runs first
  // on mood change, letting the sync effect re-take the rotation target)
  useEffect(() => {
    if (mood !== "dizzy" || morph) return;
    const ctrl = animate(bodyRotM, [-4, 4], { duration: 1.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" });
    return () => ctrl.stop();
  }, [mood, morph, bodyRotM]);

  // one-shot actions from the controls
  useEffect(() => {
    if (blinkSignal) {
      blink(blinkL);
      blink(blinkR);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blinkSignal]);
  useEffect(() => {
    if (winkSignal) blink(blinkR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winkSignal]);
  useEffect(() => {
    if (hopSignal) hop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hopSignal]);

  /* ---------------------------------- render ---------------------------------- */

  const gradUrl = `url(#agent-grad-${uid})`;
  // grain mapping: slope = amplitude, intercept centers the noise on `bright`
  const grainSlope = texture.grain;
  const grainIcpt = Math.max(texture.bright - texture.grain / 2, -0.2);

  return (
    <div
      ref={stageRef}
      className="relative cursor-pointer select-none"
      style={{ width: size, height: size }}
      onClick={poke}
    >
      {/* halo — a soft accent glow; the LIVING color happens inside the body */}
      <div
        className="absolute rounded-full blur-3xl transition-colors duration-700"
        style={{ inset: size * 0.09, backgroundColor: `rgba(${pal.tint},0.14)` }}
      />

      {/* floor shadow */}
      <motion.div
        className="absolute left-1/2 rounded-[50%] bg-black/[0.08] blur-xl"
        style={{
          width: size * 0.46,
          height: size * 0.06,
          top: cy + R * 1.16,
          x: "-50%",
          scaleX: shadowScale,
          opacity: shadowOp,
        }}
      />

      {/* body — everything below rides posture, hops and breath together */}
      <motion.div
        className="absolute inset-0"
        style={{ x: bodyX, y: bodyY, rotate: bodyRot, scaleX, scaleY, transformOrigin: "50% 82%" }}
      >
        <svg className="absolute inset-0 overflow-visible" viewBox={`0 0 ${size} ${size}`} fill="none">
          <defs>
            {/* one gradient in USER space: body, limbs and satellites all read
                from the same ramp, so a hand is literally the body's color at
                the height it sprouts from */}
            <linearGradient
              id={`agent-grad-${uid}`}
              gradientUnits="userSpaceOnUse"
              x1={cx}
              y1={cy - R * 1.25}
              x2={cx}
              y2={cy + R * 0.95}
            >
              <stop offset="0" style={{ stopColor: pal.from, transition: "stop-color 0.6s ease" }} />
              <stop offset="1" style={{ stopColor: pal.to, transition: "stop-color 0.6s ease" }} />
            </linearGradient>
            {/* drifting color lights that live INSIDE the body (clipped to the
                live silhouette below) — this is what keeps the fill alive */}
            {/* a mid-stop keeps each light readable well past its center
                instead of falling off immediately */}
            <radialGradient id={`agent-sheen-a-${uid}`}>
              <stop offset="0%" stopOpacity="1" style={{ stopColor: pal.from, transition: "stop-color 0.6s ease" }} />
              <stop offset="45%" stopOpacity="0.7" style={{ stopColor: pal.from, transition: "stop-color 0.6s ease" }} />
              <stop offset="100%" stopOpacity="0" style={{ stopColor: pal.from, transition: "stop-color 0.6s ease" }} />
            </radialGradient>
            <radialGradient id={`agent-sheen-b-${uid}`}>
              <stop offset="0%" stopColor="#fff" stopOpacity="0.62" />
              <stop offset="45%" stopColor="#fff" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`agent-sheen-c-${uid}`}>
              <stop offset="0%" stopOpacity="0.95" style={{ stopColor: pal.to, transition: "stop-color 0.6s ease" }} />
              <stop offset="45%" stopOpacity="0.6" style={{ stopColor: pal.to, transition: "stop-color 0.6s ease" }} />
              <stop offset="100%" stopOpacity="0" style={{ stopColor: pal.to, transition: "stop-color 0.6s ease" }} />
            </radialGradient>
            <clipPath id={`agent-clip-${uid}`}>
              <motion.path d={d} />
            </clipPath>
            {/* liquid merge (gooey.jakubantalik.com recipe): blur + steep alpha
                threshold melts limbs into the body and lets the icon satellites
                split off / reabsorb like droplets. `melt` is user-tunable. */}
            <filter id={`agent-goo-${uid}`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
              <motion.feGaussianBlur in="SourceGraphic" stdDeviation={gooBlur} result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
                result="goo"
              />
              {/* the goo band keeps premultiplied blur colors, which darken
                  toward black at the rim — re-tint the whole goo silhouette
                  with a flat palette color so the crisp graphic sits on a
                  clean fill instead of a dark outline */}
              <feFlood floodColor={pal.to} result="gooFill" />
              <feComposite in="gooFill" in2="goo" operator="in" result="gooTint" />
              <feComposite in="SourceGraphic" in2="gooTint" operator="over" />
            </filter>
            {/* felt material: top light, bottom occlusion, then blended grain.
                hardAlpha uses a smooth table threshold — a 127× alpha boost
                amplifies faint goo residue into visible streak artifacts, and
                the final clip runs against this cleaned alpha for the same
                reason. */}
            <filter id={`agent-mat-${uid}`} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
              <feComponentTransfer in="SourceAlpha" result="hardAlpha">
                <feFuncA type="table" tableValues="0 0 1 1" />
              </feComponentTransfer>
              <feOffset in="hardAlpha" dy="8" result="offTop" />
              <feGaussianBlur in="offTop" stdDeviation="10" result="blurTop" />
              <feComposite in="blurTop" in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" result="innTop" />
              <feColorMatrix in="innTop" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" result="lightTop" />
              <feBlend mode="normal" in="lightTop" in2="SourceGraphic" result="lit" />
              {/* (no dark bottom occlusion — a multiplied inner shade reads as
                  a dirty outline hugging the silhouette) */}
              <feTurbulence type="fractalNoise" baseFrequency={texture.scale} numOctaves="2" seed="4" result="noise" />
              <feColorMatrix in="noise" type="saturate" values="0" result="noiseG" />
              <feComponentTransfer in="noiseG" result="noiseC">
                <feFuncR type="linear" slope={grainSlope} intercept={grainIcpt} />
                <feFuncG type="linear" slope={grainSlope} intercept={grainIcpt} />
                <feFuncB type="linear" slope={grainSlope} intercept={grainIcpt} />
                <feFuncA type="linear" slope="0" intercept="1" />
              </feComponentTransfer>
              <feBlend mode={texture.blend} in="noiseC" in2="lit" result="felt" />
              <feComposite in="felt" in2="hardAlpha" operator="in" />
            </filter>
          </defs>

          {/* material wraps the goo result, so the merged liquid gets one
              continuous felt texture */}
          <g filter={`url(#agent-mat-${uid})`}>
            <g filter={`url(#agent-goo-${uid})`}>
              {/* limbs sit behind the body and melt into it through the goo */}
              <Limb frame={frame} sp={sp} theta={thL} wig={wigL} on={scHand} gate={face} form={formScale} ph={ph} R={R} cx={cx} cy={cy} w={24} len={50} out={0.14} stroke={gradUrl} />
              <Limb frame={frame} sp={sp} theta={thR} wig={wigR} on={scHand} gate={face} form={formScale} ph={ph} R={R} cx={cx} cy={cy} w={24} len={50} out={0.14} stroke={gradUrl} />

              <motion.path d={d} fill={gradUrl} />

              {/* living fill — soft color lights wander through the body,
                  clipped to the morphing silhouette so they never spill */}
              <g clipPath={`url(#agent-clip-${uid})`}>
                <motion.circle
                  r={R * 0.9}
                  fill={`url(#agent-sheen-a-${uid})`}
                  cx={cx - R * 0.45}
                  cy={cy - R * 0.35}
                  animate={{
                    cx: [cx - R * 0.45, cx + R * 0.5, cx - R * 0.45],
                    cy: [cy - R * 0.35, cy + R * 0.4, cy - R * 0.35],
                  }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.circle
                  r={R * 0.7}
                  fill={`url(#agent-sheen-b-${uid})`}
                  cx={cx + R * 0.5}
                  cy={cy - R * 0.5}
                  animate={{
                    cx: [cx + R * 0.5, cx - R * 0.4, cx + R * 0.5],
                    cy: [cy - R * 0.5, cy - R * 0.1, cy - R * 0.5],
                  }}
                  transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                />
                <motion.circle
                  r={R * 0.8}
                  fill={`url(#agent-sheen-c-${uid})`}
                  cx={cx}
                  cy={cy + R * 0.55}
                  animate={{
                    cx: [cx, cx - R * 0.5, cx + R * 0.4, cx],
                    cy: [cy + R * 0.55, cy + R * 0.2, cy + R * 0.5, cy + R * 0.55],
                  }}
                  transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
                />
              </g>

              {/* icon satellites — spring out of the body and get pulled back in */}
              <AnimatePresence>
                {morph === "dots" &&
                  [-1, 1].map((side) => (
                    <motion.circle
                      key={`dot${side}`}
                      fill={gradUrl}
                      initial={{ cx, cy, r: 0 }}
                      animate={{ cx: cx + side * 46, r: 16.5, cy: [cy, cy - 13, cy] }}
                      // every animated attribute must also appear in exit — a
                      // keyframed one left out resolves to undefined mid-exit
                      exit={{ cx, cy, r: 0, transition: { duration: 0.28, ease: "easeIn" } }}
                      transition={{
                        cx: { ...POP, delay: 0.12 },
                        r: { ...POP, delay: 0.12 },
                        cy: {
                          duration: 0.8,
                          repeat: Infinity,
                          repeatDelay: 0.4,
                          delay: side < 0 ? 0.45 : 0.85,
                          ease: "easeInOut",
                        },
                      }}
                    />
                  ))}
                {morph === "bang" && (
                  <motion.circle
                    key="bangdot"
                    fill={gradUrl}
                    initial={{ cx, cy, r: 0 }}
                    animate={{ cx, cy: cy + 46, r: 8.5 }}
                    exit={{ cx, cy, r: 0, transition: { duration: 0.25, ease: "easeIn" } }}
                    transition={{ cy: { ...POP, delay: 0.12 }, r: { ...POP, delay: 0.12 } }}
                  />
                )}
                {morph === "bars" &&
                  [
                    { off: -44, h: 34, dl: 0 },
                    { off: -22, h: 56, dl: 0.12 },
                    { off: 22, h: 56, dl: 0.24 },
                    { off: 44, h: 34, dl: 0.36 },
                  ].map((b) => (
                    <motion.rect
                      key={`bar${b.off}`}
                      width={10}
                      rx={5}
                      fill={gradUrl}
                      initial={{ x: cx - 5, y: cy - 3, height: 6 }}
                      animate={{ x: cx - 5 + b.off, height: [12, b.h], y: [cy - 6, cy - b.h / 2] }}
                      exit={{ x: cx - 5, height: 6, y: cy - 3, transition: { duration: 0.25, ease: "easeIn" } }}
                      transition={{
                        x: { ...POP, delay: 0.1 },
                        height: { duration: 0.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: b.dl },
                        y: { duration: 0.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: b.dl },
                      }}
                    />
                  ))}
              </AnimatePresence>
            </g>
          </g>

        </svg>

        {/* eyes — two solid strokes each, so kaomoji glyphs (^_^, x_x, o_o)
            morph from the same parts as the classic pills. The glow is a
            drop-shadow on the CONTAINER: it hugs the union of the strokes, so
            a caret blooms as ONE bent line, never as two outlined bars. */}
        <motion.div
          className="absolute left-1/2 top-1/2"
          style={{ x: eyeLx, y: eyeYL, width: eyeWL, height: eyeHL, rotate: faceTiltL, opacity: face, filter: EYE_BLOOM }}
        >
          <EyeStroke s={La} base={hS} />
          <EyeStroke s={Lb} base={hS} />
        </motion.div>
        <motion.div
          className="absolute left-1/2 top-1/2"
          style={{ x: eyeRx, y: eyeYR, width: eyeWR, height: eyeHR, rotate: faceTiltR, opacity: face, filter: EYE_BLOOM }}
        >
          <EyeStroke s={Ra} base={hS} />
          <EyeStroke s={Rb} base={hS} />
        </motion.div>

        {/* tears ride the face so they stay under the eyes through the slump */}
        {drops.map((t) => (
          <motion.span
            key={t.id}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: cx + t.side * ((eyes.gap * eyes.size) / 2 + 2) - 3,
              top: cy + eyes.y + (eyes.height * eyes.size) / 2 + 4,
              width: 6,
              height: 9,
              backgroundColor: "#9ED9FF",
            }}
            initial={{ opacity: 0, y: 0, scaleY: 0.6 }}
            animate={{ opacity: [0, 0.9, 0], y: 34, scaleY: 1.2 }}
            transition={{ duration: 1.1, ease: "easeIn" }}
            onAnimationComplete={() => setDrops((s) => s.filter((q) => q.id !== t.id))}
          />
        ))}

      </motion.div>

      {/* effects layer — confetti, z's and hearts live outside the body transform */}
      <div className="pointer-events-none absolute inset-0">
        {parts.map((p) => (
          <motion.span
            key={p.id}
            className="absolute left-1/2"
            style={{
              top: cy - R * 0.7,
              backgroundColor: p.color,
              width: p.size,
              height: p.round ? p.size : p.size * 1.9,
              borderRadius: p.round ? "50%" : 1.5,
            }}
            initial={{ x: p.x0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: [p.x0, p.x0 + p.dx * 0.7, p.x0 + p.dx],
              y: [0, -p.peak, p.fall],
              rotate: p.spin,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: p.dur,
              times: [0, 0.42, 1],
              ease: ["easeOut", "easeIn"],
              opacity: { duration: p.dur, times: [0, 0.72, 1] },
              rotate: { duration: p.dur, ease: "linear" },
            }}
            onAnimationComplete={() => setParts((s) => s.filter((q) => q.id !== p.id))}
          />
        ))}
        {zeds.map((z) => (
          <motion.span
            key={z.id}
            className={`absolute font-mono font-medium text-black/40 ${z.big ? "text-[16px]" : "text-[12px]"}`}
            style={{ left: cx + R * 0.5, top: cy - R * 0.85 }}
            initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
            animate={{ opacity: [0, 0.7, 0], x: 30, y: -58, rotate: 16 }}
            transition={{ duration: 2.6, ease: "easeOut" }}
            onAnimationComplete={() => setZeds((s) => s.filter((q) => q.id !== z.id))}
          >
            z
          </motion.span>
        ))}
        {hearts.map((h) => (
          <motion.span
            key={h.id}
            className="absolute select-none font-medium"
            style={{ left: cx + R * 0.4, top: cy - R * 0.55, fontSize: 15 * h.s, color: "#FF7AA8" }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.4, rotate: -8 }}
            animate={{ opacity: [0, 1, 0], x: [0, h.dx, h.dx * 1.6], y: -56, scale: h.s, rotate: 10 }}
            transition={{ duration: 2, ease: "easeOut" }}
            onAnimationComplete={() => setHearts((s) => s.filter((q) => q.id !== h.id))}
          >
            ♥
          </motion.span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- eye stroke ---------------------------------- */

/** One bloom per EYE, applied on the container — the shadow follows the union
    of the strokes, so multi-stroke glyphs glow as a single glyph. */
const EYE_BLOOM =
  "drop-shadow(0 0 6px rgba(255,255,255,0.7)) drop-shadow(0 0 14px rgba(255,255,255,0.4))";

/** One bar of an eye — plain solid white, no glow of its own, so overlapping
    strokes fuse seamlessly. Offsets are stored as fractions of the base eye
    height so glyphs survive the eye sliders. */
function EyeStroke({ s, base }: { s: StrokeSprings; base: MotionValue<number> }) {
  const x = useTransform([s.dx, base], (v) => {
    const [d, h] = v as number[];
    return d * h;
  });
  const y = useTransform([s.dy, base], (v) => {
    const [d, h] = v as number[];
    return d * h;
  });
  return (
    <motion.span
      className="absolute inset-0 rounded-full"
      style={{
        x,
        y,
        rotate: s.rot,
        scaleY: s.sy,
        opacity: s.op,
        backgroundColor: "#fff",
      }}
    />
  );
}

/* ----------------------------------- limbs ----------------------------------- */

/** A nub (hand, ear or foot) glued to the live outline. The anchor is sampled
    from the same generator as the body path each frame, so limbs ride along
    through every shape morph; the goo filter melts the seam. The capsule is a
    round-capped line — its endpoints straddle the anchor (biased outward by
    `out` so the nub reads clearly), and scaling to 0 retracts it into the
    body edge. (A transform string on motion.g is NOT used: framer treats
    `transform` as a motion prop and re-orders it, which detaches the limb.) */
function Limb({
  frame,
  sp,
  theta,
  wig,
  on,
  gate,
  form,
  ph,
  R,
  cx,
  cy,
  w,
  len,
  out,
  stroke,
}: {
  frame: MotionValue<number>;
  sp: ShapeMVs;
  theta: MotionValue<number>;
  wig: MotionValue<number>;
  on: MotionValue<number>;
  gate: MotionValue<number>;
  form: MotionValue<number>;
  ph: React.RefObject<{ wob: number; breath: number }>;
  R: number;
  cx: number;
  cy: number;
  w: number;
  len: number;
  out: number;
  stroke: string;
}) {
  const deps = [frame, theta, wig, on, gate, form, sp.n, sp.nB, sp.ax, sp.ay, sp.ayB, sp.taper, sp.tilt, sp.wobA, sp.wobB];
  // endpoints sit (len - w)/2 from the anchor so the round caps complete the
  // capsule at exactly `len`; everything scales toward the anchor as s → 0
  const calc = (v: number[]) => {
    const [, thDeg, wg, o, g, f, n, nB, ax, ay, ayB, taper, tilt, wobA, wobB] = v;
    const th = (thDeg * Math.PI) / 180;
    const p = pointAt(R * 0.99 * f, n, nB, ax, ay, ayB, taper, tilt, wobA, wobB, ph.current.wob, th);
    const dir = ((thDeg + tilt + wg) * Math.PI) / 180;
    const s = Math.max(o * g, 0);
    const half = ((len - w) / 2) * s;
    const bias = len * out * s;
    const ox = cx + p.x + Math.cos(dir) * bias;
    const oy = cy + p.y + Math.sin(dir) * bias;
    return {
      x1: ox - Math.cos(dir) * half,
      y1: oy - Math.sin(dir) * half,
      x2: ox + Math.cos(dir) * half,
      y2: oy + Math.sin(dir) * half,
      sw: w * s,
    };
  };
  const x1 = useTransform(deps, (v) => calc(v as number[]).x1);
  const y1 = useTransform(deps, (v) => calc(v as number[]).y1);
  const x2 = useTransform(deps, (v) => calc(v as number[]).x2);
  const y2 = useTransform(deps, (v) => calc(v as number[]).y2);
  const sw = useTransform(deps, (v) => calc(v as number[]).sw);
  return <motion.line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={sw} strokeLinecap="round" stroke={stroke} />;
}
