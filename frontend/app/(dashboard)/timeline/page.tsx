"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity, Calendar, FileText, Upload, Syringe, ClipboardList,
  Layers, Pill, Heart, MessageSquare, Search, Filter
} from "lucide-react";
import api from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { QUERY_KEYS } from "@/lib/queryKeys";

interface TimelineEvent {
  id: string;
  type: "vital" | "medication" | "appointment" | "document" | "vaccination" | "symptom" | "soap_note" | "treatment_plan" | "chat";
  title: string;
  subtitle: string;
  date: string;
  meta?: Record<string, string | number | null>;
  color: string;
  bg: string;
  href?: string;
}

const TYPE_CONFIG = {
  vital:          { label: "Vital Signs",     icon: Activity,      color: "#0284c7", bg: "#e0f2fe"  },
  medication:     { label: "Medication",      icon: Pill,          color: "#0d9488", bg: "#ccfbf1"  },
  appointment:    { label: "Appointment",     icon: Calendar,      color: "#7c3aed", bg: "#f5f3ff"  },
  document:       { label: "Document",        icon: Upload,        color: "#d97706", bg: "#fffbeb"  },
  vaccination:    { label: "Vaccination",     icon: Syringe,       color: "#059669", bg: "#ecfdf5"  },
  symptom:        { label: "Symptom",         icon: Heart,         color: "#dc2626", bg: "#fef2f2"  },
  soap_note:      { label: "Clinical Note",   icon: ClipboardList, color: "#6366f1", bg: "#eef2ff"  },
  treatment_plan: { label: "Treatment Plan",  icon: Layers,        color: "#0891b2", bg: "#ecfeff"  },
  chat:           { label: "AI Consultation", icon: MessageSquare, color: "#8b5cf6", bg: "#f5f3ff"  },
};

async function fetchAllData(): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  const [vitals, meds, appts, docs, vaccs, symptoms, soapNotes, treatPlans, chatSessions] = await Promise.allSettled([
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
      events.push({
        id: v.id, type: "vital",
        title: "Vitals Recorded",
        subtitle: parts.join(" · ") || "Logged",
        date: v.recorded_at, color: "#0284c7", bg: "#e0f2fe", href: "/records",
      });
    }
  }

  if (meds.status === "fulfilled") {
    for (const m of meds.value) {
      events.push({
        id: m.id, type: "medication",
        title: m.is_active ? "Medication Started" : "Medication",
        subtitle: `${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.frequency ? ` · ${m.frequency}` : ""}`,
        date: m.start_date ? `${m.start_date}T00:00:00Z` : m.created_at,
        color: "#0d9488", bg: "#ccfbf1", href: "/records",
      });
    }
  }

  if (appts.status === "fulfilled") {
    for (const a of appts.value) {
      events.push({
        id: a.id, type: "appointment",
        title: `Appointment — ${a.speciality || "General"}`,
        subtitle: `Dr. ${a.doctor_name}${a.location ? ` · ${a.location}` : ""}`,
        date: a.appointment_dt, color: "#7c3aed", bg: "#f5f3ff", href: "/appointments",
      });
    }
  }

  if (docs.status === "fulfilled") {
    for (const d of docs.value) {
      events.push({
        id: d.id, type: "document",
        title: "Document Uploaded",
        subtitle: d.original_filename,
        date: d.uploaded_at, color: "#d97706", bg: "#fffbeb", href: "/documents",
      });
    }
  }

  if (vaccs.status === "fulfilled") {
    for (const v of vaccs.value) {
      events.push({
        id: v.id, type: "vaccination",
        title: v.vaccine_name,
        subtitle: [v.dose_number ? `Dose ${v.dose_number}` : null, v.administered_by, v.status].filter(Boolean).join(" · "),
        date: v.administered_date ? `${v.administered_date}T00:00:00Z` : v.created_at,
        color: "#059669", bg: "#ecfdf5", href: "/vaccinations",
      });
    }
  }

  if (symptoms.status === "fulfilled") {
    for (const s of symptoms.value) {
      events.push({
        id: s.id, type: "symptom",
        title: s.symptom,
        subtitle: `Severity ${s.severity}/10${s.duration ? ` · ${s.duration}` : ""}`,
        date: s.logged_at, color: "#dc2626", bg: "#fef2f2", href: "/symptoms",
      });
    }
  }

  if (soapNotes.status === "fulfilled") {
    for (const n of soapNotes.value) {
      events.push({
        id: n.id, type: "soap_note",
        title: n.chief_complaint || "Clinical Visit",
        subtitle: [n.provider_name, ...(n.icd10_codes ?? []).slice(0, 2)].filter(Boolean).join(" · "),
        date: n.visit_date ? `${n.visit_date}T00:00:00Z` : n.created_at,
        color: "#6366f1", bg: "#eef2ff", href: "/clinical-notes",
      });
    }
  }

  if (treatPlans.status === "fulfilled") {
    for (const p of treatPlans.value) {
      events.push({
        id: p.id, type: "treatment_plan",
        title: p.title,
        subtitle: `${p.condition} · ${p.status}`,
        date: p.start_date ? `${p.start_date}T00:00:00Z` : p.created_at,
        color: "#0891b2", bg: "#ecfeff", href: "/treatment-plans",
      });
    }
  }

  if (chatSessions.status === "fulfilled") {
    for (const s of chatSessions.value) {
      events.push({
        id: s.id, type: "chat",
        title: s.title || "AI Health Consultation",
        subtitle: "Helixa AI Chat",
        date: s.last_updated || s.created_at,
        color: "#8b5cf6", bg: "#f5f3ff", href: "/chat",
      });
    }
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return events;
}

