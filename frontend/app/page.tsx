"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Brain, Activity, Shield, Stethoscope, Pill, Microscope,
  BarChart2, ChevronRight, Menu, X, ArrowRight, Zap,
  Calendar, FileText, MessageSquare, Star, Users, TrendingUp,
  ImageIcon, PlayCircle, Sparkles, ArrowUpRight,
} from "lucide-react";

/* ── Logo ─────────────────────────────────────────────────────────────────── */
function HelixaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="#9D93C1" />
      <path d="M8 16C8 11.582 11.582 8 16 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 16C24 20.418 20.418 24 16 24" stroke="#EDEBF2" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3.5" fill="#fff" />
    </svg>
  );
}

function DotGrid({ size = 40, fill = "#9D93C1", ring = "#E3E0EA" }: { size?: number; fill?: string; ring?: string }) {
  const r = size * 0.16;
  const gap = size * 0.5;
  const cx = size * 0.32;
  const cy = size * 0.32;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle cx={cx} cy={cy} r={r} stroke={ring} strokeWidth="1.5" />
      <circle cx={cx + gap} cy={cy} r={r} stroke={ring} strokeWidth="1.5" />
      <circle cx={cx} cy={cy + gap} r={r} stroke={ring} strokeWidth="1.5" />
      <circle cx={cx + gap} cy={cy + gap} r={r} fill={fill} />
    </svg>
  );
}

/* ── Dashed placeholder for un-filled media slots ───────────────────────── */
function ImageSlot({
  label,
  mediaType = "Photo",
  className = "",
}: {
  label: string;
  mediaType?: "Photo" | "Video" | "GIF";
  className?: string;
}) {
  const Icon = mediaType === "Video" ? PlayCircle : mediaType === "GIF" ? Sparkles : ImageIcon;
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-2 text-center px-6 ${className}`}
      style={{
        background:
          "repeating-linear-gradient(135deg,#F1EFF7,#F1EFF7 10px,#EBE8F3 10px,#EBE8F3 20px)",
        border: "1.5px dashed #C7BEDB",
        borderRadius: 20,
      }}
    >
      <Icon className="w-6 h-6" style={{ color: "#8175A8" }} />
      <span className="text-xs font-semibold" style={{ color: "#5D5178" }}>{label}</span>
      <span
        className="badge"
        style={{ background: "#fff", color: "#7C6FA0", borderColor: "#C7BEDB" }}
      >
        Add {mediaType}
      </span>
    </div>
  );
}

/* ── Specialty photo card ─────────────────────────────────────────────────── */
function SpecialtyCard({ name, imgIndex, className = "" }: { name: string; imgIndex: number; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className={`relative overflow-hidden rounded-2xl group cursor-pointer ${className}`}>
      {/* Placeholder shown until image loads */}
      {(!loaded || errored) && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{
            background:
              "repeating-linear-gradient(135deg,#F1EFF7,#F1EFF7 10px,#EBE8F3 10px,#EBE8F3 20px)",
          }}
        >
          <ImageIcon className="w-6 h-6" style={{ color: "#8175A8" }} />
          <span className="text-xs font-semibold" style={{ color: "#5D5178" }}>
            img-{imgIndex}.jpg
          </span>
        </div>
      )}

      {!errored && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/img-${imgIndex}.jpg`}
          alt={name}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}

      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

      {/* bottom label row */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
        <span className="text-sm font-semibold text-white leading-tight">{name}</span>
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-white" />
        </span>
      </div>
    </div>
  );
}

/* ── Data ─────────────────────────────────────────────────────────────────── */
const SPECIALTIES = [
  { name: "Cardiology",       imgIndex: 1 },
  { name: "Neurology",        imgIndex: 2 },
  { name: "Orthopedics",      imgIndex: 3 },
  { name: "Dermatology",      imgIndex: 4 },
  { name: "General Practice", imgIndex: 5 },
  { name: "Pharmacy & Lab",   imgIndex: 6 },
];

