"use client";

import { useEffect, useRef, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import { ASSETS } from "@/components/onboarding/assets";
import { SOFT } from "@/components/onboarding/primitives";
import AgentFigure from "./AgentFigure";
import AvatarView from "./AvatarView";
import { Chip, GhostButton, MoodCard, Section, ShapeThumb, Slider, Swatch } from "./controls";
import {
  DEFAULT_CONFIG,
  HANDS,
  HANDS_IDS,
  MOOD_IDS,
  PALETTE_IDS,
  PALETTES,
  PRESETS,
  presetConfig,
  randomConfig,
  SHAPE_IDS,
  SHAPES,
  STATE_IDS,
  STATES,
  type AgentConfig,
  type EyeSettings,
  type StateId,
} from "./engine";

const EASE = [0.32, 0.72, 0, 1] as const;

const text14 = "text-[14px] font-medium leading-5 tracking-[-0.28px] text-black";

// the walkthrough the "demo" button plays: a day in the agent's life,
// including both icon morphs (loading dots, voice bars)
const TOUR: StateId[] = ["loading", "voice", "alert", "celebrating", "sleeping", "idle"];

export default function AgentBuilder() {
  const [cfg, setCfg] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [view, setView] = useState<"studio" | "avatar">("studio");
  const [tour, setTour] = useState(false);
  const [blinkN, setBlinkN] = useState(0);
  const [winkN, setWinkN] = useState(0);
  const [hopN, setHopN] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // every manual change interrupts a running demo tour
  const update = (patch: Partial<AgentConfig>) => {
    setTour(false);
    setCfg((c) => ({ ...c, ...patch }));
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setTour(false);
    setCfg(presetConfig(p));
  };

  const setEyes = (patch: Partial<EyeSettings>) => {
    setTour(false);
    setCfg((c) => ({ ...c, eyes: { ...c.eyes, ...patch } }));
  };


  useEffect(() => {
    if (!tour) return;
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const step = () => {
      const s = TOUR[i];
      setCfg((c) => ({ ...c, state: s }));
      i += 1;
      t = setTimeout(i < TOUR.length ? step : () => setTour(false), 3000);
    };
    t = setTimeout(step, 150);
    return () => clearTimeout(t);
  }, [tour]);


  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-white p-2">
        {/* accent gradient follows the palette, same treatment as onboarding */}
        {PALETTE_IDS.map((id) => (
          <motion.div
            key={id}
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(${PALETTES[id].tint},0.15) 0%, rgba(${PALETTES[id].tint},0) 67%)`,
            }}
            initial={false}
            animate={{ opacity: cfg.palette === id ? 1 : 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
        ))}

        {/* header */}
        <header className="relative z-10 flex items-center gap-3 px-4 pb-3 pt-2 md:px-5">
          <img src={ASSETS.logo} alt="Maverick" className="h-5 w-auto" />
          <span className="h-4 w-px bg-black/10" />
          <span className={text14}>Agent Studio</span>
        </header>

        <main className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 md:flex-row">
          {/* stage */}
          <motion.div
            ref={trackRef}
            className="relative flex min-h-[440px] flex-1 flex-col items-center justify-center overflow-hidden rounded-[28px] bg-white shadow-[0_1px_2px_rgba(14,18,27,0.04)] md:rounded-2xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {/* stage / avatar toggle */}
            <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-1 rounded-full border border-[#f0f0f0] bg-white p-1 shadow-[0_1px_2px_rgba(14,18,27,0.04)]">
              {(["studio", "avatar"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`h-7 cursor-pointer rounded-full px-3.5 text-[13px] font-medium capitalize leading-4 tracking-[-0.26px] transition-colors ${
                    view === v ? "bg-black text-white" : "text-black/50 hover:text-black"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {view === "studio" ? (
              /* mascot only — no captions, no status text */
              <AgentFigure
                shape={cfg.shape}
                palette={cfg.palette}
                mood={cfg.mood}
                state={cfg.state}
                hands={cfg.hands}
                eyes={cfg.eyes}
                trackRef={trackRef}
                blinkSignal={blinkN}
                winkSignal={winkN}
                hopSignal={hopN}
                size={420}
              />
            ) : (
              <AvatarView cfg={cfg} />
            )}
          </motion.div>

          {/* controls */}
          <motion.div
            className="flex min-h-0 flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_1px_2px_rgba(14,18,27,0.04)] md:w-[380px] md:rounded-2xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto p-6 [scrollbar-width:thin]">
              <Enter i={0}>
                <Section
                  label="Presets"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setTour(false);
                        setCfg((c) => randomConfig(c));
                      }}
                      className="cursor-pointer font-mono text-[12px] font-medium uppercase leading-4 tracking-[-0.24px] text-[#0271e3] transition-opacity hover:opacity-70"
                    >
                      Shuffle
                    </button>
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <Chip
                        key={p.id}
                        active={p.shape === cfg.shape && p.palette === cfg.palette && p.mood === cfg.mood}
                        onClick={() => applyPreset(p)}
                      >
                        {p.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              </Enter>

              <Enter i={1}>
                <Section label="Shape">
                  <div className="grid grid-cols-4 gap-2">
                    {SHAPE_IDS.map((id) => (
                      <ShapeThumb
                        key={id}
                        def={SHAPES[id]}
                        palette={cfg.palette}
                        active={cfg.shape === id}
                        onClick={() => update({ shape: id })}
                      />
                    ))}
                  </div>
                </Section>
              </Enter>

              <Enter i={2}>
                <Section label="Color">
                  <div className="flex flex-wrap items-center gap-3 px-0.5 py-1">
                    {PALETTE_IDS.map((id) => (
                      <Swatch
                        key={id}
                        id={id}
                        active={cfg.palette === id}
                        onClick={() => update({ palette: id })}
                      />
                    ))}
                  </div>
                </Section>
              </Enter>

              <Enter i={3}>
                <Section label="Mood">
                  <div className="grid grid-cols-4 gap-2">
                    {MOOD_IDS.map((id) => (
                      <MoodCard
                        key={id}
                        id={id}
                        palette={cfg.palette}
                        active={cfg.mood === id}
                        onClick={() => update({ mood: id })}
                      />
                    ))}
                  </div>
                </Section>
              </Enter>

              <Enter i={4}>
                <Section label="Hands">
                  <div className="flex flex-wrap gap-2">
                    {HANDS_IDS.map((id) => (
                      <Chip
                        key={id}
                        active={cfg.hands === id}
                        onClick={() => update({ hands: id })}
                      >
                        {HANDS[id].label}
                      </Chip>
                    ))}
                  </div>
                </Section>
              </Enter>

              <Enter i={5}>
                <Section
                  label="State"
                  action={
                    <button
                      type="button"
                      onClick={() => setTour((t) => !t)}
                      className={`cursor-pointer font-mono text-[12px] font-medium uppercase leading-4 tracking-[-0.24px] transition-opacity hover:opacity-70 ${tour ? "text-[#e5484d]" : "text-[#0271e3]"}`}
                    >
                      {tour ? "Stop demo" : "▶ Demo"}
                    </button>
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {STATE_IDS.map((id) => (
                      <Chip
                        key={id}
                        active={cfg.state === id}
                        onClick={() => update({ state: id })}
                      >
                        {STATES[id].label}
                      </Chip>
                    ))}
                  </div>
                </Section>
              </Enter>

              <Enter i={6}>
                <Section label="Eyes">
                  <div className="flex flex-col gap-3.5">
                    <Slider
                      label="Size"
                      value={cfg.eyes.size}
                      min={0.7}
                      max={1.4}
                      step={0.01}
                      format={(v) => `${v.toFixed(2)}×`}
                      onChange={(v) => setEyes({ size: v })}
                    />
                    <Slider
                      label="Height"
                      value={cfg.eyes.height}
                      min={26}
                      max={62}
                      step={1}
                      format={(v) => `${v}u`}
                      onChange={(v) => setEyes({ height: v })}
                    />
                    <Slider
                      label="Gap"
                      value={cfg.eyes.gap}
                      min={28}
                      max={58}
                      step={1}
                      format={(v) => `${v}u`}
                      onChange={(v) => setEyes({ gap: v })}
                    />
                    <Slider
                      label="Rise"
                      value={cfg.eyes.y}
                      min={-50}
                      max={-12}
                      step={1}
                      format={(v) => `${v}u`}
                      onChange={(v) => setEyes({ y: v })}
                    />
                  </div>
                </Section>
              </Enter>

              <Enter i={7}>
                <Section label="Actions">
                  <div className="flex gap-2">
                    <GhostButton onClick={() => setBlinkN((n) => n + 1)}>Blink</GhostButton>
                    <GhostButton onClick={() => setWinkN((n) => n + 1)}>Wink</GhostButton>
                    <GhostButton onClick={() => setHopN((n) => n + 1)}>Hop</GhostButton>
                  </div>
                </Section>
              </Enter>
            </div>

          </motion.div>
        </main>
      </div>
    </MotionConfig>
  );
}

/** Staggered entrance for control sections, same rhythm as the onboarding steps. */
function Enter({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SOFT, delay: 0.2 + i * 0.06 }}
    >
      {children}
    </motion.div>
  );
}
