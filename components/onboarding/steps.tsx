"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ASSETS } from "./assets";
import { ConnectPanel, TelegramConnect, WhatsAppConnect } from "./connect";
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
            // hard line breaks on desktop; narrow screens may wrap
            <span key={line} className="block md:whitespace-nowrap">
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

/** Primary action, matching the Continue button on the register screen. */
export function ContinueButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0271e3] transition-colors hover:bg-[#0264c8]"
    >
      <span className="text-[16px] font-medium leading-6 tracking-[-0.32px] text-white">
        Continue
      </span>
      {/* natural aspect (8.3×4.7) — sizing it square stretches the glyph */}
      <img src={ASSETS.chevron} alt="" className="block w-[9px] max-w-none rotate-90" />
    </motion.button>
  );
}

/* --------------------------- step 1 · your company ---------------------------- */

export type CompanyInfo = { name: string; role: string; about: string };

// the focused field gets a clearly visible brand border + halo, not a near-invisible grey
const FIELD =
  "w-full border border-[#f0f0f0] bg-white text-[16px] font-medium leading-6 tracking-[-0.32px] text-black shadow-[0_1px_2px_rgba(14,18,27,0.04)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#bbb] focus:border-[#0271e3] focus:shadow-[0_0_0_3px_rgba(2,113,227,0.12)]";

