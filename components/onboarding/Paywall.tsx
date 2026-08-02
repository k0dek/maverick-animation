"use client";

import { useEffect, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useInView } from "framer-motion";
import { POP, SOFT } from "./primitives";

const EASE = [0.32, 0.72, 0, 1] as const;

const PW = {
  map: "/assets/pw-map.png",
  logoPlus: "/assets/pw-logo-plus.svg",
  plusGray: "/assets/pw-plus-gray.svg",
  blobGreen: "/assets/pw-blob-green.svg",
  blobBlue: "/assets/pw-blob-blue.svg",
  blobYellow: "/assets/pw-blob-yellow.svg",
  blobOrange: "/assets/pw-blob-orange.svg",
  shield: "/assets/pw-shield.svg",
  check: "/assets/pw-check.svg",
  logos: ["/assets/pw-logo-1.svg", "/assets/pw-logo-2.svg", "/assets/pw-logo-3.svg"],
  feats: [
    "/assets/pw-feat-verify.svg",
    "/assets/pw-feat-click.svg",
    "/assets/pw-feat-brain.svg",
    "/assets/pw-feat-flow.svg",
  ],
  uc: [
    "/assets/pw-uc-1.svg",
    "/assets/pw-uc-2.svg",
    "/assets/pw-uc-3.svg",
    "/assets/pw-uc-4.svg",
    "/assets/pw-uc-5.svg",
    "/assets/pw-uc-6.svg",
    "/assets/pw-uc-7.svg",
  ],
  chevronTop: "/assets/pw-chevron-top.svg",
  footerWordmark: "/assets/pw-footer-wordmark.svg",
  statusDot: "/assets/pw-status-dot.svg",
};

/* --------------------------------- data ------------------------------------- */

type Plan = {
  name: string;
  badge: string;
  price: number;
  featured?: boolean;
  features: string[];
  blobs: { src: string; w: number; h: number; x: number; y: number; flip?: boolean; eyes: { x: number; y: number } }[];
};

const PLANS: Plan[] = [
  {
    name: "12-Month Plan",
    badge: "Save 70%",
    price: 15.9,
    features: ["All 10+ AI agents", "Unlimited credits", "20+ integrations", "Priority 24/7 support"],
    blobs: [
      { src: PW.blobGreen, w: 64.5, h: 65.5, x: 46, y: 110, flip: true, eyes: { x: 16, y: 13.5 } },
    ],
  },
  {
    name: "3-Month Plan",
    badge: "Save 60%",
    price: 23.9,
    featured: true,
    features: ["All 10+ AI agents", "500 monthly credits", "20+ integrations", "24/7 live chat support"],
    blobs: [
      { src: PW.blobBlue, w: 64.5, h: 76, x: 149.8, y: 109, flip: true, eyes: { x: 20.5, y: 11 } },
      { src: PW.blobYellow, w: 52, h: 59.5, x: 193.7, y: 112.5, eyes: { x: 13.1, y: 12.7 } },
    ],
  },
  {
    name: "1-Month Plan",
    badge: "Save 50%",
    price: 48.5,
    features: ["All 10+ AI agents", "250 monthly credits", "15+ integrations", "24/7 email support"],
    blobs: [
      { src: PW.blobOrange, w: 64.5, h: 58, x: 64.3, y: 114, eyes: { x: 32.3, y: 12 } },
    ],
  },
];

const FEATURES = [
  { icon: PW.feats[0], tint: "rgba(0,144,255,0.08)", title: "10+ AI Agents for every workflow", sub: "Deploy Scout, Onyx, Prism, Atlas, Nova and more — from marketing to ops to customer success." },
  { icon: PW.feats[1], tint: "rgba(229,72,77,0.08)", title: "One-click automations for any task", sub: "Launch pre-built automations instantly. Just select, customize, and let Maverick handle the rest." },
  { icon: PW.feats[2], tint: "rgba(30,196,169,0.08)", title: "Adaptive AI that learns your style", sub: "Maverick learns your tone, preferences, and business context to deliver outputs tailored to you." },
  { icon: PW.feats[3], tint: "rgba(255,162,2,0.08)", title: "Seamless integrations across your stack", sub: "Connect to Slack, Gmail, Notion, HubSpot, and 20+ tools you already use — zero setup friction." },
];

