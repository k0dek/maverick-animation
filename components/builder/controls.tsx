"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import {
  buildPath,
  MOODS,
  PALETTES,
  type MoodId,
  type PaletteId,
  type ShapeDef,
} from "./engine";

/* ------------------------------- section shell ------------------------------- */

export function Section({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex h-5 items-center justify-between">
        <span className="font-mono text-[12px] font-medium uppercase leading-4 tracking-[-0.24px] text-black/[0.32]">
          {label}
        </span>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ----------------------------------- chips ----------------------------------- */

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-[14px] font-medium leading-5 tracking-[-0.28px] transition-colors ${
        active
          ? "border-black bg-black text-white"
          : "border-[#f0f0f0] bg-white text-black hover:bg-black/[0.03]"
      }`}
    >
      {children}
    </motion.button>
  );
}

/** Labeled card with a mini mascot wearing the mood — bloub-style preview. */
export function MoodCard({
  id,
  palette,
  active,
  onClick,
}: {
  id: MoodId;
  palette: PaletteId;
  active?: boolean;
  onClick: () => void;
}) {
  const m = MOODS[id];
  const pal = PALETTES[palette];
  // mirrors the live rig's per-eye box so the thumbnail is a true preview
  const eyes = [
    { e: m.eyes.L, left: 9 },
    { e: m.eyes.R, left: 20 },
  ];
  return (
    <motion.button
      type="button"
      title={m.label}
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border p-2 pb-1.5 transition-[border-color,box-shadow,background-color] duration-200 ${
        active
          ? "border-[#0271e3] shadow-[0_0_0_3px_rgba(2,113,227,0.12)]"
          : "border-[#f0f0f0] bg-white hover:bg-black/[0.02]"
      }`}
    >
      <span
        className="relative size-9 rounded-full transition-colors duration-300"
        style={{ backgroundImage: `linear-gradient(180deg, ${pal.from} -30%, ${pal.to} 100%)` }}
      >
        {eyes.map(({ e, left }, i) => {
          // same single-polyline geometry as the live rig, at thumbnail scale
          const W = 6 * e.w;
          const H = 13 * e.h;
          const t = Math.max(Math.min(e.g.sw * W, W, H), 1);
          const iw = Math.max(W - t, 0);
          const ih = Math.max(H - t, 0);
          const [x0, y0, x1, y1, x2, y2] = e.g.p;
          const X = (x: number) => (W / 2 + x * iw).toFixed(2);
          const Y = (y: number) => (H / 2 + y * ih).toFixed(2);
          return (
            <svg
              key={i}
              className="absolute overflow-visible"
              width={W}
              height={H}
              style={{
                left: left + e.dx * 13,
                top: 10 + e.dy * 13,
                transform: `rotate(${e.rot}deg) skewX(${e.skew}deg)`,
              }}
            >
              <path
                d={`M${X(x0)} ${Y(y0)}L${X(x1)} ${Y(y1)}L${X(x2)} ${Y(y2)}`}
                stroke="#fff"
                strokeWidth={t}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          );
        })}
      </span>
      <span className="max-w-full truncate text-[11px] font-medium leading-3 tracking-[-0.22px] text-black/50">
        {m.label}
      </span>
    </motion.button>
  );
}

/* ------------------------------- shape thumbs -------------------------------- */

export function ShapeThumb({
  def,
  palette,
  active,
  onClick,
}: {
  def: ShapeDef;
  palette: PaletteId;
  active?: boolean;
  onClick: () => void;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pal = PALETTES[palette];
  // static sample of the same generator the live rig uses
  const d = buildPath(15, 20, 21, def.n, def.nB, def.ax, def.ay, def.ayB, def.taper, def.tilt, def.wobA, def.wobB, 1.1);
  return (
    <motion.button
      type="button"
      title={def.label}
      aria-label={def.label}
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border p-2 pb-1.5 transition-[border-color,box-shadow,background-color] duration-200 ${
        active
          ? "border-[#0271e3] shadow-[0_0_0_3px_rgba(2,113,227,0.12)]"
          : "border-[#f0f0f0] bg-white hover:bg-black/[0.02]"
      }`}
    >
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id={`thumb-${uid}`} x1="0.5" y1="-0.2" x2="0.5" y2="0.78">
            <stop offset="0" style={{ stopColor: pal.from, transition: "stop-color 0.4s ease" }} />
            <stop offset="1" style={{ stopColor: pal.to, transition: "stop-color 0.4s ease" }} />
          </linearGradient>
        </defs>
        <path d={d} fill={`url(#thumb-${uid})`} />
        {/* every thumbnail wears the face, like the reference builder */}
        <rect x="15.4" y="13.5" width="2.8" height="7" rx="1.4" fill="#fff" />
        <rect x="21.4" y="13.5" width="2.8" height="7" rx="1.4" fill="#fff" />
      </svg>
      <span className="max-w-full truncate text-[11px] font-medium leading-3 tracking-[-0.22px] text-black/50">
        {def.label}
      </span>
    </motion.button>
  );
}

/* --------------------------------- swatches ---------------------------------- */

export function Swatch({
  id,
  active,
  onClick,
}: {
  id: PaletteId;
  active?: boolean;
  onClick: () => void;
}) {
  const pal = PALETTES[id];
  return (
    <motion.button
      type="button"
      title={pal.label}
      aria-label={pal.label}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      animate={{ scale: active ? 1.1 : 1 }}
      className="size-8 cursor-pointer rounded-full"
      style={{
        backgroundImage: `linear-gradient(180deg, ${pal.from} -30%, ${pal.to} 100%)`,
        boxShadow: active
          ? `0 0 0 2px #fff, 0 0 0 4px rgba(${pal.tint},0.8)`
          : "inset 0 0 0 1px rgba(14,18,27,0.06)",
      }}
    />
  );
}

/* ---------------------------------- slider ----------------------------------- */

const THUMB =
  "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/[0.08] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(14,18,27,0.18)] [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black/[0.08] [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_1px_3px_rgba(14,18,27,0.18)]";

export function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-[13px] font-medium leading-4 tracking-[-0.26px] text-black/60">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full outline-none ${THUMB}`}
        style={{ background: `linear-gradient(to right, #0271e3 ${pct}%, rgba(0,0,0,0.06) ${pct}%)` }}
      />
      <span className="w-11 shrink-0 text-right font-mono text-[12px] font-medium leading-4 tracking-[-0.24px] text-black/[0.32]">
        {format(value)}
      </span>
    </label>
  );
}

/* ------------------------------- ghost button --------------------------------- */

export function GhostButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="flex h-9 flex-1 cursor-pointer items-center justify-center rounded-full border border-[#f0f0f0] px-4 text-[14px] font-medium leading-5 tracking-[-0.28px] text-black transition-colors hover:bg-black/[0.03]"
    >
      {children}
    </motion.button>
  );
}