export function CompanyStep({
  values,
  onChange,
  onContinue,
  onSkip,
}: {
  values: CompanyInfo;
  onChange: (key: keyof CompanyInfo, value: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const aboutRef = useRef<HTMLTextAreaElement>(null);

  // focus the first field as soon as the step mounts (the previous card has already
  // finished exiting by then); preventScroll so focusing can't nudge the layout
  useEffect(() => {
    const id = requestAnimationFrame(() => nameRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);

  // Enter walks down the fields, and continues from the last one.
  // take the ref itself, not `.current` — at render time the next field isn't
  // mounted yet, so the handler would capture a null
  const advance =
    (next: React.RefObject<HTMLElement | null>) => (e: React.KeyboardEvent) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      next.current?.focus();
    };

  return (
    <StepShell
      title={["Tell us about your company"]}
      subtitle="Maverick tailors every agent to your business context."
    >
      <StepItem i={0}>
        <input
          ref={nameRef}
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
          onKeyDown={advance(roleRef)}
          placeholder="Your company"
          className={`${FIELD} h-12 rounded-full px-5`}
        />
      </StepItem>
      <StepItem i={1}>
        <input
          ref={roleRef}
          value={values.role}
          onChange={(e) => onChange("role", e.target.value)}
          onKeyDown={advance(aboutRef)}
          placeholder="Your role"
          className={`${FIELD} h-12 rounded-full px-5`}
        />
      </StepItem>
      <StepItem i={2}>
        <textarea
          ref={aboutRef}
          value={values.about}
          onChange={(e) => onChange("about", e.target.value)}
          onKeyDown={(e) => {
            // last field: Enter continues, Shift+Enter still breaks a line
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onContinue();
            }
          }}
          placeholder="What does your company do?"
          rows={4}
          className={`${FIELD} resize-none overflow-y-auto rounded-[20px] px-5 py-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        />
      </StepItem>
      <StepItem i={3}>
        <div className="pt-2">
          <ContinueButton onClick={onContinue} />
        </div>
      </StepItem>
      <StepItem i={4}>
        {/* once they've started typing, skipping is no longer the suggestion */}
        <AnimatePresence initial={false}>
          {!(values.name || values.role || values.about) && (
            <motion.div
              className="overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ height: LAYOUT_SPRING, opacity: { duration: 0.25 } }}
            >
              <SkipButton onClick={onSkip} />
            </motion.div>
          )}
        </AnimatePresence>
      </StepItem>
    </StepShell>
  );
}

/** Right side — the agent assembles a company profile card as you type. */
function ProfileSkeleton({ w, h = 8 }: { w: number | string; h?: number }) {
  return (
    // pulses via background-color, not opacity — an opacity loop here would fight the
    // parent's fade-out during a swap and read as a flicker
    <motion.span
      className="block rounded-full"
      style={{ width: w, height: h }}
      animate={{ backgroundColor: ["rgba(0,0,0,0.05)", "rgba(0,0,0,0.10)", "rgba(0,0,0,0.05)"] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/** Trails the live value by a beat, so the mirror settles after you pause typing. */
function useDebounced<T>(value: T, ms = 500): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Placeholder and value sit stacked in one grid cell and simply crossfade.
    Nothing mounts or unmounts, so there's no exit animation to fight and nothing
    gets lifted out of flow. The box animates its real `height` (measured) rather
    than using framer's `layout` — a layout animation tweens via transform scaling,
    which visibly stretches the skeleton bars and text inside it. */
function Mirror({
  show,
  placeholder,
  className,
  children,
}: {
  show: boolean;
  placeholder: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const inner = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | null>(null);

  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => setH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fade = { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const };
  return (
    <motion.div
      className="overflow-hidden"
      animate={h === null ? undefined : { height: h }}
      transition={LAYOUT_SPRING}
    >
      <div ref={inner} className={`grid ${className ?? ""}`}>
        <motion.div
          className="min-w-0 [grid-area:1/1]"
          animate={{ opacity: show ? 1 : 0 }}
          transition={fade}
        >
          {children}
        </motion.div>
        {/* the placeholder is shorter than the text it stands in for, so centre it in
            the cell — top-aligned bars read as misaligned against the monogram */}
        <motion.div
          className="pointer-events-none flex min-w-0 flex-col justify-center [grid-area:1/1]"
          animate={{ opacity: show ? 0 : 1 }}
          transition={fade}
        >
          {placeholder}
        </motion.div>
      </div>
    </motion.div>
  );
}

export function CompanyIllustration({ values }: { values: CompanyInfo }) {
  // the card mirrors debounced values: it waits for a pause in typing, then
  // morphs to the new content instead of flickering on every keystroke
  const name = useDebounced(values.name.trim());
  const role = useDebounced(values.role.trim());
  const about = useDebounced(values.about.trim());
  const named = name.length > 0;

  return (
    <div className="flex w-[420px] flex-col gap-6 px-3">
      <div className="flex flex-col gap-4">
        <AgentAvatar avatar={AVATARS.orange} />
        {/* the headline follows along once it knows who you are */}
        <Mirror
          show={named}
          placeholder={
            <StreamText
              text="Tell me about your company — I'll learn how it works."
              delay={0.5}
              className={text16}
            />
          }
        >
          <StreamText
            key={name}
            text={named ? `Getting Maverick ready for ${name}.` : " "}
            className={text16}
          />
        </Mirror>
      </div>

      {/* company profile card, settling in as you pause. No `layout` here — each
          Mirror animates its own height, so the card follows along naturally without
          the transform-scaling that a layout animation would impose on its children */}
      <motion.div
        className="flex w-[320px] flex-col gap-4 rounded-[20px] border border-[#f0f0f0] bg-white p-5 shadow-[0_1px_2px_rgba(14,18,27,0.04),0_10px_16px_rgba(14,18,27,0.04)]"
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ ...SOFT, delay: 0.9 }}
      >
        <div className="flex items-center gap-3">
          {/* monogram fills with the brand colour once there's a name */}
          <motion.div
            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-[16px] font-medium"
            animate={{
              backgroundColor: named ? "#0271e3" : "rgba(0,0,0,0.04)",
              color: named ? "#ffffff" : "#bbbbbb",
            }}
            transition={{ duration: 0.35 }}
          >
            <Mirror show={named} placeholder={<span>?</span>}>
              <motion.span
                key={named ? name[0].toUpperCase() : "blank"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="block"
              >
                {named ? name[0].toUpperCase() : " "}
              </motion.span>
            </Mirror>
          </motion.div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Mirror show={named} placeholder={<ProfileSkeleton w={128} />}>
              <StreamText
                key={name}
                text={named ? name : " "}
                wordDelay={0.06}
                className={`${text14} truncate`}
              />
            </Mirror>
            <Mirror show={!!role} placeholder={<ProfileSkeleton w={80} h={6} />}>
              <StreamText
                key={role}
                text={role || " "}
                wordDelay={0.06}
                className="truncate text-[12px] font-medium leading-4 tracking-[-0.24px] text-[#8d8d8d]"
              />
            </Mirror>
          </div>
        </div>
        <span className="h-px w-full bg-[#f0f0f0]" />
        <Mirror
          show={!!about}
          placeholder={
            // fixed widths — percentages collapsed whenever the box was measured mid-swap
            <div className="flex flex-col gap-2">
              <ProfileSkeleton w={280} />
              <ProfileSkeleton w={232} />
              <ProfileSkeleton w={174} />
            </div>
          }
        >
          {/* capped so a very long description can't grow the card past the panel;
              the tail fades out rather than being hard-cut */}
          <div
            className="max-h-[140px] overflow-hidden"
            style={{
              maskImage: "linear-gradient(180deg,#000 108px,transparent 140px)",
              WebkitMaskImage: "linear-gradient(180deg,#000 108px,transparent 140px)",
            }}
          >
            {/* long copy fades in as one block — per-word animation means one
                animation per word, which drops the frame rate badly past ~25 words */}
            {about.split(/\s+/).length > 24 ? (
              <motion.p
                key={about}
                initial={{ opacity: 0, filter: "blur(3px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="whitespace-pre-wrap text-[14px] font-medium leading-5 tracking-[-0.28px] text-[#8d8d8d]"
              >
                {about}
              </motion.p>
            ) : (
              <StreamText
                key={about}
                text={about || " "}
                wordDelay={0.05}
                className="whitespace-pre-wrap text-[14px] font-medium leading-5 tracking-[-0.28px] text-[#8d8d8d]"
              />
            )}
          </div>
        </Mirror>
      </motion.div>
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

/** Right side — the agent sits in the middle of the day's workload: emails, a
    document draft and meeting cards. Each item gets checked off as it's handled,
    then the agent reports everything is done. */
const text12 = "text-[12px] font-medium leading-4 tracking-[-0.24px]";

function WorkSkeleton({ w }: { w: number }) {
  return <span className="h-1.5 rounded-full bg-black/[0.06]" style={{ width: w }} />;
}

function EmailCard({ subject }: { subject: string }) {
  return (
    <div className="flex w-[160px] items-center gap-2.5 p-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-black/[0.04]">
        <img src={ASSETS.mail} alt="" className="size-3.5 opacity-60" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={`${text12} truncate text-black`}>{subject}</span>
        <WorkSkeleton w={72} />
      </span>
    </div>
  );
}

function DocCard() {
  return (
    <div className="flex w-[116px] flex-col gap-2 p-3">
      <span className={`${text12} text-black`}>Q3 launch brief</span>
      <div className="flex flex-col gap-1.5">
        <WorkSkeleton w={88} />
        <WorkSkeleton w={64} />
        <WorkSkeleton w={76} />
      </div>
    </div>
  );
}

function MeetingCard() {
  return (
    <div className="flex w-[160px] flex-col gap-2 p-3">
      <span className="flex size-6 items-center justify-center rounded-full bg-[#0271e3]">
        <span className="text-[11px] font-medium leading-none text-white">31</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] font-medium uppercase leading-3 tracking-[-0.2px] text-black/[0.32]">
          FRI
        </span>
        <span className="size-1 rounded-full bg-[#0271e3]" />
        <span className={`${text12} truncate text-black`}>Team kickoff</span>
      </span>
    </div>
  );
}

function PdfCard() {
  return (
    <div className="flex w-[160px] flex-col gap-2 p-3">
      <span className="flex size-6 items-center justify-center rounded-full bg-[rgba(255,128,0,0.2)]">
        <img src={ASSETS.iconFileChart} alt="" className="block h-3 w-auto max-w-none" />
      </span>
      <span className="flex items-center gap-1 whitespace-nowrap">
        <span className={`${text12} truncate text-black`}>Product Kickoff</span>
        <span className={`${text12} text-black/[0.32]`}>·</span>
        <span className="font-mono text-[10px] font-medium uppercase leading-3 tracking-[-0.2px] text-black/[0.32]">
          PDF
        </span>
      </span>
    </div>
  );
}

const WORKLOAD: { x: number; y: number; r: number; node: React.ReactNode }[] = [
  { x: 22, y: 28, r: -5, node: <EmailCard subject="Re: Q3 budget" /> },
  { x: 240, y: 22, r: 4, node: <MeetingCard /> },
  { x: 10, y: 140, r: -3, node: <DocCard /> },
  { x: 258, y: 148, r: 3, node: <EmailCard subject="Intro — partnership" /> },
  { x: 38, y: 294, r: 3, node: <PdfCard /> },
  { x: 234, y: 298, r: -4, node: <EmailCard subject="Invoice #204" /> },
];

function WorkCard({
  x,
  y,
  r,
  appearAt,
  checkAt,
  bob,
  children,
}: {
  x: number;
  y: number;
  r: number;
  appearAt: number;
  checkAt: number;
  bob: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="absolute"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.5, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...SOFT, delay: appearAt }}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: bob, repeat: Infinity, ease: "easeInOut", delay: appearAt }}
      >
        {/* a little pulse the moment this item gets handled */}
        <motion.div
          className="relative rounded-2xl border border-[#f0f0f0] bg-white shadow-[0_1px_2px_rgba(14,18,27,0.04)]"
          style={{ rotate: r }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ delay: checkAt, duration: 0.45, ease: "easeInOut" }}
        >
          {children}
          {/* done — checkmark pops onto the corner */}
          <motion.img
            src={ASSETS.iconCheckGreen}
            alt=""
            className="absolute -right-1.5 -top-1.5 block size-5 max-w-none"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...POP, delay: checkAt }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function EmailIllustration() {
  // checks land one by one; once the last has settled, the agent reports back
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 7000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex w-[420px] flex-col items-center gap-3">
      <div className="relative h-[380px] w-full">
        {/* the agent holds the middle of the workload */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={POP}
        >
          <AgentAvatar avatar={AVATARS.orange} />
        </motion.div>
        {WORKLOAD.map((w, i) => (
          <WorkCard
            key={i}
            x={w.x}
            y={w.y}
            r={w.r}
            appearAt={0.3 + i * 0.16}
            checkAt={2.4 + i * 0.75}
            bob={3 + i * 0.35}
          >
            {w.node}
          </WorkCard>
        ))}
      </div>
      {/* status line: working → all done */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={done ? "done" : "busy"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        >
          <StreamText
            text={
              done
                ? "All done — emails, docs and meetings handled."
                : "Clearing your inbox and prepping your day…"
            }
            delay={done ? 0 : 0.6}
            className={text16}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* --------------------------- step 3 · capabilities ---------------------------- */

export const CAPABILITIES = [
  {
    icon: ASSETS.capLeads,
    title: "Search company leads",
    sub: "Finds and qualifies prospects across LinkedIn and your CRM",
  },
  {
    icon: ASSETS.capEmail,
    title: "Draft emails for you",
    sub: "Triages your inbox and writes replies in your voice",
  },
  {
    icon: ASSETS.capCalendar,
    title: "Prep you for meetings",
    sub: "Gathers context and builds an agenda before every call",
  },
];

export function CapabilitiesStep({
  enabled,
  onToggle,
  onContinue,
}: {
  enabled: boolean[];
  onToggle: (i: number) => void;
  onContinue: () => void;
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
        <div className="pt-2">
          <ContinueButton onClick={onContinue} />
        </div>
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

  const idle = enabled.every((e) => !e);

  return (
    <div className="flex w-[420px] flex-col gap-6 px-3">
      <div className="flex flex-col gap-4">
        <AgentAvatar avatar={AVATARS.orange} sad={idle} />
        {/* the headline itself carries the mood — no second line */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={idle ? "idle" : "busy"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <StreamText
              text={
                idle
                  ? "Oh, I don't have tasks for now."
                  : "On it. Here's my running task list:"
              }
              delay={entered ? 0 : 0.5}
              className={text16}
            />
          </motion.div>
        </AnimatePresence>
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
      </div>
    </div>
  );
}

/* ------------------------------ step 4 · phone -------------------------------- */

const CHANNELS = [
  { key: "telegram" as const, label: "Telegram", icon: ASSETS.telegram },
  { key: "whatsapp" as const, label: "WhatsApp", icon: ASSETS.whatsapp },
];

export function PhoneStep({
  channels,
  onToggle,
  onSkip,
  setup,
  onSetup,
}: {
  channels: { telegram: boolean; whatsapp: boolean };
  onToggle: (key: "telegram" | "whatsapp", value: boolean) => void;
  onSkip: () => void;
  setup: "telegram" | "whatsapp" | null;
  onSetup: (key: "telegram" | "whatsapp" | null) => void;
}) {
  const anyConnected = channels.telegram || channels.whatsapp;
  return (
    <StepShell
      title={["Use Maverick on your phone!"]}
      subtitle="Use your Al, right where you are most."
    >
      {CHANNELS.map((ch, i) => {
        const connected = channels[ch.key];
        const setting = setup === ch.key;
        return (
          <StepItem key={ch.key} i={i}>
            <div className="flex w-full flex-col rounded-[20px] border border-[#f0f0f0] bg-white p-4 shadow-[0_1px_2px_rgba(14,18,27,0.04)]">
              <div className="flex w-full items-center gap-3">
                <span className="flex size-6 items-center justify-center">
                  <img src={ch.icon} alt="" className="block max-w-none" />
                </span>
                <span className={`${text16} flex-1`}>{ch.label}</span>
                {/* the connected row offers a way back out */}
                <AnimatePresence initial={false}>
                  {connected && (
                    <motion.span
                      className="flex items-center gap-3 overflow-hidden whitespace-nowrap"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    >
                      <button
                        type="button"
                        className="cursor-pointer text-[14px] font-medium leading-5 tracking-[-0.28px] text-[#e5484d]"
                        onClick={() => onToggle(ch.key, false)}
                      >
                        Disconnect
                      </button>
                      <span className="h-3 w-px rounded-full bg-[#f0f0f0]" />
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* flipping on opens the setup flow; it only turns green once linked */}
                <Toggle
                  on={connected || setting}
                  onClick={() =>
                    connected ? onToggle(ch.key, false) : onSetup(setting ? null : ch.key)
                  }
                />
              </div>
              <ConnectPanel open={setting && !connected}>
                {ch.key === "telegram" ? (
                  <TelegramConnect onConnect={() => onToggle("telegram", true)} />
                ) : (
                  <WhatsAppConnect onConnect={() => onToggle("whatsapp", true)} />
                )}
              </ConnectPanel>
            </div>
          </StepItem>
        );
      })}
      <StepItem i={2}>
        {/* connect at least one tool and the action becomes a commit, not a dismissal */}
        <div className={anyConnected ? "pt-2" : ""}>
          <AnimatePresence mode="wait" initial={false}>
            {anyConnected ? (
              <motion.div
                key="continue"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              >
                <ContinueButton onClick={onSkip} />
              </motion.div>
            ) : (
              <motion.div
                key="skip"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              >
                <SkipButton onClick={onSkip} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
