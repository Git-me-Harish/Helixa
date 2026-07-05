"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Brain, Activity, Shield, Stethoscope, Pill, Microscope,
  BarChart2, ChevronRight, Menu, X, Check, ArrowRight, Zap,
  Calendar, FileText, MessageSquare, Star, Users, TrendingUp, Clock
} from "lucide-react";

/* ── Logo ─────────────────────────────────────────────────────────────────── */
function HelixaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="#0284c7"/>
      <path d="M8 16C8 11.582 11.582 8 16 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 16C24 20.418 20.418 24 16 24" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="3.5" fill="#fff"/>
    </svg>
  );
}

/* ── Hero Illustration ────────────────────────────────────────────────────── */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 520 440" fill="none" className="w-full h-full max-h-[480px]">
      <rect x="20" y="20" width="480" height="400" rx="24" fill="white"/>
      <rect x="20" y="20" width="480" height="400" rx="24" stroke="#e2e8f0" strokeWidth="1.5"/>
      {/* Top bar */}
      <rect x="20" y="20" width="480" height="52" rx="24" fill="#f8fafc"/>
      <rect x="20" y="48" width="480" height="24" fill="#f8fafc"/>
      <circle cx="54" cy="46" r="14" fill="#e0f2fe"/>
      <path d="M49 46C49 43.24 51.24 41 54 41" stroke="#0284c7" strokeWidth="2" strokeLinecap="round"/>
      <path d="M59 46C59 48.76 56.76 51 54 51" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="54" cy="46" r="3" fill="#0284c7"/>
      <rect x="76" y="39" width="64" height="7" rx="3.5" fill="#0f172a"/>
      <rect x="76" y="51" width="44" height="5.5" rx="2.75" fill="#94a3b8"/>
      {/* Score ring */}
      <circle cx="392" cy="140" r="52" fill="#f0f9ff" stroke="#e0f2fe" strokeWidth="2"/>
      <circle cx="392" cy="140" r="38" fill="none" stroke="#e2e8f0" strokeWidth="8"/>
      <circle cx="392" cy="140" r="38" fill="none" stroke="#0284c7" strokeWidth="8"
        strokeDasharray="180 60" strokeLinecap="round" transform="rotate(-90 392 140)"/>
      <text x="392" y="136" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0284c7">82</text>
      <text x="392" y="153" textAnchor="middle" fontSize="10" fill="#64748b">Health Score</text>
      {/* Vital cards */}
      <rect x="42" y="90" width="110" height="58" rx="12" fill="#ecfdf5" stroke="#a7f3d0"/>
      <text x="50" y="108" fontSize="9" fill="#64748b" fontWeight="500">HEART RATE</text>
      <text x="50" y="130" fontSize="22" fontWeight="700" fill="#059669">72</text>
      <text x="80" y="138" fontSize="9" fill="#059669">bpm</text>
      <path d="M84 122 L88 116 L93 127 L97 112 L102 122" stroke="#059669" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <rect x="163" y="90" width="110" height="58" rx="12" fill="#eff6ff" stroke="#bfdbfe"/>
      <text x="171" y="108" fontSize="9" fill="#64748b" fontWeight="500">BLOOD PRESSURE</text>
      <text x="171" y="130" fontSize="18" fontWeight="700" fill="#2563eb">118/76</text>
      <text x="171" y="143" fontSize="9" fill="#2563eb">mmHg · Normal</text>
      <rect x="284" y="90" width="90" height="58" rx="12" fill="#fffbeb" stroke="#fde68a"/>
      <text x="292" y="108" fontSize="9" fill="#64748b" fontWeight="500">GLUCOSE</text>
      <text x="292" y="130" fontSize="22" fontWeight="700" fill="#d97706">5.4</text>
      <text x="316" y="138" fontSize="9" fill="#d97706">mmol/L</text>
      {/* Chart */}
      <rect x="42" y="165" width="316" height="108" rx="12" fill="white" stroke="#e2e8f0"/>
      <text x="56" y="184" fontSize="9" fill="#64748b" fontWeight="600">VITAL TRENDS · 30 DAYS</text>
      <polyline points="56,255 90,240 130,248 170,235 210,244 250,230 290,238 328,232 358,235"
        stroke="#0284c7" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="56,265 90,258 130,262 170,252 210,258 250,246 290,254 328,244 358,248"
        stroke="#0d9488" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      {/* Meds */}
      <rect x="42" y="290" width="220" height="86" rx="12" fill="white" stroke="#e2e8f0"/>
      <text x="56" y="308" fontSize="9" fill="#64748b" fontWeight="600">ACTIVE MEDICATIONS</text>
      <rect x="56" y="316" width="92" height="22" rx="11" fill="#e0f2fe"/>
      <text x="102" y="331" textAnchor="middle" fontSize="10" fill="#0369a1" fontWeight="500">Metformin 500mg</text>
      <rect x="156" y="316" width="92" height="22" rx="11" fill="#ecfdf5"/>
      <text x="202" y="331" textAnchor="middle" fontSize="10" fill="#059669" fontWeight="500">Atorvastatin 20mg</text>
      <rect x="56" y="346" width="80" height="22" rx="11" fill="#fef3c7"/>
      <text x="96" y="361" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="500">Aspirin 75mg</text>
      {/* AI insight */}
      <rect x="278" y="290" width="216" height="86" rx="12" fill="#f0f9ff" stroke="#bfdbfe"/>
      <circle cx="298" cy="312" r="10" fill="#0284c7"/>
      <path d="M295 312 L298 309 L301 312 L298 315Z" fill="white"/>
      <text x="314" y="308" fontSize="9" fill="#0369a1" fontWeight="600">AI HEALTH INSIGHT</text>
      <text x="298" y="327" fontSize="9" fill="#334155">Your BP trend shows 8% improvement</text>
      <text x="298" y="341" fontSize="9" fill="#334155">over the past 30 days. Keep up the</text>
      <text x="298" y="355" fontSize="9" fill="#334155">current lifestyle changes.</text>
      <text x="298" y="370" fontSize="9" fill="#2563eb" fontWeight="500">View full analysis →</text>
    </svg>
  );
}

