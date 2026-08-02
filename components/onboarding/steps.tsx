"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ASSETS } from "./assets";
import {
  AgentAvatar,
  AVATARS,
  LAYOUT_SPRING,
  POP,
  SOFT,
  StreamText,
  Toggle,
} from "./primitives";

const text16 = "text-[16px] font-medium leading-6 tracking-[-0.32px] text-black";
const text14 = "text-[14px] font-medium leading-5 tracking-[-0.28px] text-black";

/* ------------------------------- left card shell ------------------------------ */

export function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string[];
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-80 flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <motion.h2
          className="text-[24px] font-medium leading-8 tracking-[-0.72px] text-black"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          {title.map((line) => (
            <span key={line} className="block whitespace-nowrap">
              {line}
            </span>
          ))}
        </motion.h2>
        <motion.p
          className="w-80 text-[14px] font-medium leading-5 tracking-[-0.28px] text-[#bbb]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        >
          {subtitle}
        </motion.p>
      </div>
      <div className="flex w-full flex-col gap-2">{children}</div>
    </div>
  );
}

/** Staggered entrance for rows inside a step. */
export function StepItem({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SOFT, delay: 0.25 + i * 0.07 }}
    >
      {children}
    </motion.div>
  );
}

export function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full cursor-pointer items-center justify-center rounded-full text-[16px] font-medium tracking-[-0.32px] text-[#bbb] transition-colors hover:text-black/60"
    >
      Skip for now
    </button>
  );
}

/* -------------------------- step 1 · how did you hear ------------------------- */

export const SOURCE_OPTIONS = [
  "Facebook / Instagram",
  "Google",
  "YouTube",
  "LinkedIn",
  "Al Search (ChatGPT, Perplexity, etc)",
  "Friend / Family",
  "Ads",
];

/** A pill whose selected state blooms in as black instead of switching instantly. */
function SourceOption({
  label,
  active,
  dimmed,
  onClick,
}: {
  label: string;
  active: boolean;
  dimmed: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="relative flex h-12 w-full cursor-pointer items-center overflow-hidden rounded-full px-5 text-left shadow-[0_1px_2px_rgba(14,18,27,0.04)]"
      animate={{ scale: active ? 1.02 : 1, opacity: dimmed ? 0.45 : 1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ scale: POP, opacity: { duration: 0.35, ease: "easeOut" } }}
    >
      {/* resting surface */}
      <span className="absolute inset-0 rounded-full border border-[#f0f0f0] bg-white" />
      {/* black fill blooms outward from the pill's centre */}
      <motion.span
        className="absolute inset-0 rounded-full bg-black"
        initial={false}
        animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.82 }}
        transition={{ opacity: { duration: 0.32, ease: "easeOut" }, scale: SOFT }}
      />
      <motion.span
        className="relative text-[16px] font-medium leading-6 tracking-[-0.32px]"
        initial={false}
        animate={{ color: active ? "#ffffff" : "#000000" }}
        transition={{ duration: 0.3, ease: "easeOut", delay: active ? 0.06 : 0 }}
      >
        {label}
      </motion.span>
    </motion.button>
  );
}

export function SourcesStep({
  selected,
  onSelect,
  onSkip,
}: {
  selected: string | null;
  onSelect: (label: string) => void;
  onSkip: () => void;
}) {
  return (
    <StepShell
      title={["How did you hear about us?"]}
      subtitle="This helps us understand where our community comes from."
    >
      {SOURCE_OPTIONS.map((label, i) => (
        <StepItem key={label} i={i}>
          <SourceOption
            label={label}
            active={selected === label}
            dimmed={selected !== null && selected !== label}
            onClick={() => onSelect(label)}
          />
        </StepItem>
      ))}
      <StepItem i={SOURCE_OPTIONS.length}>
        <SkipButton onClick={onSkip} />
      </StepItem>
    </StepShell>
  );
}