const ALL_TYPES = Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>;

export default function TimelinePage() {
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(ALL_TYPES));

  const { data: events = [], isLoading } = useQuery({ queryKey: QUERY_KEYS.timeline(), queryFn: fetchAllData });

  const toggleType = (t: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) { next.delete(t); } else { next.add(t); }
      return next;
    });
  };

  const filtered = events.filter(e => {
    if (!activeTypes.has(e.type)) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.title.toLowerCase().includes(q) || e.subtitle.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by month-year
  const groups: Record<string, TimelineEvent[]> = {};
  for (const e of filtered) {
    const d = new Date(e.date);
    const key = isNaN(d.getTime()) ? "Unknown" : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
          Health Timeline
        </h1>
        <p className="text-sm" style={{ color: "#64748b" }}>Your complete health history in chronological order</p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#94a3b8" }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search events…" className="field pl-9" />
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <button onClick={() => setActiveTypes(new Set(ALL_TYPES))}
          className="text-xs px-2.5 py-1 rounded-full border font-medium transition-all"
          style={{
            background: activeTypes.size === ALL_TYPES.length ? "#0284c7" : "#f8fafc",
            color: activeTypes.size === ALL_TYPES.length ? "white" : "#64748b",
            borderColor: activeTypes.size === ALL_TYPES.length ? "#0284c7" : "#e2e8f0",
          }}>
          All
        </button>
        {ALL_TYPES.map(t => {
          const cfg = TYPE_CONFIG[t];
          const Icon = cfg.icon;
          const active = activeTypes.has(t);
          return (
            <button key={t} onClick={() => toggleType(t)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium transition-all"
              style={{
                background: active ? cfg.bg : "#f8fafc",
                color: active ? cfg.color : "#94a3b8",
                borderColor: active ? cfg.color + "60" : "#e2e8f0",
              }}>
              <Icon className="w-3 h-3" />{cfg.label}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="flex gap-4"><div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" /><div className="flex-1 skeleton h-16 rounded-xl" /></div>)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="card py-16 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: "#e2e8f0" }} />
          <p className="font-medium mb-1" style={{ color: "#64748b" }}>No health events found</p>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            {search ? `No events match "${search}".` : "Start logging health data to build your timeline."}
          </p>
        </div>
      )}

      {!isLoading && Object.entries(groups).map(([monthYear, monthEvents]) => (
        <motion.div key={monthYear} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-sm font-bold" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>{monthYear}</div>
            <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
            <div className="text-xs" style={{ color: "#94a3b8" }}>{monthEvents.length} event{monthEvents.length > 1 ? "s" : ""}</div>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: "#e2e8f0" }} />

            <div className="space-y-3">
              {monthEvents.map((event, i) => {
                const cfg = TYPE_CONFIG[event.type];
                const Icon = cfg.icon;
                return (
                  <motion.div key={event.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * .03 }} className="flex gap-4 relative">
                    {/* Dot on line */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
                      style={{ background: cfg.bg, border: `2px solid white` }}>
                      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0 pb-3">
                      {event.href ? (
                        <Link href={event.href} className="block group">
                          <div className="card-hover p-3 group-hover:shadow-sm transition-all">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: "#0f172a" }}>{event.title}</p>
                                <p className="text-xs truncate mt-0.5" style={{ color: "#64748b" }}>{event.subtitle}</p>
                              </div>
                              <span className="text-xs flex-shrink-0" style={{ color: "#94a3b8" }}>
                                {(() => {
                                  try { return formatDate(event.date); } catch { return ""; }
                                })()}
                              </span>
                            </div>
                            <span className="inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded"
                              style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <div className="card p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: "#0f172a" }}>{event.title}</p>
                              <p className="text-xs truncate mt-0.5" style={{ color: "#64748b" }}>{event.subtitle}</p>
                            </div>
                            <span className="text-xs flex-shrink-0" style={{ color: "#94a3b8" }}>
                              {(() => { try { return formatDate(event.date); } catch { return ""; } })()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