/* ── Data ─────────────────────────────────────────────────────────────────── */
const SPECIALTIES = [
  { name:"Cardiology",     icon:Heart,       color:"#dc2626", bg:"#fef2f2",  desc:"Heart & cardiovascular care" },
  { name:"Neurology",      icon:Brain,       color:"#7c3aed", bg:"#f5f3ff",  desc:"Brain & nervous system" },
  { name:"Orthopedics",    icon:Activity,    color:"#0284c7", bg:"#e0f2fe",  desc:"Bones, joints & muscles" },
  { name:"Dermatology",    icon:Shield,      color:"#d97706", bg:"#fffbeb",  desc:"Skin, hair & nails" },
  { name:"General Practice",icon:Stethoscope,color:"#059669", bg:"#ecfdf5", desc:"Primary & preventive care" },
  { name:"Pharmacy",       icon:Pill,        color:"#0891b2", bg:"#ecfeff",  desc:"FDA drug information" },
  { name:"Lab & Diagnostics",icon:Microscope,color:"#6366f1", bg:"#eef2ff", desc:"Tests & lab results" },
  { name:"Health Analytics",icon:BarChart2,  color:"#0d9488", bg:"#ccfbf1",  desc:"Trends & insights" },
];

const FEATURES = [
  { icon:Activity,    color:"#0284c7", bg:"#e0f2fe", title:"Longitudinal Health Record",
    desc:"Your complete health timeline from birth — vitals, diagnoses, medications, and outcomes all in one interconnected graph." },
  { icon:Brain,       color:"#7c3aed", bg:"#f5f3ff", title:"Specialized AI Agents",
    desc:"AI for cardiology, dermatology, nutrition, mental health, and more — working together like a hospital department team." },
  { icon:Stethoscope, color:"#059669", bg:"#ecfdf5", title:"NPI Doctor Discovery",
    desc:"Find verified physicians from the US National Provider Identifier registry. Filter by specialty, state, and name." },
  { icon:Pill,        color:"#0891b2", bg:"#ecfeff", title:"FDA Pharmacy Intelligence",
    desc:"Real drug data from OpenFDA — indications, dosing, warnings, interactions, and contraindications for every medication." },
  { icon:Shield,      color:"#d97706", bg:"#fffbeb", title:"Explainable AI",
    desc:"Every recommendation shows a confidence score, supporting evidence, alternative diagnoses, and required doctor review." },
  { icon:BarChart2,   color:"#0d9488", bg:"#ccfbf1", title:"Predictive Analytics",
    desc:"Trend analysis across vitals, lifestyle, and medical history to surface risk factors before they escalate." },
];

const STATS = [
  { value:"20+",  label:"Medical Specialties",  icon:Stethoscope },
  { value:"1M+",  label:"Verified Physicians",   icon:Users },
  { value:"100%", label:"FDA-backed Drug Data",  icon:Pill },
  { value:"24/7", label:"AI Health Monitoring",  icon:Clock },
];

const STEPS = [
  { n:"01", title:"Build Your Health Profile",  desc:"Import records, log vitals, add medications and allergies. AI structures your lifelong health graph.", icon:FileText },
  { n:"02", title:"Chat with AI Health Agents", desc:"Ask specialized AI that has full context of your medical history — not a generic chatbot.", icon:MessageSquare },
  { n:"03", title:"Find & Book Doctors",         desc:"Search verified NPI physicians by specialty and location. Get AI-generated appointment prep.", icon:Calendar },
  { n:"04", title:"Track & Improve",             desc:"Visualize trends across vitals, wellness, and outcomes. AI surfaces insights and preventive care.", icon:TrendingUp },
];

