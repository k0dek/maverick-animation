"use client";

import { motion } from "framer-motion";
import { SOFT } from "@/components/onboarding/primitives";
import AgentFigure from "./AgentFigure";
import { PALETTES, SHAPES, type AgentConfig } from "./engine";

/** Matches the onboarding avatar crop: the body is 60% of the figure box,
    so 1.35× the circle gives the head ~85% of the diameter. */
const FILL = 1.35;

const text14 = "text-[14px] font-medium leading-5 tracking-[-0.28px] text-black";
const text12 = "text-[12px] font-medium leading-4 tracking-[-0.24px] text-black/[0.45]";
const mono = "font-mono text-[11px] font-medium uppercase leading-4 tracking-[0.4px] text-black/[0.32]";

/** The agent cropped into a circle — the product's profile-picture treatment.
    Live, not a snapshot: it breathes, blinks and follows the cursor at every
    size, which is the whole point of a code-drawn avatar. */
export function AgentAvatar({
  cfg,
  size,
  ring = false,
  online = false,
}: {
  cfg: AgentConfig;
  size: number;
  ring?: boolean;
  online?: boolean;
}) {
  const pal = PALETTES[cfg.palette];
  // pin the body's BOTTOM edge just past the rim, whatever the shape — flat
  // silhouettes (dome, cloud) have short lower halves, so anchoring by the
  // centre would leave a tinted gap under them. ayB is the lower-half height
  // factor; 1.05 overshoots so breath and wobble never reveal the gap.
  const anchorTop = (1.05 - FILL * 0.3 * SHAPES[cfg.shape].ayB) * 100;
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className="relative overflow-hidden rounded-full transition-colors duration-700"
        style={{
          width: size,
          height: size,
          backgroundColor: `rgba(${pal.tint},0.16)`,
          boxShadow: ring ? `0 0 0 2px #fff, 0 0 0 4px rgba(${pal.tint},0.55)` : undefined,
        }}
      >
        {/* the figure is centred and oversized, then clipped by the circle */}
        <span
          className="absolute left-1/2"
          style={{
            top: `${anchorTop}%`,
            transform: "translate(-50%,-50%)",
            width: size * FILL,
            height: size * FILL,
            transition: "top 0.5s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          <AgentFigure
            shape={cfg.shape}
            palette={cfg.palette}
            mood={cfg.mood}
            state={cfg.state}
            hands={cfg.hands}
            eyes={cfg.eyes}
            size={size * FILL}
            bare
          />
        </span>
      </span>
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-[#00c64c]"
          style={{ width: Math.max(size * 0.26, 8), height: Math.max(size * 0.26, 8) }}
        />
      )}
    </span>
  );
}

function Panel({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-[20px] border border-[#f0f0f0] bg-white p-5 shadow-[0_1px_2px_rgba(14,18,27,0.04)] ${className}`}
    >
      <span className={mono}>{label}</span>
      {children}
    </div>
  );
}

const SIZES = [72, 48, 32, 24];

export default function AvatarView({ cfg }: { cfg: AgentConfig }) {
  return (
    <div className="flex h-full w-full overflow-y-auto p-6 [scrollbar-width:thin]">
      {/* auto margins centre the column like the studio mascot, but unlike
          items-center they never clip the top when the panel has to scroll */}
      <motion.div
        className="m-auto flex w-full max-w-[560px] flex-col gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SOFT}
      >
        {/* hero — the profile picture at full size */}
        <div className="flex flex-col items-center gap-5 rounded-[20px] border border-[#f0f0f0] bg-white p-8 shadow-[0_1px_2px_rgba(14,18,27,0.04)]">
          <AgentAvatar cfg={cfg} size={128} ring />
          <div className="flex flex-col items-center gap-1">
            <span className="text-[18px] font-medium leading-6 tracking-[-0.36px] text-black">
              {cfg.name}
            </span>
            <span className={text12}>AI agent · always on</span>
          </div>
        </div>

        {/* the sizes it has to survive */}
        <Panel label="Sizes">
          <div className="flex items-end gap-6">
            {SIZES.map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <AgentAvatar cfg={cfg} size={s} />
                <span className={mono}>{s}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* in a conversation, the way the onboarding scenes use it */}
        <Panel label="In chat">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <AgentAvatar cfg={cfg} size={32} online />
              <div className="flex flex-col gap-1.5 pt-0.5">
                <span className={text14}>Morning! Three things need you today.</span>
                <div className="flex w-fit items-center gap-1.5 rounded-xl border border-[#f0f0f0] px-2.5 py-1.5">
                  <span className="size-1.5 rounded-full bg-[#00c64c]" />
                  <span className={text12}>2 tasks running</span>
                </div>
              </div>
            </div>
            <div className="self-end rounded-2xl bg-black/[0.04] px-3.5 py-2">
              <span className={text14}>handle the first two</span>
            </div>
          </div>
        </Panel>

        {/* stacked, the way a team or thread shows participants */}
        <Panel label="In a group">
          <div className="flex items-center gap-4">
            <div className="flex">
              {[0, 1, 2].map((i) => (
                // relative so zIndex actually applies — the leftmost stays on
                // top, and the white ring keeps each circle's crop readable
                <span
                  key={i}
                  className={`relative inline-flex rounded-full ring-2 ring-white ${i > 0 ? "-ml-2.5" : ""}`}
                  style={{ zIndex: 3 - i }}
                >
                  <AgentAvatar cfg={cfg} size={36} />
                </span>
              ))}
            </div>
            <span className={text12}>{cfg.name} and 2 others are in this workspace</span>
          </div>
        </Panel>
      </motion.div>
    </div>
  );
}