const USE_CASES: { icon: string; title: string; sub: string }[][] = [
  [
    { icon: PW.uc[0], title: "Inbox Zero Agent", sub: "Triages, drafts, and sends emails on your behalf" },
    { icon: PW.uc[1], title: "Content Writer", sub: "Generates blog posts, ads, and social copy in your brand voice" },
    { icon: PW.uc[2], title: "Meeting Prep Agent", sub: "Summarizes context and creates agendas before every call" },
    { icon: PW.uc[3], title: "Data Analyst", sub: "Pulls insights from spreadsheets and dashboards automatically" },
  ],
  [
    { icon: PW.uc[4], title: "Lead Gen Agent", sub: "Finds and qualifies prospects across LinkedIn and CRMs" },
    { icon: PW.uc[5], title: "Customer Support Agent", sub: "Resolves tickets, answers FAQs, and escalates edge cases intelligently" },
    { icon: PW.uc[6], title: "SEO Strategist", sub: "Audits pages, suggests keywords, and optimizes your content for ranking" },
    { icon: PW.uc[2], title: "Social Media Manager", sub: "Schedules posts, tracks engagement, and suggests trending topics" },
  ],
  [
    { icon: PW.uc[0], title: "HR Onboarding Agent", sub: "Automates new hire checklists, docs, and welcome sequences" },
    { icon: PW.uc[1], title: "Invoice Processor", sub: "Extracts, categorizes, and routes invoices without manual input" },
    { icon: PW.uc[2], title: "Competitor Tracker", sub: "Monitors competitor moves and delivers weekly intel briefs" },
    { icon: PW.uc[3], title: "Report Generator", sub: "Builds polished reports from raw data in seconds" },
  ],
];

const FAQS = [
  {
    q: "What exactly are Maverick AI agents?",
    a: "Maverick agents are autonomous AI workers trained for specific business functions — marketing, sales, support, ops, and more. Each agent handles end-to-end workflows so you can focus on strategy.",
  },
  {
    q: "Can I try Maverick before committing?",
    a: "Yes — every plan comes with a 14-day money-back guarantee, so you can put your agents to work risk-free.",
  },
  {
    q: "How does Maverick integrate with my existing tools?",
    a: "Maverick connects natively to Slack, Gmail, Notion, HubSpot, and 20+ other tools. Authorize once and your agents work right inside your stack.",
  },
  {
    q: "Is my data safe with Maverick?",
    a: "Your data is encrypted in transit and at rest. Maverick is CASA Tier 3 certified, GDPR aligned, CCPA compliant, and SOC 2 Type 1 audited.",
  },
];

/* ------------------------------- little pieces ------------------------------- */

/** A mascot blob peeking from behind a card's button, with blinking eyes. */
function Blob({
  blob,
  delay,
  className = "",
}: {
  blob: Plan["blobs"][number];
  delay: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{ left: blob.x, top: blob.y, width: blob.w, height: blob.h }}
      initial={{ opacity: 0, y: 24, scale: 0.4 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...POP, delay }}
    >
      <motion.div
        className="relative size-full"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <img
          src={blob.src}
          alt=""
          className="absolute inset-0 size-full max-w-none"
          style={{ transform: blob.flip ? "scaleX(-1)" : undefined }}
        />
        {[0, 11.16].map((dx, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: blob.eyes.x + dx,
              top: blob.eyes.y,
              width: 7,
              height: 14.1,
              backgroundColor: "rgba(255,255,255,0.2)",
              boxShadow: "inset 0 0 11.5px 3.2px white",
            }}
            animate={{ scaleY: [1, 1, 0.15, 1] }}
            transition={{ duration: 0.4, times: [0, 0.7, 0.85, 1], repeat: Infinity, repeatDelay: 3.1, delay: 1.6 + delay }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

/** Price that counts up when it scrolls into view. */
function Price({ value }: { value: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true });
  const [text, setText] = useState("0.00");
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.3,
      ease: EASE,
      onUpdate: (v) => setText(v.toFixed(2)),
    });
    return () => controls.stop();
  }, [inView, value]);
  return (
    <p ref={ref} className="whitespace-nowrap text-[40px] font-medium leading-[48px] text-black">
      ${text}
    </p>
  );
}