const TESTIMONIALS = [
  { name:"Sarah M.",    role:"Patient",           rating:5, text:"Finally a healthcare app that connects everything. My AI assistant knew about my BP trends before I mentioned it." },
  { name:"Dr. James K.", role:"Cardiologist",     rating:5, text:"The explainable AI shows confidence scores and lists alternative diagnoses. This is how clinical AI should work." },
  { name:"Priya S.",    role:"Diabetes patient",  rating:5, text:"The medication interaction checker caught a dangerous combination my pharmacy missed. Genuinely life-changing." },
];

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
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-white/90 backdrop-blur-xl border-b border-[#e2e8f0] shadow-sm" : ""
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <HelixaLogo/>
          <span className="text-xl font-bold" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,Inter,sans-serif"}}>Helixa</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {["Features","Specialties","How it works"].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g,"-")}`}
              className="px-3.5 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{color:"#64748b"}}
              onMouseEnter={e=>{e.currentTarget.style.color="#0f172a";e.currentTarget.style.background="#f1f5f9";}}
              onMouseLeave={e=>{e.currentTarget.style.color="#64748b";e.currentTarget.style.background="transparent";}}>
              {item}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">Get started free</Link>
        </div>

        <button className="md:hidden p-2 rounded-lg" style={{color:"#64748b"}} onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="md:hidden bg-white border-b px-4 py-4 space-y-1" style={{borderColor:"#e2e8f0"}}>
            {["Features","Specialties","How it works"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g,"-")}`}
                className="block px-3 py-2.5 text-sm font-medium rounded-lg" style={{color:"#64748b"}}
                onClick={() => setOpen(false)}>{item}</a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" className="btn btn-ghost w-full justify-center">Sign in</Link>
              <Link href="/signup" className="btn btn-primary w-full justify-center">Get started free</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav/>

      {/* Hero */}
      <section className="pt-28 pb-20 bg-mesh overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.6}}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
                style={{background:"#e0f2fe",border:"1px solid rgba(2,132,199,.2)"}}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] animate-pulse"/>
                <span className="text-xs font-semibold" style={{color:"#0284c7"}}>AI-Native Healthcare Platform</span>
              </div>

              <h1 className="text-5xl lg:text-[62px] font-extrabold leading-[1.08] tracking-tight mb-6"
                style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,Inter,sans-serif"}}>
                Your Complete<br/>
                <span style={{background:"linear-gradient(135deg, #0284c7 0%, #0d9488 100%)",
                  WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                  Health Intelligence
                </span><br/>
                Ecosystem
              </h1>

              <p className="text-lg leading-relaxed mb-8 max-w-xl" style={{color:"#64748b"}}>
                Helixa unifies your lifelong health record, AI-powered clinical agents, real physician discovery,
                FDA drug data, and predictive analytics — in one interconnected platform.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Link href="/signup" className="btn btn-primary btn-lg">
                  Start for free <ArrowRight className="w-4 h-4"/>
                </Link>
                <Link href="/login" className="btn btn-ghost btn-lg">Sign in</Link>
              </div>

              <div className="flex flex-wrap gap-5 text-sm" style={{color:"#64748b"}}>
                {["No credit card","HIPAA-aligned","Free forever plan"].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Check className="w-4 h-4" style={{color:"#059669"}}/>{t}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{opacity:0,x:24}} animate={{opacity:1,x:0}} transition={{duration:.7,delay:.15}}
              className="relative hidden lg:block">
              <div className="absolute -inset-8 rounded-3xl" style={{
                background:"radial-gradient(ellipse at 50% 50%, rgba(2,132,199,.08) 0%, transparent 70%)"
              }}/>
              <HeroIllustration/>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y bg-white" style={{borderColor:"#e2e8f0"}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label, icon:Icon }, i) => (
              <motion.div key={label} initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}}
                viewport={{once:true}} transition={{delay:i*.07}} className="text-center p-4">
                <Icon className="w-5 h-5 mx-auto mb-2" style={{color:"#0284c7"}}/>
                <div className="text-3xl font-extrabold mb-1" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>{value}</div>
                <div className="text-sm" style={{color:"#64748b"}}>{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section id="specialties" className="py-20" style={{background:"#f0f4f8"}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="mb-12 text-center">
            <div className="section-label mb-3">Medical Specialties</div>
            <h2 className="text-4xl font-bold mb-4" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
              One patient. One graph. All specialties.
            </h2>
            <p className="max-w-xl mx-auto" style={{color:"#64748b"}}>
              Every domain interconnects automatically — a symptom flows across dermatology, immunology, nutrition, and follow-up care.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SPECIALTIES.map(({ name, icon:Icon, color, bg, desc }, i) => (
              <motion.div key={name} initial={{opacity:0,scale:.95}} whileInView={{opacity:1,scale:1}}
                viewport={{once:true}} transition={{delay:i*.05}}
                className="card-hover p-5 cursor-pointer group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                  style={{background:bg}}>
                  <Icon className="w-5 h-5" style={{color}}/>
                </div>
                <div className="font-semibold text-sm mb-1" style={{color:"#0f172a"}}>{name}</div>
                <div className="text-xs line-clamp-2 mb-3" style={{color:"#64748b"}}>{desc}</div>
                <div className="flex items-center gap-1 text-xs font-medium" style={{color}}>
                  Explore <ChevronRight className="w-3.5 h-3.5"/>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="mb-14 text-center">
            <div className="section-label mb-3">Platform Capabilities</div>
            <h2 className="text-4xl font-bold" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
              Beyond a health app. A complete OS.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon:Icon, color, bg, title, desc }, i) => (
              <motion.div key={title} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}}
                viewport={{once:true}} transition={{delay:i*.07}}
                className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{background:bg}}>
                  <Icon className="w-6 h-6" style={{color}}/>
                </div>
                <h3 className="font-semibold mb-2" style={{color:"#0f172a"}}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{color:"#64748b"}}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20" style={{background:"#f0f4f8"}}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="mb-12 text-center">
            <div className="section-label mb-3">How it Works</div>
            <h2 className="text-4xl font-bold" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
              Four steps to complete health intelligence
            </h2>
          </motion.div>

          <div className="space-y-4">
            {STEPS.map(({ n, title, desc, icon:Icon }, i) => (
              <motion.div key={n} initial={{opacity:0,x:-16}} whileInView={{opacity:1,x:0}}
                viewport={{once:true}} transition={{delay:i*.08}}
                className="card p-6 flex items-start gap-5 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{background:"#e0f2fe",color:"#0284c7"}}>
                  {n}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1.5" style={{color:"#0f172a"}}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{color:"#64748b"}}>{desc}</p>
                </div>
                <Icon className="w-5 h-5 flex-shrink-0 mt-1" style={{color:"#94a3b8"}}/>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="mb-12 text-center">
            <div className="section-label mb-3">Testimonials</div>
            <h2 className="text-4xl font-bold" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
              Trusted by patients and clinicians
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, rating, text }, i) => (
              <motion.div key={name} initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}}
                viewport={{once:true}} transition={{delay:i*.08}} className="card p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({length:rating}).map((_,j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400"/>
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{color:"#334155"}}>"{text}"</p>
                <div>
                  <div className="font-semibold text-sm" style={{color:"#0f172a"}}>{name}</div>
                  <div className="text-xs" style={{color:"#64748b"}}>{role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA gradient */}
      <section className="py-20" style={{background:"linear-gradient(135deg, #0284c7 0%, #0d9488 100%)"}}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
              style={{background:"rgba(255,255,255,.15)"}}>
              <Zap className="w-3.5 h-3.5 text-white"/>
              <span className="text-xs font-semibold text-white">Human-in-the-Loop AI</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5"
              style={{fontFamily:"Plus Jakarta Sans,sans-serif"}}>
              AI that reasons, not just answers
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
              Every recommendation includes confidence scores, clinical evidence, alternative diagnoses,
              and a mandatory doctor review flag. No black-box outputs.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
              {[
                { label:"Confidence Score", value:"93%",       sub:"Per diagnosis" },
                { label:"Evidence Sources", value:"12+",       sub:"Clinical guidelines" },
                { label:"Doctor Review",    value:"Required",  sub:"All diagnoses" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="rounded-2xl p-5" style={{background:"rgba(255,255,255,.12)"}}>
                  <div className="text-2xl font-bold text-white mb-1" style={{fontFamily:"Plus Jakarta Sans,sans-serif"}}>{value}</div>
                  <div className="text-sm font-medium text-white/90 mb-0.5">{label}</div>
                  <div className="text-xs text-white/50">{sub}</div>
                </div>
              ))}
            </div>
            <Link href="/signup" className="btn btn-lg inline-flex" style={{background:"white",color:"#0284c7"}}>
              Experience Helixa <ArrowRight className="w-4 h-4"/>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{background:"#0f172a"}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <HelixaLogo/>
            <span className="font-bold text-white" style={{fontFamily:"Plus Jakarta Sans,sans-serif"}}>Helixa</span>
          </div>
          <p className="text-sm text-center" style={{color:"rgba(255,255,255,.35)"}}>
            For informational purposes only. Not a substitute for professional medical advice.
          </p>
          <span className="text-sm" style={{color:"rgba(255,255,255,.3)"}}>© 2026 Helixa</span>
        </div>
      </footer>
    </div>
  );
}
