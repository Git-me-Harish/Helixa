"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, X, Edit2, Calendar, User, ChevronDown, ChevronUp, Search } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/queryKeys";

interface SOAPNote {
  id: string;
  visit_date: string;
  provider_name: string | null;
  chief_complaint: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  icd10_codes: string[] | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

const EMPTY_FORM = {
  visit_date: new Date().toISOString().split("T")[0],
  provider_name: "", chief_complaint: "", subjective: "",
  objective: "", assessment: "", plan: "",
  icd10_codes: "", follow_up_date: "",
};

async function fetchNotes(): Promise<SOAPNote[]> {
  const res = await api.get<SOAPNote[]>("/api/soap-notes");
  return res.data;
}

async function saveNote(data: typeof EMPTY_FORM, id?: string): Promise<SOAPNote> {
  const body = {
    visit_date: data.visit_date,
    provider_name: data.provider_name || null,
    chief_complaint: data.chief_complaint || null,
    subjective: data.subjective || null,
    objective: data.objective || null,
    assessment: data.assessment || null,
    plan: data.plan || null,
    icd10_codes: data.icd10_codes ? data.icd10_codes.split(",").map((c: string) => c.trim()).filter(Boolean) : null,
    follow_up_date: data.follow_up_date || null,
  };
  const res = id
    ? await api.put<SOAPNote>(`/api/soap-notes/${id}`, body)
    : await api.post<SOAPNote>("/api/soap-notes", body);
  return res.data;
}

async function deleteNote(id: string): Promise<void> {
  await api.delete(`/api/soap-notes/${id}`);
}

const SOAP_SECTIONS = [
  { key: "subjective", label: "S — Subjective", placeholder: "Patient's own description of symptoms, history, pain level...", color: "#7c3aed", bg: "#f5f3ff" },
  { key: "objective", label: "O — Objective", placeholder: "Clinical observations, vitals, physical exam findings...", color: "#0284c7", bg: "#e0f2fe" },
  { key: "assessment", label: "A — Assessment", placeholder: "Diagnosis, differential diagnoses, clinical impression...", color: "#d97706", bg: "#fffbeb" },
  { key: "plan", label: "P — Plan", placeholder: "Treatment plan, medications, referrals, follow-up...", color: "#059669", bg: "#ecfdf5" },
] as const;

function NoteModal({ note, onClose }: { note?: SOAPNote; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(note ? {
    visit_date: note.visit_date?.split("T")[0] ?? "",
    provider_name: note.provider_name ?? "",
    chief_complaint: note.chief_complaint ?? "",
    subjective: note.subjective ?? "",
    objective: note.objective ?? "",
    assessment: note.assessment ?? "",
    plan: note.plan ?? "",
    icd10_codes: (note.icd10_codes ?? []).join(", "),
    follow_up_date: note.follow_up_date?.split("T")[0] ?? "",
  } : EMPTY_FORM);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => saveNote(form, note?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.soapNotes() });
      toast.success(note ? "Note updated" : "Note created");
      onClose();
    },
    onError: () => toast.error("Failed to save"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,.4)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: .96 }} className="card w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <h2 className="font-bold text-base" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
            {note ? "Edit SOAP Note" : "New Clinical Note"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "#94a3b8" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Visit Date *</label>
              <input type="date" value={form.visit_date} onChange={e => set("visit_date", e.target.value)} className="field" />
            </div>
            <div>
              <label className="label">Provider / Clinician</label>
              <input value={form.provider_name} onChange={e => set("provider_name", e.target.value)}
                placeholder="Dr. Smith" className="field" />
            </div>
          </div>
          <div>
            <label className="label">Chief Complaint</label>
            <input value={form.chief_complaint} onChange={e => set("chief_complaint", e.target.value)}
              placeholder="Main reason for visit" className="field" />
          </div>

          {SOAP_SECTIONS.map(({ key, label, placeholder, color, bg }) => (
            <div key={key}>
              <label className="label flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {label}
              </label>
              <textarea rows={3} value={(form as Record<string, string>)[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder} className="field resize-none"
                style={{ borderLeftWidth: 3, borderLeftColor: color }} />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">ICD-10 Codes <span className="font-normal text-[#94a3b8]">(comma-separated)</span></label>
              <input value={form.icd10_codes} onChange={e => set("icd10_codes", e.target.value)}
                placeholder="J06.9, Z00.00" className="field" />
            </div>
            <div>
              <label className="label">Follow-up Date</label>
              <input type="date" value={form.follow_up_date} onChange={e => set("follow_up_date", e.target.value)} className="field" />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
            <button onClick={() => form.visit_date && mutation.mutate()}
              disabled={!form.visit_date || mutation.isPending} className="btn btn-primary flex-1">
              {mutation.isPending ? "Saving..." : note ? "Update Note" : "Create Note"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete }: { note: SOAPNote; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const sections = SOAP_SECTIONS.filter(s => (note as Record<string, string | null>)[s.key]);

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#e0f2fe" }}>
            <ClipboardList className="w-5 h-5" style={{ color: "#0284c7" }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: "#0f172a" }}>
              {note.chief_complaint || "Clinical Note"}
            </h3>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
                <Calendar className="w-3 h-3" /> {formatDate(note.visit_date)}
              </span>
              {note.provider_name && (
                <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
                  <User className="w-3 h-3" /> {note.provider_name}
                </span>
              )}
            </div>
            {note.icd10_codes && note.icd10_codes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {note.icd10_codes.map(c => (
                  <span key={c} className="text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{ background: "#f1f5f9", color: "#475569" }}>{c}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={onEdit} className="p-1.5 rounded-lg" style={{ color: "#64748b" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0284c7"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}>
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg" style={{ color: "#64748b" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {sections.length > 0 && (
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs mt-3 font-medium" style={{ color: "#0284c7" }}>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Collapse" : `View SOAP (${sections.length} section${sections.length > 1 ? "s" : ""})`}
        </button>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 space-y-3">
              {sections.map(({ key, label, color, bg }) => (
                <div key={key} className="rounded-lg p-3" style={{ background: bg, borderLeft: `3px solid ${color}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
                  <p className="text-xs whitespace-pre-wrap" style={{ color: "#334155" }}>
                    {(note as Record<string, string | null>)[key]}
                  </p>
                </div>
              ))}
              {note.follow_up_date && (
                <p className="text-xs" style={{ color: "#64748b" }}>
                  Follow-up: {formatDate(note.follow_up_date)}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ClinicalNotesPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; note?: SOAPNote }>({ open: false });
  const [search, setSearch] = useState("");

  const { data: notes = [], isLoading } = useQuery({ queryKey: QUERY_KEYS.soapNotes(), queryFn: fetchNotes });

  const deleteMut = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.soapNotes() }); toast.success("Note deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  const filtered = search
    ? notes.filter(n =>
        (n.chief_complaint ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (n.provider_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (n.icd10_codes ?? []).some(c => c.toLowerCase().includes(search.toLowerCase()))
      )
    : notes;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
            Clinical Notes
          </h1>
          <p className="text-sm" style={{ color: "#64748b" }}>SOAP-formatted visit notes and clinical documentation</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn btn-primary">
          <Plus className="w-4 h-4" /> New Note
        </button>
      </motion.div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#94a3b8" }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by complaint, provider, ICD-10…" className="field pl-9" />
      </div>

      {isLoading && <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="card py-16 text-center">
          <ClipboardList className="w-12 h-12 mx-auto mb-3" style={{ color: "#e2e8f0" }} />
          <p className="font-medium mb-1" style={{ color: "#64748b" }}>
            {search ? `No notes match "${search}"` : "No clinical notes yet"}
          </p>
          {!search && (
            <>
              <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>Create your first SOAP note from a visit or consultation.</p>
              <button onClick={() => setModal({ open: true })} className="btn btn-primary btn-sm mx-auto">
                <Plus className="w-3.5 h-3.5" /> New Note
              </button>
            </>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((n, i) => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .04 }}>
            <NoteCard note={n} onEdit={() => setModal({ open: true, note: n })} onDelete={() => deleteMut.mutate(n.id)} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modal.open && <NoteModal note={modal.note} onClose={() => setModal({ open: false })} />}
      </AnimatePresence>
    </div>
  );
}