const FEATURES = [
  { icon: Activity,    color: "#7C6FA0", bg: "#F1EFF7", title: "Longitudinal Health Record",    desc: "Your complete health timeline from birth — vitals, diagnoses, medications, and outcomes all in one interconnected graph." },
  { icon: Brain,       color: "#6F5F98", bg: "#ECE8F5", title: "Specialized AI Agents",         desc: "AI for cardiology, dermatology, nutrition, mental health, and more — working together like a hospital department team." },
  { icon: Stethoscope, color: "#8175A8", bg: "#EFEDF7", title: "NPI Doctor Discovery",          desc: "Find verified physicians from the US National Provider Identifier registry. Filter by specialty, state, and name." },
  { icon: Pill,        color: "#9D93C1", bg: "#F1EFF7", title: "FDA Pharmacy Intelligence",     desc: "Real drug data from OpenFDA — indications, dosing, warnings, interactions, and contraindications for every medication." },
  { icon: Shield,      color: "#5D5178", bg: "#E9E6F1", title: "Explainable AI",                desc: "Every recommendation shows a confidence score, supporting evidence, alternative diagnoses, and required doctor review." },
  { icon: BarChart2,   color: "#746A94", bg: "#EEEBF4", title: "Predictive Analytics",          desc: "Trend analysis across vitals, lifestyle, and medical history to surface risk factors before they escalate." },
];

const WHY_STATS = [
  { value: "20+",  label: "Medical specialties covered" },
  { value: "1M+",  label: "Verified physicians in network" },
  { value: "100%", label: "FDA-backed drug data" },
];

const STEPS = [
  { n: "01", title: "Build Your Health Profile",  desc: "Import records, log vitals, add medications and allergies. AI structures your lifelong health graph.", icon: FileText },
  { n: "02", title: "Chat with AI Health Agents", desc: "Ask specialized AI that has full context of your medical history — not a generic chatbot.", icon: MessageSquare },
  { n: "03", title: "Find & Book Doctors",        desc: "Search verified NPI physicians by specialty and location. Get AI-generated appointment prep.", icon: Calendar },
  { n: "04", title: "Track & Improve",            desc: "Visualize trends across vitals, wellness, and outcomes. AI surfaces insights and preventive care.", icon: TrendingUp },
];

const TESTIMONIALS = [
  { name: "Sarah M.",     role: "Patient",          rating: 5, text: "Finally a healthcare app that connects everything. My AI assistant knew about my BP trends before I mentioned it." },
  { name: "Dr. James K.", role: "Cardiologist",     rating: 5, text: "The explainable AI shows confidence scores and lists alternative diagnoses. This is how clinical AI should work." },
  { name: "Priya S.",     role: "Diabetes patient", rating: 5, text: "The medication interaction checker caught a dangerous combination my pharmacy missed. Genuinely life-changing." },
];