function SectionHeading({ line1 }: { line1: string }) {
  return (
    <motion.div
      className="flex w-[540px] max-w-full flex-col"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <p className="text-[40px] font-medium leading-[48px] tracking-[-1.2px] text-black">{line1}</p>
      <span className="flex items-center gap-2 text-[40px] font-medium leading-[48px] tracking-[-1.2px] text-[#e0e0e0]">
        with
        <span className="flex items-start gap-[1.5px]">
          Maverick
          <img src={PW.plusGray} alt="" className="mt-1 block h-[37px] w-[25px] max-w-none" />
        </span>
      </span>
    </motion.div>
  );
}

function FaqItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <motion.div
      className="w-full rounded-[20px] border border-[#f0f0f0] bg-white p-5 shadow-[0_1px_2px_rgba(14,18,27,0.04),0_10px_16px_rgba(14,18,27,0.04)]"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full cursor-pointer items-center gap-2.5 text-left"
      >
        <span className="flex-1 text-[18px] font-medium leading-7 tracking-[-0.36px] text-black">{q}</span>
        {/* 20px box with the chevron at its Figma insets (15 × 7.64) */}
        <motion.span
          className="flex size-5 shrink-0 items-center justify-center"
          animate={{ rotate: open ? 0 : 180 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <img src={PW.chevronTop} alt="" className="block max-w-none" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.4, ease: EASE },
              opacity: { duration: 0.3, ease: "easeOut" },
            }}
          >
            <p className="pt-5 text-[14px] font-medium leading-5 tracking-[-0.28px] text-[#8d8d8d]">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------------------------------- Paywall ----------------------------------- */