/** Right side — the option pills scattered around the agent, floating gently. */
const PILL_SPOTS = [
  { x: 24, y: 118, r: -4 },
  { x: 262, y: 96, r: 3 },
  { x: 74, y: 192, r: 2 },
  { x: 252, y: 176, r: -3 },
  { x: 38, y: 268, r: -2 },
  { x: 246, y: 330, r: 4 },
  { x: 120, y: 352, r: -5 },
];

export function SourcesIllustration({ selected }: { selected: string | null }) {
  return (
    <div className="relative h-[420px] w-[420px]">
      <div className="absolute left-1/2 top-4 -translate-x-1/2">
        <AgentAvatar avatar={AVATARS.orange} />
      </div>
      {SOURCE_OPTIONS.map((label, i) => {
        const s = PILL_SPOTS[i];
        const active = selected === label;
        return (
          <motion.div
            key={label}
            className="absolute"
            style={{ left: s.x, top: s.y }}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: active ? 1.08 : 1, y: 0 }}
            transition={{ ...SOFT, delay: 0.3 + i * 0.12 }}
          >
            <motion.div
              className="relative overflow-hidden whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium tracking-[-0.28px] shadow-[0_1px_2px_rgba(14,18,27,0.04)]"
              style={{ rotate: s.r }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.4 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
            >
              <span className="absolute inset-0 rounded-full border border-[#f0f0f0] bg-white" />
              <motion.span
                className="absolute inset-0 rounded-full bg-black"
                initial={false}
                animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.82 }}
                transition={{ opacity: { duration: 0.32, ease: "easeOut" }, scale: SOFT }}
              />
              <motion.span
                className="relative"
                initial={false}
                animate={{ color: active ? "#ffffff" : "#000000" }}
                transition={{ duration: 0.3, ease: "easeOut", delay: active ? 0.06 : 0 }}
              >
                {label}
              </motion.span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ---------------------------- step 2 · work email ----------------------------- */

export function EmailStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <StepShell
      title={["Get the most out of Maverick", "with your work email"]}
      subtitle="Connect your work email and calendar so Maverick can prioritize what matters, draft replies in your voice, and keep your schedule on track."
    >
      <StepItem i={0}>
        <button
          type="button"
          onClick={onNext}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0271e3] transition-colors hover:bg-[#0264c8]"
        >
          {/* the mark is four colored paths — flatten them to white on the blue button */}
          <span className="relative size-6" style={{ filter: "brightness(0) invert(1)" }}>
            <img src={ASSETS.google[0]} alt="" className="absolute" style={{ left: "49.93%", top: "42.42%", width: "40%", height: "39.17%" }} />
            <img src={ASSETS.google[1]} alt="" className="absolute" style={{ left: "12.72%", top: "57.95%", width: "64.78%", height: "33.72%" }} />
            <img src={ASSETS.google[2]} alt="" className="absolute" style={{ left: "8.26%", top: "31.33%", width: "18.33%", height: "37.35%" }} />
            <img src={ASSETS.google[3]} alt="" className="absolute" style={{ left: "12.72%", top: "8.33%", width: "65.08%", height: "33.75%" }} />
          </span>
          <span className="text-[16px] font-medium leading-6 tracking-[-0.32px] text-white">
            Connect Google
          </span>
        </button>
      </StepItem>
      <StepItem i={1}>
        <SkipButton onClick={onSkip} />
      </StepItem>
      <StepItem i={2}>
        <div className="mt-4 flex items-center justify-center gap-1">
          {ASSETS.integrations.map((src, i) => (
            <motion.img
              key={src}
              src={src}
              alt=""
              className="size-16"
              initial={{ opacity: 0, scale: 0.6, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ ...POP, delay: 0.55 + i * 0.1 }}
            />
          ))}
        </div>
      </StepItem>
    </StepShell>
  );
}

/** Right side — inbox triage: mail cards cascade in, agent turns them into outcomes. */
function MailCard({ w, delay, lines }: { w: number; delay: number; lines: number[] }) {
  return (
    <motion.div
      className="flex items-start gap-3 rounded-2xl border border-black/[0.02] bg-white p-3 shadow-[0_1px_2px_rgba(14,18,27,0.04)]"
      style={{ width: w }}
      initial={{ opacity: 0, y: 24, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...SOFT, delay }}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-black/[0.04]">
        <img src={ASSETS.mail} alt="" className="size-4 opacity-60" />
      </span>
      <span className="flex flex-1 flex-col gap-1.5 pt-1">
        {lines.map((lw, i) => (
          <motion.span
            key={i}
            className="h-2 origin-left rounded-full bg-black/[0.06]"
            style={{ width: `${lw}%` }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: delay + 0.25 + i * 0.15, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          />
        ))}
      </span>
    </motion.div>
  );
}

export function EmailIllustration() {
  return (
    <div className="flex w-[420px] flex-col gap-6 px-3">
      <div className="flex flex-col gap-4">
        <AgentAvatar avatar={AVATARS.orange} />
        <StreamText
          text="I'll keep your inbox and calendar ahead of you."
          delay={0.5}
          className={text16}
        />
      </div>
      <div className="flex flex-col gap-3">
        <MailCard w={280} delay={1.2} lines={[80, 55]} />
        <div className="ml-8">
          <MailCard w={280} delay={1.55} lines={[65, 40]} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {["Reply drafted in your voice", "Meeting scheduled"].map((label, i) => (
          <motion.div
            key={label}
            className="flex h-8 items-center gap-1.5 rounded-xl border border-[#f0f0f0] bg-white pl-2 pr-3"
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...POP, delay: 2.3 + i * 0.3 }}
          >
            <motion.img
              src={ASSETS.iconCheckGreen}
              alt=""
              className="size-5"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...POP, delay: 2.5 + i * 0.3 }}
            />
            <span className={text14}>{label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- step 3 · capabilities ---------------------------- */

export const CAPABILITIES = [
  { icon: ASSETS.capLeads, title: "Search company leads", sub: "Extracts, categorizes, and routes invoices" },
  { icon: ASSETS.capEmail, title: "Draft emails for you", sub: "Extracts, categorizes, and routes invoices" },
  { icon: ASSETS.capCalendar, title: "Plan your calendar", sub: "Extracts, categorizes, and routes invoices" },
];

export function CapabilitiesStep({
  enabled,
  onToggle,
  onSkip,
}: {
  enabled: boolean[];
  onToggle: (i: number) => void;
  onSkip: () => void;
}) {
  return (
    <StepShell
      title={["Here's what I'll handle for you."]}
      subtitle="You can change this later in settings."
    >
      {CAPABILITIES.map((cap, i) => (
        <StepItem key={cap.title} i={i}>
          <div className="flex w-full flex-col gap-3 rounded-[20px] border border-[#f0f0f0] bg-white p-4 shadow-[0_1px_2px_rgba(14,18,27,0.04),0_10px_16px_rgba(14,18,27,0.04)]">
            <div className="flex items-center justify-between">
              <img src={cap.icon} alt="" className="size-6" />
              <Toggle on={enabled[i]} onClick={() => onToggle(i)} />
            </div>
            <div className="flex flex-col gap-1">
              <p className={text16}>{cap.title}</p>
              <p className="text-[14px] font-medium leading-5 tracking-[-0.28px] text-[#8d8d8d]">
                {cap.sub}
              </p>
            </div>
          </div>
        </StepItem>
      ))}
      <StepItem i={CAPABILITIES.length}>
        <SkipButton onClick={onSkip} />
      </StepItem>
    </StepShell>
  );
}

/** Right side — enabled capabilities appear as the agent's live task list. */
export function CapabilitiesIllustration({ enabled }: { enabled: boolean[] }) {
  // stagger the pills on arrival; once they're all in, toggles react instantly
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex w-[420px] flex-col gap-6 px-3">
      <div className="flex flex-col gap-4">
        <AgentAvatar avatar={AVATARS.orange} />
        <StreamText text="On it. Here's my running task list:" delay={0.5} className={text16} />
      </div>
      <div className="flex flex-col items-start">
        <AnimatePresence>
          {CAPABILITIES.filter((_, i) => enabled[i]).map((cap, idx) => {
            // on arrival each pill waits its turn; afterwards toggles respond at once
            const delay = entered ? 0 : 1.1 + idx * 0.3;
            return (
              // the box height grows/collapses with a spring so the list never jumps
              <motion.div
                key={cap.title}
                className="overflow-hidden"
                initial={{ height: 0, opacity: 0, scale: 0.85 }}
                animate={{ height: "auto", opacity: 1, scale: 1 }}
                exit={{ height: 0, opacity: 0, scale: 0.85 }}
                transition={{
                  height: { ...LAYOUT_SPRING, delay },
                  opacity: { duration: 0.35, ease: "easeOut", delay },
                  scale: { ...SOFT, delay },
                }}
              >
                <div className="mb-3 flex h-10 items-center gap-2 rounded-xl border border-[#f0f0f0] bg-white pl-2.5 pr-4 shadow-[0_1px_2px_rgba(14,18,27,0.04)]">
                  <img src={cap.icon} alt="" className="size-5" />
                  <span className={text14}>{cap.title}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {enabled.every((e) => !e) && (
          <motion.p
            className="text-[14px] font-medium leading-5 tracking-[-0.28px] text-[#bbb]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Flip a switch and I&apos;ll get to work.
          </motion.p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ step 4 · phone -------------------------------- */

export function PhoneStep({
  channels,
  onToggle,
  onSkip,
}: {
  channels: { telegram: boolean; whatsapp: boolean };
  onToggle: (key: "telegram" | "whatsapp") => void;
  onSkip: () => void;
}) {
  return (
    <StepShell
      title={["Use Maverick on your phone!"]}
      subtitle="Use your Al, right where you are most."
    >
      <StepItem i={0}>
        <div className="flex w-full items-center gap-3 rounded-[20px] border border-[#f0f0f0] bg-white p-4 shadow-[0_1px_2px_rgba(14,18,27,0.04)]">
          <span className="flex size-6 items-center justify-center">
            <img src={ASSETS.telegram} alt="" className="block max-w-none" />
          </span>
          <span className={`${text16} flex-1`}>Telegram</span>
          {channels.telegram && (
            <>
              <button
                type="button"
                className="cursor-pointer text-[14px] font-medium leading-5 tracking-[-0.28px] text-[#e5484d]"
                onClick={() => onToggle("telegram")}
              >
                Disconnect
              </button>
              <span className="h-3 w-px rounded-full bg-[#f0f0f0]" />
            </>
          )}
          <Toggle on={channels.telegram} onClick={() => onToggle("telegram")} />
        </div>
      </StepItem>
      <StepItem i={1}>
        <div className="flex w-full items-center gap-3 rounded-[20px] border border-[#f0f0f0] bg-white p-4 shadow-[0_1px_2px_rgba(14,18,27,0.04)]">
          <span className="flex size-6 items-center justify-center">
            <img src={ASSETS.whatsapp} alt="" className="block max-w-none" />
          </span>
          <span className={`${text16} flex-1`}>WhatsApp</span>
          <Toggle on={channels.whatsapp} onClick={() => onToggle("whatsapp")} />
        </div>
      </StepItem>
      <StepItem i={2}>
        <SkipButton onClick={onSkip} />
      </StepItem>
    </StepShell>
  );
}

/** Right side — a phone with Maverick in the chat, channel chips reflect toggles. */
const MINI_WAVE = [4, 7, 5, 10, 14, 11, 15, 9, 12, 6, 9, 4, 6, 3];

export function PhoneIllustration({
  channels,
}: {
  channels: { telegram: boolean; whatsapp: boolean };
}) {
  return (
    <div className="relative flex w-[420px] items-center justify-center py-4">
      {/* phone frame */}
      <motion.div
        className="flex h-[400px] w-[210px] flex-col rounded-[36px] border border-[#f0f0f0] bg-white p-4 pt-6 shadow-[0_24px_48px_rgba(14,18,27,0.08),0_1px_2px_rgba(14,18,27,0.04)]"
        initial={{ opacity: 0, y: 40, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ ...SOFT, delay: 0.15 }}
      >
        <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-black/[0.06]" />
        <div className="flex flex-1 flex-col gap-3">
          <motion.div
            className="flex flex-col gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SOFT, delay: 0.7 }}
          >
            <AgentAvatar avatar={AVATARS.green} />
            <p className="text-[13px] font-medium leading-[18px] tracking-[-0.26px] text-black">
              Morning! Three things need you today.
            </p>
          </motion.div>
          <motion.div
            className="self-end rounded-2xl bg-black/[0.04] px-3 py-1.5"
            initial={{ opacity: 0, x: 16, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ ...SOFT, delay: 1.4 }}
          >
            <p className="text-[13px] font-medium leading-[18px] tracking-[-0.26px] text-black">
              handle the first two
            </p>
          </motion.div>
          {/* mini voice note */}
          <motion.div
            className="flex items-center gap-1.5 self-end rounded-full bg-black/[0.04] py-1 pl-1 pr-2.5"
            initial={{ opacity: 0, x: 16, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ ...SOFT, delay: 2 }}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-white/70">
              <img src={ASSETS.iconPlay} alt="" className="block h-[7px] max-w-none w-auto" />
            </span>
            <span className="flex h-4 items-center gap-px">
              {MINI_WAVE.map((h, i) => (
                <motion.span
                  key={i}
                  className="w-0.5 rounded-full bg-black"
                  style={{ height: h }}
                  initial={{ scaleY: 0.2, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ ...POP, delay: 2.2 + i * 0.03 }}
                />
              ))}
            </span>
          </motion.div>
          <motion.div
            className="flex flex-col gap-1.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SOFT, delay: 2.9 }}
          >
            <p className="text-[13px] font-medium leading-[18px] tracking-[-0.26px] text-black">
              Done — recap by 4 PM.
            </p>
            <span className="flex h-7 w-fit items-center gap-1 rounded-lg border border-[#f0f0f0] pl-1.5 pr-2.5">
              <img src={ASSETS.iconCheckGreen} alt="" className="size-4" />
              <span className="text-[12px] font-medium leading-4 tracking-[-0.24px] text-black">
                2 tasks running
              </span>
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* channel chips float beside the phone, reflecting the toggles */}
      <motion.div
        className="absolute left-8 top-24 flex size-12 items-center justify-center rounded-full border border-[#f0f0f0] bg-white shadow-[0_8px_16px_rgba(14,18,27,0.06)]"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: channels.telegram ? 1 : 0.9, y: [0, -8, 0] }}
        transition={{ ...SOFT, y: { duration: 3.6, repeat: Infinity, ease: "easeInOut" } }}
      >
        <img src={ASSETS.telegram} alt="Telegram" className="block max-w-none" />
      </motion.div>
      <motion.div
        className="absolute bottom-24 right-8 flex size-12 items-center justify-center rounded-full border border-[#f0f0f0] bg-white shadow-[0_8px_16px_rgba(14,18,27,0.06)]"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: channels.whatsapp ? 1 : 0.9, y: [0, -8, 0] }}
        transition={{ ...SOFT, y: { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 } }}
      >
        <img src={ASSETS.whatsapp} alt="WhatsApp" className="block max-w-none" />
      </motion.div>
    </div>
  );
}