/* ── Pill CTA button (reused in multiple places) ─────────────────────────── */
function PillCTA({ href, children, className = "", inverted = false }: {
  href: string; children: React.ReactNode; className?: string; inverted?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const bg      = inverted ? (hovered ? "#EDEBF2" : "#fff") : (hovered ? "#7C6FA0" : "#9D93C1");
  const color   = inverted ? "#7C6FA0" : "#fff";
  const shadow  = inverted ? "none" : "0 2px 10px rgba(157,147,193,.45)";

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-150 ${className}`}
      style={{ background: bg, color, boxShadow: shadow, transform: hovered ? "translateY(-1px)" : "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Link>
  );
}

/* ── Nav ─────────────────────────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-xl border-b border-[#E3E0EA] shadow-sm" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <HelixaLogo />
          <span className="text-[17px] font-bold tracking-tight" style={{ color: "#2A2830", fontFamily: "Manrope,sans-serif" }}>
            Helixa
          </span>
        </Link>

        {/* Centre pill nav */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full" style={{ background: "#F1EFF7" }}>
          {["Features", "Specialties", "How it works"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className="px-4 py-2 text-sm font-medium rounded-full transition-all duration-150"
              style={{ color: "#636262" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#2A2830"; (e.currentTarget as HTMLElement).style.background = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#636262"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
            style={{ color: "#4A4750" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F1EFF7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            Sign in
          </Link>
          <PillCTA href="/signup">Get started free</PillCTA>
        </div>

        <button className="md:hidden p-2 rounded-lg" style={{ color: "#636262" }} onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="md:hidden bg-white border-b px-4 py-4 space-y-1" style={{ borderColor: "#E3E0EA" }}
          >
            {["Features", "Specialties", "How it works"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="block px-3 py-2.5 text-sm font-medium rounded-lg"
                style={{ color: "#636262" }}
                onClick={() => setOpen(false)}
              >
                {item}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" className="btn btn-ghost w-full justify-center rounded-full">Sign in</Link>
              <PillCTA href="/signup" className="w-full justify-center">Get started free</PillCTA>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ── Floating badge pinned on hero portrait ──────────────────────────────── */
function HeroBadge({ label, className }: { label: string; className: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.4 }}
      className={`absolute hidden lg:flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full shadow-lg ${className}`}
      style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(14px)" }}
    >
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "#EDEBF2" }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#9D93C1" }} />
      </span>
      <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#2A2830" }}>{label}</span>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#EDEBF2" }}>
      <Nav />

      {/* ────────────────────────────────────────────────────────── HERO ── */}
      <section className="pt-24 pb-5 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-4 items-stretch">

            {/* Left column */}
            <div className="flex flex-col gap-4">

              {/* Copy card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="rounded-3xl p-8 sm:p-10 flex-1 flex flex-col justify-center min-h-[340px]"
                style={{ background: "#fff" }}
              >
                {/* Pill badge */}
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 self-start"
                  style={{ background: "#F1EFF7", border: "1px solid rgba(157,147,193,.3)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#9D93C1" }} />
                  <span className="text-xs font-semibold" style={{ color: "#7C6FA0" }}>AI-Native Healthcare Platform</span>
                </div>

                <h1
                  className="font-extrabold leading-[1.08] tracking-tight mb-5"
                  style={{ color: "#2A2830", fontFamily: "Manrope,sans-serif", fontSize: "clamp(2.1rem,4vw,3.2rem)" }}
                >
                  With care for your{" "}
                  <span style={{ color: "#7C6FA0" }}>complete health</span>{" "}
                  intelligence.
                </h1>

                <p className="text-[15px] leading-relaxed mb-8 max-w-md" style={{ color: "#636262" }}>
                  Helixa unifies your lifelong health record, AI clinical agents, verified
                  physician discovery, and FDA drug data — in one interconnected platform.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <PillCTA href="/signup" className="px-6 py-3 text-base">
                    Get started free <ArrowRight className="w-4 h-4" />
                  </PillCTA>
                  <span className="text-xs" style={{ color: "#8B8894" }}>No credit card required</span>
                </div>
              </motion.div>

              {/* Bottom two cards */}
              <div className="grid grid-cols-2 gap-4" style={{ height: 220 }}>

                {/* Dashboard GIF slot */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
                  className="rounded-2xl overflow-hidden h-full"
                >
                  <ImageSlot label="Dashboard preview" mediaType="GIF" className="h-full w-full" />
                </motion.div>

                {/* Physician count card */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.5 }}
                  className="rounded-2xl p-5 flex flex-col justify-between h-full"
                  style={{ background: "#fff", border: "1px solid #E3E0EA" }}
                >
                  <div className="flex -space-x-2.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center"
                        style={{ background: i === 0 ? "#EDEBF2" : i === 1 ? "#E4E0EE" : "#F1EFF7" }}
                      >
                        <ImageIcon className="w-3.5 h-3.5" style={{ color: "#8175A8" }} />
                      </div>
                    ))}
                    <div
                      className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-bold"
                      style={{ background: "#9D93C1", color: "#fff" }}
                    >
                      +
                    </div>
                  </div>

                  <div>
                    <div className="text-3xl font-extrabold mb-0.5" style={{ color: "#2A2830", fontFamily: "Manrope,sans-serif" }}>1M+</div>
                    <div className="text-xs leading-snug" style={{ color: "#636262" }}>verified physicians ready to help</div>
                  </div>

                  <p className="text-[10px] font-medium" style={{ color: "#B3AAD0" }}>Add 3–4 physician headshot photos here</p>
                </motion.div>
              </div>
            </div>

            {/* Right: tall portrait with floating feature pills */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
              className="relative rounded-3xl overflow-hidden min-h-[480px] lg:min-h-0"
            >
              <ImageSlot
                label="Hero portrait — patient or clinician using Helixa"
                mediaType="Photo"
                className="absolute inset-0 w-full h-full"
              />
              <HeroBadge label="Real-time AI diagnostics"        className="top-5 right-5" />
              <HeroBadge label="Board-certified network"         className="top-[92px] -left-1" />
              <HeroBadge label="Explainable, evidence-backed AI" className="bottom-28 -left-1" />
              <HeroBadge label="24/7 health monitoring"          className="bottom-6 right-6" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── WHY CHOOSE ── */}
      <section className="py-16 px-4 sm:px-6" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto">

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <div className="section-label mb-3">About Helixa</div>
            <h2
              className="text-3xl sm:text-4xl font-bold mb-3"
              style={{ color: "#2A2830", fontFamily: "Manrope,sans-serif" }}
            >
              Why choose <span style={{ color: "#7C6FA0" }}>our platform?</span>
            </h2>
            <p className="max-w-lg text-[15px] leading-relaxed" style={{ color: "#636262" }}>
              Helixa is a team of specialized AI agents built on more than a decade of clinical data
              standards. Every domain interconnects automatically, so nothing about your health lives in a silo.
            </p>
          </motion.div>

          {/* Three stat cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            {WHY_STATS.map(({ value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-6"
                style={{ background: "#F7F6FA", border: "1px solid #E3E0EA" }}
              >
                <DotGrid size={36} fill="#9D93C1" ring="#CBC5D9" />
                <div
                  className="text-4xl font-extrabold mt-4 mb-1"
                  style={{ color: "#2A2830", fontFamily: "Manrope,sans-serif" }}
                >
                  {value}
                </div>
                <div className="text-sm" style={{ color: "#636262" }}>{label}</div>
              </motion.div>
            ))}
          </div>

          {/* Wide photo card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden"
            style={{ height: 220 }}
          >
            <ImageSlot
              label="Lifestyle photo — patient checking in on Helixa"
              mediaType="Photo"
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8">
              <div
                className="text-4xl font-extrabold text-white mb-1"
                style={{ fontFamily: "Manrope,sans-serif" }}
              >
                24/7
              </div>
              <div className="text-sm text-white/80">AI health monitoring, day and night</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── SPECIALTIES ── */}
      <section id="specialties" className="py-16 px-4 sm:px-6" style={{ background: "#F7F6FA" }}>
        <div className="max-w-7xl mx-auto">

          {/* Row: heading left + "View all" pill right */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex items-end justify-between gap-6 mb-8"
          >
            <div className="max-w-xl">
              <div className="section-label mb-3">Medical Specialties</div>
              <h2
                className="text-3xl sm:text-4xl font-bold mb-3"
                style={{ color: "#2A2830", fontFamily: "Manrope,sans-serif" }}
              >
                One patient. One graph.{" "}
                <span style={{ color: "#7C6FA0" }}>All specialties.</span>
              </h2>
              <p className="text-[15px] leading-relaxed" style={{ color: "#636262" }}>
                Every domain interconnects automatically — a symptom flows across dermatology,
                immunology, nutrition, and follow-up care without you lifting a finger.
              </p>
            </div>
            <PillCTA href="/signup" className="hidden sm:inline-flex whitespace-nowrap flex-shrink-0">
              View all specialties <ArrowUpRight className="w-4 h-4" />
            </PillCTA>
          </motion.div>

          {/* 3 × 2 photo grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SPECIALTIES.map(({ name, imgIndex }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              >
                <SpecialtyCard name={name} imgIndex={imgIndex} className="h-52 sm:h-60 md:h-64" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────── FEATURES ── */}
      <section id="features" className="py-16 px-4 sm:px-6" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <div className="section-label mb-3">Platform Capabilities</div>
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ color: "#2A2830", fontFamily: "Manrope,sans-serif" }}
            >
              Beyond a health app. A complete OS.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="card-hover rounded-2xl p-6"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: bg }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "#2A2830" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#636262" }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6" style={{ background: "#F7F6FA" }}>
        <div className="max-w-3xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <div className="section-label mb-3">How it Works</div>
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ color: "#2A2830", fontFamily: "Manrope,sans-serif" }}
            >
              Four steps to complete health intelligence
            </h2>
          </motion.div>

          <div className="space-y-3">
            {STEPS.map(({ n, title, desc, icon: Icon }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="card rounded-2xl p-6 flex items-start gap-5 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ background: "#EDEBF2", color: "#7C6FA0" }}
                >
                  {n}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1.5" style={{ color: "#2A2830" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#636262" }}>{desc}</p>
                </div>
                <Icon className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: "#8B8894" }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────── TESTIMONIALS ── */}
      <section className="py-16 px-4 sm:px-6" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <div className="section-label mb-3">Testimonials</div>
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ color: "#2A2830", fontFamily: "Manrope,sans-serif" }}
            >
              Trusted by patients and clinicians
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map(({ name, role, rating, text }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="card rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: "#4A4750" }}>"{text}"</p>
                <div>
                  <div className="font-semibold text-sm" style={{ color: "#2A2830" }}>{name}</div>
                  <div className="text-xs" style={{ color: "#636262" }}>{role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────── CTA ── */}
      <section
        className="py-20 px-4 sm:px-6"
        style={{ background: "linear-gradient(135deg, #9D93C1 0%, #6F5F98 100%)" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(255,255,255,.15)" }}
            >
              <Zap className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-semibold text-white">Human-in-the-Loop AI</span>
            </div>

            <h2
              className="text-4xl md:text-5xl font-extrabold text-white mb-5"
              style={{ fontFamily: "Manrope,sans-serif" }}
            >
              AI that reasons, not just answers
            </h2>

            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
              Every recommendation includes confidence scores, clinical evidence, alternative
              diagnoses, and a mandatory doctor review flag. No black-box outputs.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
              {[
                { label: "Confidence Score", value: "93%",      sub: "Per diagnosis" },
                { label: "Evidence Sources", value: "12+",      sub: "Clinical guidelines" },
                { label: "Doctor Review",    value: "Required", sub: "All diagnoses" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,.12)" }}>
                  <div
                    className="text-2xl font-bold text-white mb-1"
                    style={{ fontFamily: "Manrope,sans-serif" }}
                  >
                    {value}
                  </div>
                  <div className="text-sm font-medium text-white/90 mb-0.5">{label}</div>
                  <div className="text-xs text-white/50">{sub}</div>
                </div>
              ))}
            </div>

            <PillCTA href="/signup" inverted className="px-7 py-3.5 text-base">
              Experience Helixa <ArrowRight className="w-4 h-4" />
            </PillCTA>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────── FOOTER ── */}
      <footer className="py-10 px-4 sm:px-6" style={{ background: "#2A2830" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <HelixaLogo />
            <span className="font-bold text-white" style={{ fontFamily: "Manrope,sans-serif" }}>Helixa</span>
          </div>
          <p className="text-sm text-center" style={{ color: "rgba(255,255,255,.4)" }}>
            For informational purposes only. Not a substitute for professional medical advice.
          </p>
          <span className="text-sm" style={{ color: "rgba(255,255,255,.35)" }}>© 2026 Helixa</span>
        </div>
      </footer>
    </div>
  );
}