export default function Paywall({ onDone }: { onDone: () => void }) {
  const [openFaq, setOpenFaq] = useState(0);
  const [showAllCases, setShowAllCases] = useState(false);

  return (
    <div
      className="relative min-h-full w-full bg-white"
      style={{
        backgroundImage: "linear-gradient(180deg, rgba(2,113,227,0.11) 0%, rgba(2,113,227,0) 18%)",
      }}
    >
      {/* dotted world map wash — color-dodge so the (near-black) source image only
          glows through its bright specks instead of alpha-blending into a gray box */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex h-[1726px] justify-center overflow-hidden"
        style={{ mixBlendMode: "color-dodge" }}
      >
        <img src={PW.map} alt="" className="w-[2300px] max-w-none rotate-180 opacity-10" />
      </div>

      {/* header */}
      <div className="relative flex justify-center p-6">
        <div className="flex w-full max-w-[1220px] justify-end">
          <motion.button
            type="button"
            onClick={onDone}
            className="flex h-[38px] cursor-pointer items-center rounded-full bg-[#0271e3] px-5 text-[16px] font-medium tracking-[-0.32px] text-white transition-colors hover:bg-[#0264c8]"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
          >
            Get Maverick
          </motion.button>
        </div>
      </div>

      {/* hero + pricing */}
      <div className="relative flex flex-col items-center gap-12 px-6">
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
        >
          <span className="flex items-start gap-[1.6px]">
            <span className="text-[42px] font-medium tracking-[-1.68px] text-black">Maverick</span>
            <img src={PW.logoPlus} alt="" className="block h-10 w-[27px] max-w-none" />
          </span>
          <p className="text-[16px] font-medium tracking-[-0.32px] text-black/[0.16]">
            Choose your Maverick plan and start automating today
          </p>
        </motion.div>

        <div className="flex w-[1080px] max-w-full gap-6 rounded-[28px] p-4">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative flex-1 rounded-[28px] bg-white p-8 ${
                plan.featured
                  ? "border border-black/[0.08] shadow-[0_1px_2px_rgba(14,18,27,0.04),0_10px_16px_rgba(14,18,27,0.04)]"
                  : ""
              }`}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SOFT, delay: 0.2 + i * 0.08 }}
            >
              {/* mascots peeking from behind the button */}
              {plan.blobs.map((blob, b) => (
                <Blob key={b} blob={blob} delay={1 + i * 0.15 + b * 0.12} />
              ))}

              <div className="relative flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-medium leading-5 tracking-[-0.28px] text-black">
                      {plan.name}
                    </p>
                    <span className="flex h-6 items-center rounded-full border border-black/[0.04] px-2 text-[12px] font-semibold leading-4 tracking-[-0.24px] text-black">
                      {plan.badge}
                    </span>
                  </div>
                  <div className="flex items-start gap-1">
                    <Price value={plan.price} />
                    <span className="py-[7px] text-[12px] font-medium leading-4 text-[#8d8d8d]"> /mo</span>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={onDone}
                  whileTap={{ scale: 0.97 }}
                  whileHover={plan.featured ? undefined : { filter: "brightness(0.97)" }}
                  className={`flex h-11 w-full cursor-pointer items-center justify-center rounded-2xl px-3 text-[16px] font-medium tracking-[-0.32px] transition-colors ${
                    plan.featured
                      ? "bg-[#0271e3] text-white hover:bg-[#0264c8]"
                      // frosted "liquid glass" pill: translucent white layer over a
                      // faint black tint, softened with backdrop blur — matches Figma
                      : "border border-black/[0.04] text-black backdrop-blur-md backdrop-saturate-150"
                  }`}
                  style={
                    plan.featured
                      ? undefined
                      : {
                          backgroundImage:
                            "linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.04) 100%), linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.7) 100%)",
                        }
                  }
                >
                  Get Maverick
                </motion.button>

                <div className="flex items-center gap-1">
                  <img src={PW.shield} alt="" className="block max-w-none" />
                  <p className="flex-1 text-[14px] font-medium leading-5 tracking-[-0.14px] text-black">
                    14-day money-back guarantee
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-1">
                      <span className="flex size-5 items-center justify-center">
                        <img src={PW.check} alt="" className="block max-w-none" />
                      </span>
                      <p className="flex-1 text-[14px] font-medium leading-5 tracking-[-0.14px] text-black">
                        {f}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* logo marquee — spacing lives on each item (not as a flex gap), so the two
          halves are byte-identical in width and -50% lands exactly one repetition;
          a gap between the halves would leave a half-gap seam that reads as a jump */}
      <div className="relative overflow-hidden py-12">
        <motion.div
          className="flex w-max items-center"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 2 }).map((_, half) => (
            <div key={half} className="flex items-center" aria-hidden={half === 1}>
              {Array.from({ length: 18 }).map((_, i) => (
                <img
                  key={i}
                  src={PW.logos[i % 3]}
                  alt=""
                  className="mr-12 block h-12 max-w-none opacity-70"
                />
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      {/* everything you're getting — the row overflows its 840px frame, so it scrolls */}
      <div className="relative flex flex-col items-center gap-10 px-6 py-16">
        <SectionHeading line1="Everything you're getting" />
        {/* horizontal-only scroll: the y axis is locked (no stray vertical scrollbar) and
            the blob that pokes above the cards lives inside the top padding so it isn't cut.
            Side padding sits on the inner track so neither end is clipped at rest. */}
        <div className="-mt-10 w-full max-w-[840px] overflow-x-auto overflow-y-hidden pt-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-6 px-8 pb-2">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="relative flex w-80 shrink-0 flex-col gap-6"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ ...SOFT, delay: i * 0.08 }}
              >
                {i === 1 && (
                  <Blob
                    blob={{ src: PW.blobBlue, w: 64.5, h: 76, x: 165, y: -42, flip: true, eyes: { x: 25.8, y: 11 } }}
                    delay={0.4}
                    className="z-0"
                  />
                )}
                {/* translucent tint + backdrop blur so the blob behind frosts through */}
                <div
                  className="relative z-10 flex h-[200px] items-center justify-center rounded-3xl p-5 backdrop-blur-xl backdrop-saturate-150"
                  style={{ backgroundColor: feat.tint }}
                >
                  <img src={feat.icon} alt="" className="block size-[53px] max-w-none" />
                </div>
                <div className="flex flex-col gap-1.5 px-2">
                  <p className="text-[16px] font-medium leading-6 tracking-[-0.32px] text-black">{feat.title}</p>
                  <p className="text-[14px] font-medium leading-5 tracking-[-0.28px] text-[#8d8d8d]">{feat.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* real use cases */}
      <div className="relative px-3">
        <div className="flex flex-col items-center gap-8 rounded-3xl bg-[#fcfcfc] px-6 pb-[54px] pt-20">
          <SectionHeading line1="Real usecases where you can" />
          <div className="relative w-full max-w-[840px]">
            {/* collapsed to 480px; expanding animates to the grid's natural height */}
            <motion.div
              className="relative flex gap-3 overflow-hidden px-8"
              animate={{ height: showAllCases ? "auto" : 480 }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              {USE_CASES.map((col, c) => (
                <div key={c} className={`flex min-w-0 flex-1 flex-col gap-2 ${c !== 1 ? "pt-8" : ""}`}>
                  {col.map((uc, i) => (
                    <motion.div
                      key={uc.title}
                      className="flex w-full flex-col gap-3 rounded-[20px] border border-[#f0f0f0] bg-white p-4 shadow-[0_1px_2px_rgba(14,18,27,0.04),0_10px_16px_rgba(14,18,27,0.04)]"
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ ...SOFT, delay: c * 0.05 + i * 0.05 }}
                    >
                      <img src={uc.icon} alt="" className="block size-6 max-w-none" />
                      <div className="flex flex-col gap-1">
                        <p className="text-[16px] font-medium leading-6 tracking-[-0.32px] text-black">{uc.title}</p>
                        <p className="text-[14px] font-medium leading-5 tracking-[-0.28px] text-[#8d8d8d]">{uc.sub}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
              {/* fade only while collapsed */}
              <motion.div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[139px] bg-gradient-to-t from-[#fcfcfc] from-30% to-transparent"
                animate={{ opacity: showAllCases ? 0 : 1 }}
                transition={{ duration: 0.35, ease: EASE }}
              />
            </motion.div>

            <motion.button
              type="button"
              onClick={() => setShowAllCases((v) => !v)}
              className={`left-1/2 flex h-9 -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full bg-[#0271e3] px-4 text-[16px] font-medium tracking-[-0.32px] text-white transition-colors hover:bg-[#0264c8] ${
                showAllCases ? "relative mt-6" : "absolute bottom-12"
              }`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...SOFT, delay: 0.3 }}
            >
              {showAllCases ? "View less" : "View more"}
              {/* scaled down from the 15px FAQ glyph — this pill is only 36px tall */}
              <motion.span
                className="flex size-4 items-center justify-center"
                animate={{ rotate: showAllCases ? 0 : 180 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <img
                  src={PW.chevronTop}
                  alt=""
                  className="block h-auto w-[10px] max-w-none brightness-0 invert"
                />
              </motion.span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* faq */}
      <div className="relative flex flex-col items-center gap-10 px-6 py-14">
        <motion.p
          className="w-[540px] max-w-full text-[40px] font-medium leading-[48px] tracking-[-1.2px] text-black"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          Frequently asked questions
        </motion.p>
        <div className="flex w-[540px] max-w-full flex-col gap-4">
          {FAQS.map((faq, i) => (
            <FaqItem
              key={faq.q}
              q={faq.q}
              a={faq.a}
              open={openFaq === i}
              onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
            />
          ))}
        </div>
      </div>

      {/* footer */}
      <div className="relative flex flex-col items-center overflow-hidden px-6 pt-20">
        <div className="relative flex w-[1140px] max-w-full flex-col gap-[120px] pb-60">
          <div className="flex w-full">
            <motion.div
              className="flex-1 text-[40px] font-medium leading-10 tracking-[-1.6px] text-black"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <p>An AI that actually</p>
              <p>does things.</p>
            </motion.div>
            <div className="flex flex-1 text-[16px] font-medium leading-6 tracking-[-0.32px]">
              {[
                { head: "Product", links: ["Integrations", "Use Cases", "Pricing", "Blog", "Security", "Docs"] },
                { head: "Compare", links: ["vs. Sintra", "vs. ChatGPT", "vs. Jasper"] },
              ].map((col) => (
                <div key={col.head} className="flex flex-1 flex-col gap-2.5">
                  <p className="text-black/[0.24]">{col.head}</p>
                  {col.links.map((link) => (
                    <p
                      key={link}
                      className="cursor-pointer text-black transition-colors hover:text-black/60"
                    >
                      {link}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex w-full items-end justify-between text-[16px] font-medium leading-6 tracking-[-0.32px]">
            <div className="flex flex-col gap-1">
              <p className="text-[#bbb]">Crafted w/ love by us</p>
              <p className="text-black">2026 Maverick. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-black">Operational</p>
              <img src={PW.statusDot} alt="" className="block size-5 max-w-none" />
            </div>
          </div>
          {/* giant wordmark rising from the bottom */}
          <motion.img
            src={PW.footerWordmark}
            alt="Maverick"
            className="absolute -bottom-[25px] left-0 w-full max-w-none"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: EASE }}
          />
        </div>
      </div>
    </div>
  );
}
