"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ASSETS } from "./assets";
import { LAYOUT_SPRING, POP, SOFT } from "./primitives";

const EASE = [0.32, 0.72, 0, 1] as const;

const text14 = "text-[14px] font-medium leading-5 tracking-[-0.28px]";

/* ------------------------------- shared pieces ------------------------------- */

function PillButton({
  label,
  variant = "ghost",
  onClick,
  disabled,
}: {
  label: string;
  variant?: "solid" | "ghost";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`flex h-9 shrink-0 items-center whitespace-nowrap rounded-xl px-3 ${text14} transition-colors ${
        variant === "solid"
          ? "bg-black text-white hover:bg-black/85 disabled:bg-black/[0.12] disabled:text-black/40"
          : "border border-[#f0f0f0] text-black hover:bg-black/[0.03]"
      } ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      {label}
    </motion.button>
  );
}

/** Numbered marker with the connecting rail running down to the next step. */
function StepMarker({ n, last }: { n: number; last?: boolean }) {
  return (
    <div className="relative flex size-6 shrink-0 items-center justify-center rounded-full border border-[#f0f0f0] bg-white shadow-[0_1px_2px_rgba(14,18,27,0.04)]">
      <span className={`${text14} text-center text-[#cecece]`}>{n}</span>
      {!last && (
        <motion.span
          className="absolute left-1/2 top-[22px] w-px -translate-x-1/2 origin-top bg-[#f0f0f0]"
          initial={{ height: 0 }}
          animate={{ height: "var(--rail-h)" }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
          style={{ ["--rail-h" as string]: "100%" }}
        />
      )}
    </div>
  );
}

function ConnectStep({
  n,
  last,
  title,
  sub,
  delay,
  children,
}: {
  n: number;
  last?: boolean;
  title: string;
  sub: string;
  delay: number;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      className="relative flex w-full gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SOFT, delay }}
    >
      <div className="relative flex flex-col self-stretch">
        <StepMarker n={n} last={last} />
        {!last && <span className="absolute left-1/2 top-6 h-full w-px -translate-x-1/2 bg-[#f0f0f0]" />}
      </div>
      {/* items-start so buttons keep their intrinsic width instead of stretching */}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-3 pb-5">
        <div className="flex flex-col gap-1.5">
          <p className={`${text14} text-black`}>{title}</p>
          <p className={`${text14} text-[#bbb]`}>{sub}</p>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

/* --------------------------- telegram · 3-step flow --------------------------- */

export function TelegramConnect({ onConnect }: { onConnect: () => void }) {
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const ready = token.trim().length > 8;

  const connect = () => {
    if (!ready || verifying) return;
    setVerifying(true);
    // stand-in for the token round-trip
    setTimeout(onConnect, 1400);
  };

  return (
    <div className="flex flex-col">
      <ConnectStep
        n={1}
        delay={0.05}
        title="Create your Telegram bot"
        sub="BotFather will ask for a name, a username, and then give you a token."
      >
        {/* wraps rather than overflowing the narrow card */}
        <div className="flex w-full flex-wrap gap-2">
          <PillButton label="Create Bot via BotFather" variant="solid" />
          <PillButton label="Need help?" />
        </div>
      </ConnectStep>

      <ConnectStep
        n={2}
        delay={0.14}
        title="Paste the bot token"
        sub="The token looks like 123456789: AA.... Keep it private."
      >
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Place it here..."
          className={`h-9 w-full min-w-0 rounded-xl border border-[#f0f0f0] px-3 ${text14} text-black outline-none transition-colors placeholder:text-[#bbb] focus:border-black/20`}
        />
      </ConnectStep>

      <ConnectStep
        n={3}
        last
        delay={0.23}
        title="Connect Telegram"
        sub="Maverick will verify the token and connect you."
      >
        <PillButton
          label={verifying ? "Verifying…" : "Connect Telegram"}
          variant="solid"
          onClick={connect}
          disabled={!ready || verifying}
        />
      </ConnectStep>
    </div>
  );
}

/* ----------------------------- whatsapp · QR flow ----------------------------- */

export function WhatsAppConnect({ onConnect }: { onConnect: () => void }) {
  const [qrKey, setQrKey] = useState(0);

  // the QR "resolves" on its own, mimicking a device linking itself
  // (long enough to leave room for a hover/refresh before it completes)
  useEffect(() => {
    const t = setTimeout(onConnect, 9000);
    return () => clearTimeout(t);
  }, [qrKey, onConnect]);

  return (
    <motion.div
      // nested inside the channel row card — a flat surface, not a floating one,
      // so no big drop shadow that pops when the panel's clip releases
      className="flex items-center gap-4 rounded-[20px] border border-[#f0f0f0] bg-white p-4 shadow-[0_1px_2px_rgba(14,18,27,0.04)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SOFT}
    >
      {/* hovering the code blurs it and reveals a compact refresh action over it */}
      <div className="group relative size-[108px] shrink-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={qrKey}
            src={ASSETS.waQr}
            alt="WhatsApp linking QR code"
            className="block size-[108px] max-w-none transition duration-300 group-hover:blur-[3px] group-hover:brightness-105"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
            transition={{ duration: 0.4, ease: EASE }}
          />
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setQrKey((k) => k + 1)}
            className="pointer-events-auto flex h-7 scale-90 cursor-pointer items-center whitespace-nowrap rounded-lg border border-[#f0f0f0] bg-white/95 px-2.5 text-[12px] font-medium leading-4 tracking-[-0.24px] text-black opacity-0 shadow-[0_2px_8px_rgba(14,18,27,0.12)] transition duration-200 group-hover:scale-100 group-hover:opacity-100 hover:bg-white"
          >
            Refresh QR
          </button>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className={`${text14} text-black`}>Scan this QR in WhatsApp → Linked Devices.</p>
        {/* shimmering "waiting" line, per the design's gradient text */}
        <motion.p
          className={`${text14} bg-[linear-gradient(90deg,rgba(0,0,0,0.13)_0%,rgba(0,0,0,0.64)_50%,rgba(0,0,0,0.13)_100%)] bg-clip-text text-transparent`}
          style={{ backgroundSize: "200% 100%" }}
          animate={{ backgroundPositionX: ["200%", "-200%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        >
          Waiting for setup...
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ------------------------- expanding panel in the row ------------------------- */

export function ConnectPanel({ open, children }: { open: boolean; children: React.ReactNode }) {
  // clip while growing/collapsing, then release so card shadows aren't sliced off
  const [clip, setClip] = useState(true);
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          className={clip ? "overflow-hidden" : ""}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          onAnimationStart={() => setClip(true)}
          onAnimationComplete={() => {
            if (open) setClip(false);
          }}
          transition={{ height: LAYOUT_SPRING, opacity: { duration: 0.25 } }}
        >
          <div className="pt-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Small success flash shown the moment a channel links. */
export function ConnectedBadge() {
  return (
    <motion.span
      className="flex items-center gap-1.5"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={POP}
    >
      <img src={ASSETS.iconCheckGreen} alt="" className="block size-5 max-w-none" />
      <span className={`${text14} text-black`}>Connected</span>
    </motion.span>
  );
}
