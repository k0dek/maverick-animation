"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ASSETS } from "./assets";
import Paywall from "./Paywall";
import { ChatScene, SCENES } from "./scenes";
import {
  CapabilitiesIllustration,
  CapabilitiesStep,
  CompanyIllustration,
  type CompanyInfo,
  CompanyStep,
  EmailIllustration,
  EmailStep,
  PhoneIllustration,
  PhoneStep,
} from "./steps";

/** Time one showcase scene stays on screen (step 0 only). The choreography finishes
    at ~10.5s (beats end at 7s, the reply builds for ~3.5s); the rest is a deliberate
    hold so the finished scene can be read before it hands off to the next one. */
const SCENE_MS = 14500;

const GRADIENTS = [
  "linear-gradient(180deg, rgba(247,107,21,0.15) 0%, rgba(247,107,21,0) 67%)",
  "linear-gradient(180deg, rgba(2,113,227,0.15) 0%, rgba(2,113,227,0) 67%)",
  "linear-gradient(180deg, rgba(88,220,0,0.15) 0%, rgba(88,220,0,0) 67%)",
];

const EASE = [0.32, 0.72, 0, 1] as const;

/** URL slug per funnel step, so a refresh (or back/forward) restores the step. */
const STEP_SLUGS = ["register", "company", "email", "capabilities", "phone", "paywall"];

const stepFromUrl = () => {
  const slug = new URLSearchParams(window.location.search).get("step");
  const idx = STEP_SLUGS.indexOf(slug ?? "");
  return idx > 0 ? idx : 0;
};

