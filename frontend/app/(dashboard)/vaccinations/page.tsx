"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Syringe, Plus, X, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Calendar, User } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/queryKeys";

interface Vaccination {
  id: string;
  vaccine_name: string;
  dose_number: number | null;
  total_doses: number | null;
  administered_date: string | null;
  next_due_date: string | null;
  administered_by: string | null;
  lot_number: string | null;
  site: string | null;
  status: "completed" | "due" | "overdue" | "not_required";
  notes: string | null;
  created_at: string;
}

const STATUS_CONFIG = {
  completed:    { label: "Completed",    icon: CheckCircle,  text: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  due:          { label: "Due",          icon: Clock,        text: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  overdue:      { label: "Overdue",      icon: AlertCircle,  text: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  not_required: { label: "Not Required", icon: CheckCircle,  text: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" },
};

const COMMON_VACCINES = [
  "COVID-19 (mRNA)", "Influenza (Flu)", "Tetanus/Tdap", "Hepatitis B",
  "Hepatitis A", "MMR (Measles/Mumps/Rubella)", "Varicella (Chickenpox)",
  "HPV", "Pneumococcal", "Meningococcal", "Shingles (Zoster)",
  "Polio (IPV)", "Haemophilus influenzae type b (Hib)", "Rotavirus",
];

const EMPTY_FORM = {
  vaccine_name: "", dose_number: "", total_doses: "",
  administered_date: "", next_due_date: "", administered_by: "",
  lot_number: "", site: "", status: "completed", notes: "",
};

async function fetchVaccinations(): Promise<Vaccination[]> {
  const res = await api.get<Vaccination[]>("/api/vaccinations");
  return res.data;
}

async function addVaccination(data: typeof EMPTY_FORM): Promise<Vaccination> {
  const res = await api.post<Vaccination>("/api/vaccinations", {
    ...data,
    dose_number: data.dose_number ? parseInt(data.dose_number) : null,
    total_doses: data.total_doses ? parseInt(data.total_doses) : null,
    administered_date: data.administered_date || null,
    next_due_date: data.next_due_date || null,
    administered_by: data.administered_by || null,
    lot_number: data.lot_number || null,
    site: data.site || null,
    notes: data.notes || null,
  });
  return res.data;
}

async function deleteVaccination(id: string): Promise<void> {
  await api.delete(`/api/vaccinations/${id}`);
}

function VaccCard({ vacc, onDelete }: { vacc: Vaccination; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[vacc.status];
  const Icon = cfg.icon;

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#e0f2fe" }}>
          <Syringe className="w-5 h-5" style={{ color: "#0284c7" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "#0f172a" }}>{vacc.vaccine_name}</h3>
              {(vacc.dose_number || vacc.total_doses) && (
                <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                  Dose {vacc.dose_number ?? "?"}{vacc.total_doses ? ` of ${vacc.total_doses}` : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                <Icon className="w-3 h-3" />{cfg.label}
              </span>
              <button onClick={() => onDelete(vacc.id)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: "#94a3b8" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-2">
            {vacc.administered_date && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
                <Calendar className="w-3 h-3" /> Administered: {formatDate(vacc.administered_date)}
              </span>
            )}
            {vacc.next_due_date && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "#d97706" }}>
                <Clock className="w-3 h-3" /> Next due: {formatDate(vacc.next_due_date)}
              </span>
            )}
            {vacc.administered_by && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
                <User className="w-3 h-3" /> {vacc.administered_by}
              </span>
            )}
          </div>

          {(vacc.lot_number || vacc.site || vacc.notes) && (
            <button onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs mt-2 font-medium"
              style={{ color: "#0284c7" }}>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Less" : "More details"}
            </button>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-2 pt-2 space-y-1" style={{ borderTop: "1px solid #f1f5f9" }}>
                  {vacc.site && <p className="text-xs" style={{ color: "#64748b" }}><span className="font-medium">Site:</span> {vacc.site}</p>}
                  {vacc.lot_number && <p className="text-xs" style={{ color: "#64748b" }}><span className="font-medium">Lot #:</span> {vacc.lot_number}</p>}
                  {vacc.notes && <p className="text-xs" style={{ color: "#64748b" }}>{vacc.notes}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function AddModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: addVaccination,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vaccinations() });
      toast.success("Vaccination record added");
      onClose();
    },
    onError: () => toast.error("Failed to add vaccination"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,.4)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: .96 }} className="card w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <h2 className="font-bold text-base" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
            Add Vaccination Record
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "#94a3b8" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="label">Vaccine Name *</label>
            <input list="vaccine-list" value={form.vaccine_name} onChange={e => set("vaccine_name", e.target.value)}
              placeholder="e.g. COVID-19 (mRNA)" className="field" />
            <datalist id="vaccine-list">
              {COMMON_VACCINES.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Dose Number</label>
              <input type="number" min={1} value={form.dose_number} onChange={e => set("dose_number", e.target.value)}
                placeholder="1" className="field" />
            </div>
            <div>
              <label className="label">Total Doses</label>
              <input type="number" min={1} value={form.total_doses} onChange={e => set("total_doses", e.target.value)}
                placeholder="2" className="field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date Administered</label>
              <input type="date" value={form.administered_date} onChange={e => set("administered_date", e.target.value)}
                className="field" />
            </div>
            <div>
              <label className="label">Next Due Date</label>
              <input type="date" value={form.next_due_date} onChange={e => set("next_due_date", e.target.value)}
                className="field" />
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)} className="field">
              <option value="completed">Completed</option>
              <option value="due">Due</option>
              <option value="overdue">Overdue</option>
              <option value="not_required">Not Required</option>
            </select>
          </div>

          <div>
            <label className="label">Administered By</label>
            <input value={form.administered_by} onChange={e => set("administered_by", e.target.value)}
              placeholder="Dr. Smith / City Clinic" className="field" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Injection Site</label>
              <input value={form.site} onChange={e => set("site", e.target.value)}
                placeholder="Left arm" className="field" />
            </div>
            <div>
              <label className="label">Lot Number</label>
              <input value={form.lot_number} onChange={e => set("lot_number", e.target.value)}
                placeholder="EL3247" className="field" />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Any reactions or notes..." className="field resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
            <button
              onClick={() => { if (form.vaccine_name.trim()) mutation.mutate(form); }}
              disabled={!form.vaccine_name.trim() || mutation.isPending}
              className="btn btn-primary flex-1">
              {mutation.isPending ? "Saving..." : "Save Record"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VaccinationsPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const { data: vaccinations = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.vaccinations(),
    queryFn: fetchVaccinations,
  });

  const deleteMut = useMutation({
    mutationFn: deleteVaccination,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vaccinations() }); toast.success("Record deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  const filtered = filter === "all" ? vaccinations : vaccinations.filter(v => v.status === filter);

  const counts = {
    all: vaccinations.length,
    completed: vaccinations.filter(v => v.status === "completed").length,
    due: vaccinations.filter(v => v.status === "due").length,
    overdue: vaccinations.filter(v => v.status === "overdue").length,
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
            Vaccination Records
          </h1>
          <p className="text-sm" style={{ color: "#64748b" }}>Track your immunization history and upcoming doses</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { key: "all", label: "Total", color: "#0284c7", bg: "#e0f2fe" },
          { key: "completed", label: "Completed", color: "#059669", bg: "#ecfdf5" },
          { key: "due", label: "Due Soon", color: "#2563eb", bg: "#eff6ff" },
          { key: "overdue", label: "Overdue", color: "#dc2626", bg: "#fef2f2" },
        ].map(({ key, label, color, bg }) => (
          <button key={key} onClick={() => setFilter(key)}
            className="card p-3 text-left transition-all"
            style={{ borderColor: filter === key ? color : "#e2e8f0", outline: filter === key ? `2px solid ${color}` : "none" }}>
            <div className="text-xl font-bold" style={{ color }}>{counts[key as keyof typeof counts]}</div>
            <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>{label}</div>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="card py-16 text-center">
          <Syringe className="w-12 h-12 mx-auto mb-3" style={{ color: "#e2e8f0" }} />
          <p className="font-medium mb-1" style={{ color: "#64748b" }}>No vaccination records</p>
          <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>
            {filter === "all" ? "Add your first immunization record to get started." : `No records with status "${filter}".`}
          </p>
          {filter === "all" && (
            <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-sm mx-auto">
              <Plus className="w-3.5 h-3.5" /> Add Record
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((v, i) => (
          <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .04 }}>
            <VaccCard vacc={v} onDelete={id => deleteMut.mutate(id)} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && <AddModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
