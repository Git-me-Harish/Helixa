"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity, Calendar, Upload, Syringe, ClipboardList,
  Layers, Pill, Heart, MessageSquare, Search, ChevronRight,
  Clock, LayoutList,
} from "lucide-react";
import api from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { QUERY_KEYS } from "@/lib/queryKeys";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface TimelineEvent {
  id: string;
  type: "vital" | "medication" | "appointment" | "document" | "vaccination"
      | "symptom" | "soap_note" | "treatment_plan" | "chat";
  title: string;
  subtitle: string;
  date: string;
  meta?: Record<string, string | number | null>;
  href?: string;
}

/* ── Type config — brand-aligned, no flashy neons ───────────────────────────── */
const TYPE_CONFIG = {
  vital:          { label: "Vital Signs",     Icon: Activity,      color: "#2563eb", bg: "#EFF6FF", border: "#BFDBFE" },
  medication:     { label: "Medication",      Icon: Pill,          color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  appointment:    { label: "Appointment",     Icon: Calendar,      color: "#7C6FA0", bg: "#EDEBF2", border: "#CBC5D9" },
  document:       { label: "Document",        Icon: Upload,        color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
  vaccination:    { label: "Vaccination",     Icon: Syringe,       color: "#0D9488", bg: "#F0FDFA", border: "#99F6E4" },
  symptom:        { label: "Symptom",         Icon: Heart,         color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  soap_note:      { label: "Clinical Note",   Icon: ClipboardList, color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
  treatment_plan: { label: "Treatment Plan",  Icon: Layers,        color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
  chat:           { label: "AI Consultation", Icon: MessageSquare, color: "#9D93C1", bg: "#EDEBF2", border: "#CBC5D9" },
} as const;

const ALL_TYPES = Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>;

/* ── Data fetcher ───────────────────────────────────────────────────────────── */
async function fetchAllData(): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  const [vitals, meds, appts, docs, vaccs, symptoms, soapNotes, treatPlans, chatSessions] =
    await Promise.allSettled([
      api.get("/api/records/vitals?limit=50").then(r => r.data).catch(() => []),
      api.get("/api/records/medications").then(r => r.data).catch(() => []),
      api.get("/api/appointments").then(r => r.data).catch(() => []),
      api.get("/api/documents").then(r => r.data).catch(() => []),
      api.get("/api/vaccinations").then(r => r.data).catch(() => []),
      api.get("/api/symptoms?limit=50").then(r => r.data).catch(() => []),
      api.get("/api/soap-notes?limit=30").then(r => r.data).catch(() => []),
      api.get("/api/treatment-plans").then(r => r.data).catch(() => []),
      api.get("/api/chat/sessions").then(r => r.data).catch(() => []),
    ]);

  if (vitals.status === "fulfilled") {
    for (const v of vitals.value) {
      const parts = [];
      if (v.bp_systolic && v.bp_diastolic) parts.push(`BP ${v.bp_systolic}/${v.bp_diastolic} mmHg`);
      if (v.heart_rate) parts.push(`HR ${v.heart_rate} bpm`);
      if (v.spo2_pct) parts.push(`SpO₂ ${v.spo2_pct}%`);
      events.push({ id: v.id, type: "vital", title: "Vitals Recorded",
        subtitle: parts.join(" · ") || "Logged", date: v.recorded_at, href: "/records" });
    }
  }
  if (meds.status === "fulfilled") {
    for (const m of meds.value) {
      events.push({ id: m.id, type: "medication",
        title: m.is_active ? "Medication Started" : "Medication",
        subtitle: `${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.frequency ? ` · ${m.frequency}` : ""}`,
        date: m.start_date ? `${m.start_date}T00:00:00Z` : m.created_at, href: "/records" });
    }
  }
  if (appts.status === "fulfilled") {
    for (const a of appts.value) {
      events.push({ id: a.id, type: "appointment",
        title: `Appointment — ${a.speciality || "General"}`,
        subtitle: `Dr. ${a.doctor_name}${a.location ? ` · ${a.location}` : ""}`,
        date: a.appointment_dt, href: "/appointments" });
    }
  }
  if (docs.status === "fulfilled") {
    for (const d of docs.value) {
      events.push({ id: d.id, type: "document", title: "Document Uploaded",
        subtitle: d.original_filename, date: d.uploaded_at, href: "/documents" });
    }
  }
  if (vaccs.status === "fulfilled") {
    for (const v of vaccs.value) {
      events.push({ id: v.id, type: "vaccination", title: v.vaccine_name,
        subtitle: [v.dose_number ? `Dose ${v.dose_number}` : null, v.administered_by, v.status]
          .filter(Boolean).join(" · "),
        date: v.administered_date ? `${v.administered_date}T00:00:00Z` : v.created_at,
        href: "/vaccinations" });
    }
  }
  if (symptoms.status === "fulfilled") {
    for (const s of symptoms.value) {
      events.push({ id: s.id, type: "symptom", title: s.symptom,
        subtitle: `Severity ${s.severity}/10${s.duration ? ` · ${s.duration}` : ""}`,
        date: s.logged_at, href: "/symptoms" });
    }
  }
  if (soapNotes.status === "fulfilled") {
    for (const n of soapNotes.value) {
      events.push({ id: n.id, type: "soap_note",
        title: n.chief_complaint || "Clinical Visit",
        subtitle: [n.provider_name, ...(n.icd10_codes ?? []).slice(0, 2)].filter(Boolean).join(" · "),
        date: n.visit_date ? `${n.visit_date}T00:00:00Z` : n.created_at, href: "/clinical-notes" });
    }
  }
  if (treatPlans.status === "fulfilled") {
    for (const p of treatPlans.value) {
      events.push({ id: p.id, type: "treatment_plan", title: p.title,
        subtitle: `${p.condition} · ${p.status}`,
        date: p.start_date ? `${p.start_date}T00:00:00Z` : p.created_at, href: "/treatment-plans" });
    }
  }
  if (chatSessions.status === "fulfilled") {
    for (const s of chatSessions.value) {
      events.push({ id: s.id, type: "chat",
        title: s.title || "AI Health Consultation",
        subtitle: "Helixa AI Chat",
        date: s.last_updated || s.created_at, href: "/chat" });
    }
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return events;
}

/* ── Safe date formatter ────────────────────────────────────────────────────── */
function safeDate(d: string, mode: "date" | "datetime" = "date") {
  try { return mode === "date" ? formatDate(d) : formatDateTime(d); }
  catch { return ""; }
}

/* ── Loading skeleton ───────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-8">
      {[0, 1].map(g => (
        <div key={g}>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-4 w-24 rounded-lg animate-pulse" style={{ background: "#E3E0EA" }} />
            <div className="flex-1 h-px" style={{ background: "#E3E0EA" }} />
            <div className="h-3 w-12 rounded animate-pulse" style={{ background: "#E3E0EA" }} />
          </div>
          <div className="space-y-3 pl-14">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "#F7F6FA", animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function TimelinePage() {
  const [search, setSearch]           = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(ALL_TYPES));

  const { data: events = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.timeline(),
    queryFn: fetchAllData,
  });

  const toggleType = (t: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const allSelected = activeTypes.size === ALL_TYPES.length;

  const filtered = events.filter(e => {
    if (!activeTypes.has(e.type)) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.title.toLowerCase().includes(q) || e.subtitle.toLowerCase().includes(q);
    }
    return true;
  });

  /* Group by month-year */
  const groups: Record<string, TimelineEvent[]> = {};
  for (const e of filtered) {
    const d   = new Date(e.date);
    const key = isNaN(d.getTime()) ? "Unknown" : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }

  /* Per-type counts for the stats row */
  const typeCounts: Record<string, number> = {};
  for (const e of events) typeCounts[e.type] = (typeCounts[e.type] ?? 0) + 1;

  return (
    <div className="min-h-screen" style={{ background: "#FAFAFC" }}>
      <div className="max-w-3xl mx-auto px-4 py-8 md:px-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "#2A2830" }}>
                Health Timeline
              </h1>
              <p className="text-sm" style={{ color: "#8B8894" }}>
                Your complete health history — all in one chronological view
              </p>
            </div>
            {!isLoading && events.length > 0 && (
              <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: "#EDEBF2", border: "1px solid #E3E0EA" }}>
                <LayoutList className="w-3.5 h-3.5" style={{ color: "#7C6FA0" }} />
                <span className="text-xs font-semibold" style={{ color: "#7C6FA0" }}>
                  {events.length} events
                </span>
              </div>
            )}
          </div>

          {/* Stats strip */}
          {!isLoading && events.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mt-5 flex flex-wrap gap-2">
              {ALL_TYPES.filter(t => (typeCounts[t] ?? 0) > 0).map(t => {
                const cfg = TYPE_CONFIG[t];
                const Icon = cfg.Icon;
                return (
                  <div key={t} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                    <Icon className="w-3 h-3" />
                    <span>{typeCounts[t]}</span>
                    <span className="opacity-70">{cfg.label}</span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </motion.div>

        {/* ── Search + Filter ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-6 space-y-3">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "#8B8894" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search events, conditions, doctors…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "#fff",
                border: "1px solid #E3E0EA",
                color: "#2A2830",
                boxShadow: "0 1px 3px rgba(15,23,42,.04)",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "#9D93C1"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(157,147,193,.15)"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "#E3E0EA"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,.04)"; }}
            />
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {/* All toggle */}
            <button
              onClick={() => setActiveTypes(new Set(allSelected ? [] : ALL_TYPES))}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
              style={{
                background: allSelected ? "#9D93C1" : "#fff",
                color:      allSelected ? "#fff"    : "#4A4750",
                border:     `1px solid ${allSelected ? "#9D93C1" : "#E3E0EA"}`,
                boxShadow:  allSelected ? "0 2px 8px rgba(157,147,193,.3)" : "none",
              }}>
              All
            </button>

            {ALL_TYPES.map(t => {
              const cfg    = TYPE_CONFIG[t];
              const Icon   = cfg.Icon;
              const active = activeTypes.has(t);
              return (
                <button key={t} onClick={() => toggleType(t)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                  style={{
                    background:  active ? cfg.bg   : "#fff",
                    color:       active ? cfg.color : "#8B8894",
                    border:      `1px solid ${active ? cfg.border : "#E3E0EA"}`,
                    boxShadow:   active ? `0 2px 6px ${cfg.border}80` : "none",
                  }}>
                  <Icon className="w-3 h-3" />{cfg.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {isLoading && <Skeleton />}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!isLoading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "#EDEBF2" }}>
              <Clock className="w-7 h-7" style={{ color: "#9D93C1" }} />
            </div>
            <p className="font-semibold mb-1.5" style={{ color: "#2A2830" }}>
              {search ? `No results for "${search}"` : "No health events yet"}
            </p>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: "#8B8894" }}>
              {search
                ? "Try a different search term or clear the filters above."
                : "Start logging vitals, medications, or appointments to build your health history."}
            </p>
          </motion.div>
        )}

        {/* ── Timeline groups ────────────────────────────────────────────── */}
        {!isLoading && Object.entries(groups).map(([monthYear, monthEvents], gi) => (
          <motion.div key={monthYear}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10">

            {/* Month header */}
            <div className="flex items-center gap-3 mb-5 sticky top-0 z-10 py-2"
              style={{ background: "#FAFAFC" }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#9D93C1" }} />
                <span className="text-sm font-bold" style={{ color: "#2A2830" }}>{monthYear}</span>
              </div>
              <div className="flex-1 h-px" style={{ background: "#E3E0EA" }} />
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "#EDEBF2", color: "#7C6FA0" }}>
                {monthEvents.length} event{monthEvents.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Events */}
            <div className="relative">
              {/* Vertical track */}
              <div className="absolute top-0 bottom-0"
                style={{ left: "19px", width: "2px", background: "linear-gradient(to bottom, #CBC5D9, #E3E0EA)" }} />

              <div className="space-y-2.5">
                {monthEvents.map((event, i) => {
                  const cfg  = TYPE_CONFIG[event.type];
                  const Icon = cfg.Icon;
                  const CardContent = (
                    <div className="group flex items-start gap-4">
                      {/* Icon dot */}
                      <div className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                        style={{
                          background:  cfg.bg,
                          border:      `1.5px solid ${cfg.border}`,
                          boxShadow:   `0 2px 8px ${cfg.border}60`,
                        }}>
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>

                      {/* Card body */}
                      <div className="flex-1 min-w-0 rounded-xl transition-all"
                        style={{
                          background: "#fff",
                          border: "1px solid #E3E0EA",
                          boxShadow: "0 1px 4px rgba(15,23,42,.05)",
                          padding: "10px 14px",
                          borderLeft: `3px solid ${cfg.color}28`,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = cfg.border;
                          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 12px rgba(15,23,42,.08)`;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "#E3E0EA";
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(15,23,42,.05)";
                        }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                                style={{ background: cfg.bg, color: cfg.color }}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-sm font-semibold truncate mt-1" style={{ color: "#2A2830" }}>
                              {event.title}
                            </p>
                            {event.subtitle && (
                              <p className="text-xs truncate mt-0.5" style={{ color: "#636262" }}>
                                {event.subtitle}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                            <span className="text-xs font-medium" style={{ color: "#8B8894" }}>
                              {safeDate(event.date)}
                            </span>
                            {event.href && (
                              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: cfg.color }} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                  return (
                    <motion.div key={event.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: gi * 0.04 + i * 0.025, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                      {event.href
                        ? <Link href={event.href} className="block">{CardContent}</Link>
                        : CardContent}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Bottom padding */}
        <div className="h-12" />
      </div>
    </div>
  );
}