// layout-effect on the client so the restored step paints first (no step-0 flash);
// the page is statically prerendered, so fall back to useEffect off-DOM
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function MaverickOnboarding() {
  // step 0 = register; 1–4 = the onboarding steps that follow the email
  const [step, setStep] = useState(0);
  const [scene, setScene] = useState(0);

  // restore from the URL before first paint, and follow browser back/forward
  useIsomorphicLayoutEffect(() => {
    setStep(stepFromUrl());
    const onPop = () => setStep(stepFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // reflect the current step in the URL (keeps other params like ?hold intact)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (step === 0) url.searchParams.delete("step");
    else url.searchParams.set("step", STEP_SLUGS[step]);
    if (url.href !== window.location.href) window.history.pushState({}, "", url);
  }, [step]);

  // per-step state, shared between the left card and its right-side illustration
  const [company, setCompany] = useState<CompanyInfo>({ name: "", role: "", about: "" });
  const [caps, setCaps] = useState([true, true, true]);
  const [channels, setChannels] = useState({ telegram: false, whatsapp: false });
  // which channel is mid-setup (its connect flow is expanded)
  const [setup, setSetup] = useState<"telegram" | "whatsapp" | null>(null);

  useEffect(() => {
    if (step !== 0) return;
    // ?hold — freeze auto-advance (handy for design review)
    if (typeof window !== "undefined" && window.location.search.includes("hold")) return;
    const t = setTimeout(() => setScene((s) => (s + 1) % SCENES.length), SCENE_MS);
    return () => clearTimeout(t);
  }, [scene, step]);

  const next = () =>
    setStep((s) => {
      const n = (s + 1) % 6;
      // looping back to the start clears the previous run's answers
      if (n === 0) {
        setCompany({ name: "", role: "", about: "" });
        setCaps([true, true, true]);
        setChannels({ telegram: false, whatsapp: false });
        setSetup(null);
      }
      return n;
    });

  // steps 1–4 keep the orange gradient from the design; step 0 follows the scene
  const gradient = step === 0 ? scene : 0;

  const rightPanels: Record<number, React.ReactNode> = {
    1: <CompanyIllustration values={company} />,
    2: <EmailIllustration />,
    3: <CapabilitiesIllustration enabled={caps} />,
    4: <PhoneIllustration channels={channels} />,
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-white p-2">
        {/* accent gradient */}
        {GRADIENTS.map((g, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: g }}
            initial={false}
            animate={{ opacity: gradient === i ? 1 : 0 }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
          />
        ))}

        {/* left · card */}
        <motion.div
          className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-center rounded-[28px] bg-white shadow-[0_1px_2px_rgba(14,18,27,0.04)] md:rounded-2xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              // exits quickly so the next step is never left waiting behind it
              exit={{ opacity: 0, y: -28, filter: "blur(6px)", transition: { duration: 0.3, ease: EASE } }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              {step === 0 && <LoginCard onContinue={next} />}
              {step === 1 && (
                <CompanyStep
                  values={company}
                  onChange={(k, v) => setCompany((c) => ({ ...c, [k]: v }))}
                  onContinue={next}
                  onSkip={next}
                />
              )}
              {step === 2 && <EmailStep onNext={next} onSkip={next} />}
              {step === 3 && (
                <CapabilitiesStep
                  enabled={caps}
                  onToggle={(i) => setCaps((c) => c.map((v, j) => (j === i ? !v : v)))}
                  onContinue={next}
                />
              )}
              {step === 4 && (
                <PhoneStep
                  channels={channels}
                  onToggle={(k, v) => {
                    setChannels((c) => ({ ...c, [k]: v }));
                    // linking (or unlinking) closes the setup flow
                    setSetup(null);
                  }}
                  setup={setup}
                  onSetup={setSetup}
                  onSkip={next}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* right · showcase / illustration — desktop only; mobile keeps just the card */}
        <div className="relative hidden h-full min-w-0 flex-1 flex-col items-center justify-end pb-6 md:flex">
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step === 0 ? `scene-${scene}` : `step-${step}`}
                initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -40, filter: "blur(8px)" }}
                transition={{ duration: 1, ease: EASE }}
              >
                {step === 0 ? <ChatScene scene={SCENES[scene]} /> : rightPanels[step]}
              </motion.div>
            </AnimatePresence>
          </div>
          {step === 0 && <StepDots active={scene} count={SCENES.length} onSelect={setScene} />}
        </div>

        {/* step 5 · paywall — full-screen scrollable overlay */}
        <AnimatePresence>
          {step === 5 && (
            <motion.div
              className="absolute inset-0 z-20 overflow-y-auto bg-white"
              initial={{ opacity: 0, y: 96, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 96, filter: "blur(8px)", transition: { duration: 0.4, ease: EASE } }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <Paywall onDone={next} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/* --------------------------------- StepDots ---------------------------------- */

function StepDots({
  active,
  count,
  onSelect,
}: {
  active: number;
  count: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full p-3">
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === active;
        return (
          <motion.button
            key={i}
            type="button"
            aria-label={`Step ${i + 1}`}
            onClick={() => onSelect(i)}
            className="relative h-1.5 cursor-pointer overflow-hidden rounded-full"
            animate={{
              width: isActive ? 40 : 6,
              backgroundColor: isActive
                ? "rgba(0,0,0,0.12)"
                : i < active
                  ? "rgba(0,0,0,1)"
                  : "rgba(0,0,0,0.08)",
            }}
            transition={{ type: "spring", stiffness: 200, damping: 28 }}
          >
            {isActive && (
              <motion.span
                key={`fill-${active}`}
                className="absolute inset-y-0 left-0 rounded-full bg-black"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: SCENE_MS / 1000, ease: "linear" }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/* --------------------------------- LoginCard --------------------------------- */

function LoginCard({ onContinue }: { onContinue: () => void }) {
  const [email, setEmail] = useState("");
  const [shake, setShake] = useState(0);
  const valid = /\S+@\S+\.\S+/.test(email);

  const submit = () => {
    if (valid) onContinue();
    else setShake((s) => s + 1);
  };

  return (
    <div className="flex w-80 flex-col items-center gap-8">
      {/* logo */}
      <div className="flex flex-col items-center gap-3">
        <img src={ASSETS.logo} alt="Maverick" className="h-8 w-[125px]" />
        <p className="w-80 text-center text-[14px] font-medium leading-5 tracking-[-0.28px] text-[#bbb]">
          Register and setup your first AI Agent.
        </p>
      </div>

      {/* auth options */}
      <div className="flex w-full flex-col gap-6">
        <div className="flex w-full flex-col gap-2">
          <motion.button
            type="button"
            onClick={onContinue}
            whileTap={{ scale: 0.97 }}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-black/[0.04] transition-colors hover:bg-black/[0.07]"
          >
            <span className="relative size-6">
              <img src={ASSETS.google[0]} alt="" className="absolute" style={{ left: "49.93%", top: "42.42%", width: "40%", height: "39.17%" }} />
              <img src={ASSETS.google[1]} alt="" className="absolute" style={{ left: "12.72%", top: "57.95%", width: "64.78%", height: "33.72%" }} />
              <img src={ASSETS.google[2]} alt="" className="absolute" style={{ left: "8.26%", top: "31.33%", width: "18.33%", height: "37.35%" }} />
              <img src={ASSETS.google[3]} alt="" className="absolute" style={{ left: "12.72%", top: "8.33%", width: "65.08%", height: "33.75%" }} />
            </span>
            <span className="text-[16px] font-medium leading-6 tracking-[-0.32px] text-black">
              Continue with Google
            </span>
          </motion.button>
          <motion.button
            type="button"
            onClick={onContinue}
            whileTap={{ scale: 0.97 }}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-black/[0.04] transition-colors hover:bg-black/[0.07]"
          >
            <span className="relative size-6">
              <img src={ASSETS.github} alt="" className="absolute" style={{ left: "8.33%", top: "8.13%", width: "83.34%", height: "81.28%" }} />
            </span>
            <span className="text-[16px] font-medium leading-6 tracking-[-0.32px] text-black">
              Continue with GitHub
            </span>
          </motion.button>
        </div>

        {/* divider */}
        <div className="flex w-full items-center justify-center gap-2">
          <span className="h-px min-w-px flex-1 bg-[#f0f0f0]" />
          <span className="text-[14px] font-medium leading-5 tracking-[-0.28px] text-black">OR</span>
          <span className="h-px min-w-px flex-1 bg-[#f0f0f0]" />
        </div>

        {/* email */}
        <motion.label
          key={shake}
          animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : undefined}
          transition={{ duration: 0.4 }}
          className="flex h-12 w-full items-center gap-2 rounded-full border border-[#f0f0f0] bg-white px-5 shadow-[0_1px_2px_rgba(14,18,27,0.04)] focus-within:border-black/20"
        >
          <img src={ASSETS.mail} alt="" className="size-6" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="mail@example.com"
            className="min-w-0 flex-1 bg-transparent text-[16px] font-medium leading-6 tracking-[-0.32px] text-black outline-none placeholder:text-[#bbb]"
          />
        </motion.label>
      </div>

      {/* continue */}
      <motion.button
        type="button"
        onClick={submit}
        className="flex h-11 w-80 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0271e3] transition-colors hover:bg-[#0264c8]"
        animate={{ opacity: valid ? 1 : 0.85 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="text-[16px] font-medium leading-6 tracking-[-0.32px] text-white">
          Continue
        </span>
        {/* natural aspect (8.3×4.7) — sizing it square stretches the glyph */}
        <img src={ASSETS.chevron} alt="" className="block w-[9px] max-w-none rotate-90" />
      </motion.button>

      {/* legal */}
      <div className="flex w-80 flex-col gap-5 px-6 text-center text-[14px] font-medium leading-5 tracking-[-0.28px] text-[#bbb]">
        <p>
          By continuing, you agree to the{" "}
          <span className="cursor-pointer underline decoration-dotted transition-colors hover:text-black">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="cursor-pointer underline decoration-dotted transition-colors hover:text-black">
            Privacy Policy
          </span>
          .
        </p>
        <p>
          Already have an account?{" "}
          <span className="cursor-pointer text-black transition-opacity hover:opacity-70">Login</span>
        </p>
      </div>
    </div>
  );
}
