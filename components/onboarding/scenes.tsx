"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ASSETS } from "./assets";
import {
  ActionIcons,
  AgentAvatar,
  AVATARS,
  HeightReveal,
  LAYOUT_SPRING,
  POP,
  SOFT,
  StreamText,
  Thinking,
  UserBubble,
} from "./primitives";

/* ------------------------------- beat timeline ------------------------------ */
// beat 0: avatar pops in, intro streams
// beat 1: user message arrives
// beat 2: agent is thinking (bouncing dots)
// beat 3: agent reply builds up (payload → text → actions)
const BEAT_TIMES = [2600, 4200, 7000];

function useBeats() {
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    const timers = BEAT_TIMES.map((t, i) => setTimeout(() => setBeat(i + 1), t));
    return () => timers.forEach(clearTimeout);
  }, []);
  return beat;
}

const text16 = "text-[16px] font-medium leading-6 tracking-[-0.32px] text-black";
const text14 = "text-[14px] font-medium leading-5 tracking-[-0.28px] text-black";

/* --------------------------- scene 1 · doc payload --------------------------- */

function SkeletonBars({ widths, delay, h = 8 }: { widths: (number | "100%")[]; delay: number; h?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {widths.map((w, i) => (
        <motion.div
          key={i}
          className="origin-left rounded-full bg-black/[0.06]"
          style={{ width: w, height: h }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: delay + i * 0.28, duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
        />
      ))}
    </div>
  );
}

function DocCards() {
  return (
    <div className="flex items-end" style={{ filter: "drop-shadow(0 5px 6px rgba(0,0,0,0.04))" }}>
      {/* front card */}
      <motion.div
        className="z-[2] mr-[-96px] flex h-[140px] w-[110px] flex-col gap-3 rounded-2xl border border-black/[0.02] bg-white px-3.5 py-4 shadow-[0_1px_2px_rgba(14,18,27,0.04)]"
        initial={{ opacity: 0, scale: 0.6, y: 24, rotate: -3 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
        transition={{ ...POP, delay: 0.1 }}
      >
        <StreamText text="Q3 launch brief v1" delay={0.7} wordDelay={0.2} className={text14} />
        <SkeletonBars widths={["100%", 68, 76]} delay={1} />
      </motion.div>
      {/* back card fans out from behind — starts fully tucked under the front card
          so its text is never visible while it moves */}
      <motion.div
        className="z-[1]"
        initial={{ opacity: 0, x: -16, rotate: 0 }}
        animate={{ opacity: 1, x: 0, rotate: 4 }}
        transition={{ ...SOFT, delay: 0.7 }}
      >
        <div className="flex h-[122px] w-[103px] flex-col gap-[7px] rounded-[14px] border border-black/[0.02] bg-white px-[13px] py-[14px] shadow-[0_1px_2px_rgba(14,18,27,0.04)]">
          <p className="text-[12.6px] font-medium leading-[18px] tracking-[-0.25px] text-black">
            Q3 launch brief
          </p>
          <SkeletonBars widths={["100%", 61, 69]} delay={1.2} h={5} />
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------- scene 2 · calendar payload ------------------------ */

function MeetingChips() {
  return (
    <div className="flex items-center gap-3" style={{ filter: "drop-shadow(0 5px 6px rgba(0,0,0,0.04))" }}>
      {/* calendar invite */}
      <motion.div
        className="flex w-40 flex-col items-start justify-center gap-2.5 rounded-[20px] border border-black/[0.02] bg-white py-3 pl-3 pr-4 shadow-[0_1px_2px_rgba(14,18,27,0.04)]"
        initial={{ opacity: 0, scale: 0.7, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ ...POP, delay: 0.1 }}
      >
        <motion.div
          className="flex size-8 items-center justify-center rounded-full bg-[#0271e3]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...POP, delay: 0.5 }}
        >
          <span className="text-[14px] font-medium leading-5 tracking-[-0.28px] text-white">31</span>
        </motion.div>
        <div className="flex items-center gap-2 px-0.5">
          <span className="font-mono text-[12px] font-medium uppercase leading-4 tracking-[-0.24px] text-black/[0.32]">
            FRI
          </span>
          <span className="size-1.5 rounded-full bg-[#0271e3]" />
          <span className={text14}>Team kickoff</span>
        </div>
      </motion.div>
      {/* deck pdf */}
      <motion.div
        className="flex w-40 flex-col items-start justify-center gap-2.5 rounded-[20px] border border-black/[0.02] bg-white py-3 pl-3 pr-4 shadow-[0_1px_2px_rgba(14,18,27,0.04)]"
        initial={{ opacity: 0, scale: 0.7, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ ...POP, delay: 0.45 }}
      >
        <motion.div
          className="flex size-8 items-center justify-center rounded-full bg-[rgba(255,128,0,0.2)]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...POP, delay: 0.85 }}
        >
          <img src={ASSETS.iconFileChart} alt="" className="block max-w-none" />
        </motion.div>
        <div className="flex items-center gap-1 whitespace-nowrap px-0.5">
          <span className={text14}>Product Kickoff</span>
          <span className="text-[14px] font-medium leading-5 text-black/[0.32]">·</span>
          <span className="font-mono text-[12px] font-medium uppercase leading-4 tracking-[-0.24px] text-black/[0.32]">
            PDF
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------------- scene 3 · voice message -------------------------- */

const WAVE_HEIGHTS = [
  7, 3, 3, 7, 4, 4, 4, 4, 6, 6, 6, 6, 4, 4, 3, 3, 3, 3, 6, 6, 5, 5, 5, 9, 17, 17, 19, 19, 19,
  19, 13, 19, 13, 19, 19, 7, 13, 13, 19, 13, 13, 3, 7, 3, 13, 7, 3, 7, 3, 7, 7, 3, 7, 4, 4, 4,
  2, 2,
];
const WAVE_WIDTH = WAVE_HEIGHTS.length * 2 + (WAVE_HEIGHTS.length - 1); // 2px bars, 1px gap

function WaveBars({ color, grow = false }: { color: string; grow?: boolean }) {
  return (
    <div className="flex h-7 items-center gap-px" style={{ width: WAVE_WIDTH }}>
      {WAVE_HEIGHTS.map((h, i) => (
        <motion.span
          key={i}
          className="w-0.5 shrink-0 rounded-full"
          style={{ height: h, backgroundColor: color }}
          initial={grow ? { scaleY: 0.2, opacity: 0 } : false}
          animate={grow ? { scaleY: 1, opacity: 1 } : undefined}
          transition={grow ? { delay: 0.3 + i * 0.024, ...POP } : undefined}
        />
      ))}
    </div>
  );
}

export function VoiceBubble({ playing }: { playing: boolean }) {
  return (
    // design: pl 6 / pr 16 / py 6 pill, 28px play circle, 173px waveform, "0:12"
    <UserBubble pill padding="py-1.5 pl-1.5 pr-4">
      <div className="flex items-center gap-2">
        <motion.div
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/70"
          whileHover={{ scale: 1.08 }}
        >
          <img src={ASSETS.iconPlay} alt="" className="block max-w-none" />
        </motion.div>
        <div className="relative" style={{ width: WAVE_WIDTH, height: 28 }}>
          <div className="absolute inset-0">
            <WaveBars color="rgba(0,0,0,0.22)" grow />
          </div>
          {/* playback progress sweep */}
          <motion.div
            className="absolute inset-y-0 left-0 overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: playing ? WAVE_WIDTH : 0 }}
            transition={{ duration: 4.8, ease: "linear" }}
          >
            <WaveBars color="#000" />
          </motion.div>
        </div>
        <span className="text-[12px] font-medium leading-4 text-black/[0.28]">0:12</span>
      </div>
    </UserBubble>
  );
}

function CheckPills() {
  const pills = ["Compare proposals", "Send by 4 PM"];
  return (
    <div className="flex items-center gap-3">
      {pills.map((label, i) => (
        <motion.div
          key={label}
          className="flex h-8 items-center gap-1.5 rounded-xl border border-[#f0f0f0] pl-2 pr-3"
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...POP, delay: 1.9 + i * 0.3 }}
        >
          <motion.img
            src={ASSETS.iconCheckGreen}
            alt=""
            className="size-5"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...POP, delay: 2.2 + i * 0.3 }}
          />
          <span className={text14}>{label}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------- scene configs ------------------------------- */

export type SceneConfig = {
  id: string;
  accent: keyof typeof AVATARS;
  intro: string;
  user: (beat: number) => React.ReactNode;
  reply: React.ReactNode;
};

export const SCENES: SceneConfig[] = [
  {
    id: "docs",
    accent: "orange",
    intro: "I can create polished documents from a short brief.",
    user: () => (
      <UserBubble>
        <p className={`${text16} w-[271px]`}>prepare our Q3 launch brief in google docs</p>
      </UserBubble>
    ),
    reply: (
      <div className="flex flex-col items-start gap-4">
        <DocCards />
        <StreamText
          text="I've prepared the brief. Approve when you're ready."
          delay={1.7}
          className={text16}
        />
        <ActionIcons delay={2.9} />
      </div>
    ),
  },
  {
    id: "meeting",
    accent: "blue",
    intro: "I can prepare the meeting and everything around it.",
    user: () => (
      <UserBubble pill>
        <p className={`${text16} whitespace-nowrap`}>set up Friday&apos;s kickoff and prep the team</p>
      </UserBubble>
    ),
    reply: (
      <div className="flex flex-col items-start gap-4">
        <MeetingChips />
        <StreamText
          text="I've prepared the invite and deck for your review."
          delay={1.7}
          className={text16}
        />
        <ActionIcons delay={2.9} />
      </div>
    ),
  },
  {
    id: "voice",
    accent: "green",
    intro: "Hey! Should I take care of this task?",
    user: (beat) => <VoiceBubble playing={beat >= 2} />,
    reply: (
      <div className="flex flex-col items-start gap-3">
        <StreamText
          text="Got it — I'll compare the proposals and send my recommendation by 4 PM."
          delay={0.1}
          className={text16}
        />
        <CheckPills />
        <ActionIcons delay={2.9} />
      </div>
    ),
  },
];

/* --------------------------------- ChatScene --------------------------------- */

export function ChatScene({ scene }: { scene: SceneConfig }) {
  const beat = useBeats();
  return (
    <div className="flex w-[420px] flex-col gap-6">
      {/* agent intro — drifts smoothly as later rows appear */}
      <motion.div layout transition={{ layout: LAYOUT_SPRING }} className="flex flex-col gap-4 px-3 py-2">
        <AgentAvatar avatar={AVATARS[scene.accent]} />
        <StreamText text={scene.intro} delay={0.8} className={text16} />
      </motion.div>

      {/* user message — box grows from 0 so the column recenters smoothly */}
      <motion.div layout="position" transition={{ layout: LAYOUT_SPRING }} className="flex flex-col items-end">
        {beat >= 1 && (
          <HeightReveal className="flex flex-col items-end">{scene.user(beat)}</HeightReveal>
        )}
      </motion.div>

      {/* thinking → reply — both grow/shrink their box so nothing teleports */}
      <motion.div layout="position" transition={{ layout: LAYOUT_SPRING }} className="px-3 py-2">
        <AnimatePresence mode="wait" initial={false}>
          {beat === 2 ? (
            <motion.div
              key="thinking"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ height: LAYOUT_SPRING, opacity: { duration: 0.25 } }}
            >
              <Thinking />
            </motion.div>
          ) : beat >= 3 ? (
            <HeightReveal key="reply">{scene.reply}</HeightReveal>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
