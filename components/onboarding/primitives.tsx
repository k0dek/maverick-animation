"use client";

import { motion } from "framer-motion";
import { ASSETS } from "./assets";

/* ---------------------------------- springs --------------------------------- */

export const POP = {
  type: "spring",
  stiffness: 190,
  damping: 26,
  mass: 1,
} as const;

export const SOFT = {
  type: "spring",
  stiffness: 130,
  damping: 24,
} as const;

/** Slow drift used to smooth layout reflow when new elements appear. */
export const LAYOUT_SPRING = {
  type: "spring",
  stiffness: 110,
  damping: 20,
} as const;

/* -------------------------------- StreamText -------------------------------- */
/** Words fade/blur in one after another — the "AI generating a reply" feel. */
export function StreamText({
  text,
  delay = 0,
  wordDelay = 0.09,
  className,
}: {
  text: string;
  delay?: number;
  wordDelay?: number;
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <p className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: delay + i * wordDelay, duration: 0.6, ease: "easeOut" }}
        >
          {word + (i < words.length - 1 ? " " : "")}
        </motion.span>
      ))}
    </p>
  );
}

/* -------------------------------- AgentAvatar ------------------------------- */

export type AvatarConfig = {
  bg: string;
  img: string;
  imgStyle: React.CSSProperties;
  flip?: boolean;
  eyes: { left: number; top: number; dx: number; w: number; h: number };
};

export const AVATARS: Record<"orange" | "blue" | "green", AvatarConfig> = {
  orange: {
    bg: "rgba(247,107,21,0.16)",
    img: ASSETS.swooshOrange,
    imgStyle: { left: -0.57, top: 7.16, width: 25.57, height: 29.4 },
    eyes: { left: 10.34, top: 12.75, dx: 5.46, w: 3.45, h: 6.9 },
  },
  blue: {
    bg: "rgba(2,113,227,0.16)",
    img: ASSETS.swooshBlue,
    imgStyle: { left: -0.57, top: 5.97, width: 32.57, height: 38.38 },
    flip: true,
    eyes: { left: 9.78, top: 11.52, dx: 5.64, w: 3.56, h: 7.11 },
  },
  green: {
    bg: "rgba(88,220,0,0.16)",
    img: ASSETS.swooshGreen,
    imgStyle: { left: 1.73, top: 4, width: 30.55, height: 31 },
    flip: true,
    eyes: { left: 11.3, top: 10.39, dx: 5.29, w: 3.34, h: 6.67 },
  },
};

export function AgentAvatar({ avatar, sad = false }: { avatar: AvatarConfig; sad?: boolean }) {
  return (
    <motion.div
      className="relative size-7 shrink-0 overflow-hidden rounded-full"
      style={{ backgroundColor: avatar.bg }}
      initial={{ scale: 0, rotate: -12 }}
      // a small slump when there's nothing to do
      animate={{ scale: 1, rotate: sad ? -6 : 0, y: sad ? 1 : 0 }}
      transition={POP}
    >
      <img
        src={avatar.img}
        alt=""
        className="absolute max-w-none"
        style={{ ...avatar.imgStyle, transform: avatar.flip ? "scaleX(-1)" : undefined }}
      />
      {[0, avatar.eyes.dx].map((dx, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: avatar.eyes.left + dx,
            top: avatar.eyes.top,
            width: avatar.eyes.w,
            height: avatar.eyes.h,
            backgroundColor: "rgba(255,255,255,0.2)",
            boxShadow: "inset 0 0 4.3px 1.2px white",
          }}
          // sad: inner corners tilt up and the eyes droop a little
          animate={{
            scaleY: sad ? [0.72, 0.72, 0.15, 0.72] : [1, 1, 0.15, 1],
            rotate: sad ? (i === 0 ? 22 : -22) : 0,
            y: sad ? 1.5 : 0,
          }}
          transition={{
            scaleY: {
              duration: 0.4,
              times: [0, 0.7, 0.85, 1],
              repeat: Infinity,
              repeatDelay: sad ? 4.2 : 2.8,
              delay: 1.2,
            },
            rotate: SOFT,
            y: SOFT,
          }}
        />
      ))}
    </motion.div>
  );
}

/* --------------------------------- Thinking --------------------------------- */
/** Three bouncing dots while the agent "thinks". */
export function Thinking() {
  return (
    <motion.div
      className="flex h-8 items-center gap-1 px-1"
      initial={{ opacity: 0, scale: 0.7, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.35 } }}
      transition={POP}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-black/30"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.14, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}

/* -------------------------------- ActionIcons ------------------------------- */

export function ActionIcons({ delay = 0 }: { delay?: number }) {
  const icons = [ASSETS.iconCopy, ASSETS.iconShare, ASSETS.iconRetry];
  return (
    // design: 4px left of text edge, tucked close under the reply
    <div className="-mt-2 -ml-1 flex items-center gap-1">
      {icons.map((src, i) => (
        <motion.button
          key={src}
          type="button"
          className="flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-black/5"
          initial={{ opacity: 0, y: 6, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...POP, delay: delay + i * 0.14 }}
        >
          {/* natural intrinsic size (15 / 13.5 px) — forcing a box stretches the glyphs */}
          <img src={src} alt="" className="block max-w-none" />
        </motion.button>
      ))}
    </div>
  );
}

/* -------------------------------- HeightReveal ------------------------------- */
/** Mounts content by growing its box from 0 → auto so siblings drift instead of jumping. */
export function HeightReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ height: LAYOUT_SPRING, opacity: { duration: 0.5, ease: "easeOut" } }}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------- Toggle ----------------------------------- */

export function Toggle({ on, onClick }: { on: boolean; onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`flex h-5 w-10 cursor-pointer items-center rounded-full p-0.5 ${on ? "justify-end" : "justify-start"}`}
      animate={{ backgroundColor: on ? "#00c64c" : "#f0f0f0" }}
      transition={{ duration: 0.25 }}
    >
      <motion.span layout transition={POP} className="h-4 w-6 rounded-full bg-white" />
    </motion.button>
  );
}

/* --------------------------------- TextBubble -------------------------------- */
/** The user's outgoing message. */
export function UserBubble({
  children,
  pill = false,
  padding = "px-4 py-2",
}: {
  children: React.ReactNode;
  pill?: boolean;
  padding?: string;
}) {
  return (
    <motion.div
      className={`bg-black/[0.04] ${padding} ${pill ? "rounded-full" : "rounded-2xl"}`}
      initial={{ opacity: 0, x: 32, scale: 0.85, filter: "blur(4px)" }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
      transition={SOFT}
      style={{ originX: 1, originY: 1 }}
    >
      {children}
    </motion.div>
  );
}
