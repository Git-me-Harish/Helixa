"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, X, Edit2, User, Heart, Calendar, Tag } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/queryKeys";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  date_of_birth: string | null;
  blood_group: string | null;
  medical_conditions: string[] | null;
  allergies: string[] | null;
  medications: string[] | null;
  notes: string | null;
  created_at: string;
}

const RELATIONSHIPS = ["Mother", "Father", "Sibling", "Spouse/Partner", "Child", "Grandparent", "Grandchild", "Aunt/Uncle", "Cousin", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

const EMPTY_FORM = {
  name: "", relationship: "", date_of_birth: "", blood_group: "",
  medical_conditions: "", allergies: "", medications: "", notes: "",
};

function parseList(s: string): string[] | null {
  const arr = s.split(",").map(x => x.trim()).filter(Boolean);
  return arr.length > 0 ? arr : null;
}

async function fetchFamily(): Promise<FamilyMember[]> {
  const res = await api.get<FamilyMember[]>("/api/family");
  return res.data;
}

async function saveMember(data: typeof EMPTY_FORM, id?: string): Promise<FamilyMember> {
  const body = {
    name: data.name, relationship: data.relationship,
    date_of_birth: data.date_of_birth || null,
    blood_group: data.blood_group || null,
    medical_conditions: parseList(data.medical_conditions),
    allergies: parseList(data.allergies),
    medications: parseList(data.medications),
    notes: data.notes || null,
  };
  const res = id
    ? await api.put<FamilyMember>(`/api/family/${id}`, body)
    : await api.post<FamilyMember>("/api/family", body);
  return res.data;
}

async function deleteMember(id: string): Promise<void> {
  await api.delete(`/api/family/${id}`);
}

function MemberModal({ member, onClose }: { member?: FamilyMember; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(member ? {
    name: member.name, relationship: member.relationship,
    date_of_birth: member.date_of_birth?.split("T")[0] ?? "",
    blood_group: member.blood_group ?? "",
    medical_conditions: (member.medical_conditions ?? []).join(", "),
    allergies: (member.allergies ?? []).join(", "),
    medications: (member.medications ?? []).join(", "),
    notes: member.notes ?? "",
  } : EMPTY_FORM);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => saveMember(form, member?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.family() });
      toast.success(member ? "Member updated" : "Member added");
      onClose();
    },
    onError: () => toast.error("Failed to save"),
  });

  const valid = form.name.trim() && form.relationship.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,.4)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: .96 }} className="card w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <h2 className="font-bold text-base" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
            {member ? "Edit Family Member" : "Add Family Member"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "#94a3b8" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name" className="field" />
            </div>
            <div>
              <label className="label">Relationship *</label>
              <select value={form.relationship} onChange={e => set("relationship", e.target.value)} className="field">
                <option value="">Select…</option>
                {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} className="field" />
            </div>
            <div>
              <label className="label">Blood Group</label>
              <select value={form.blood_group} onChange={e => set("blood_group", e.target.value)} className="field">
                <option value="">Unknown</option>
                {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Medical Conditions <span className="font-normal text-[#94a3b8]">(comma-separated)</span></label>
            <input value={form.medical_conditions} onChange={e => set("medical_conditions", e.target.value)}
              placeholder="Diabetes, Hypertension" className="field" />
          </div>
          <div>
            <label className="label">Allergies <span className="font-normal text-[#94a3b8]">(comma-separated)</span></label>
            <input value={form.allergies} onChange={e => set("allergies", e.target.value)}
              placeholder="Penicillin, Nuts" className="field" />
          </div>
          <div>
            <label className="label">Current Medications <span className="font-normal text-[#94a3b8]">(comma-separated)</span></label>
            <input value={form.medications} onChange={e => set("medications", e.target.value)}
              placeholder="Metformin, Lisinopril" className="field" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Family history notes..." className="field resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
            <button onClick={() => valid && mutation.mutate()} disabled={!valid || mutation.isPending} className="btn btn-primary flex-1">
              {mutation.isPending ? "Saving..." : member ? "Update" : "Add Member"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MemberCard({ member, onEdit, onDelete }: { member: FamilyMember; onEdit: () => void; onDelete: () => void }) {
  const initials = member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const colors = ["#0284c7", "#0d9488", "#7c3aed", "#d97706", "#dc2626", "#059669"];
  const color = colors[member.name.charCodeAt(0) % colors.length];

  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: `${color}18`, color }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold" style={{ color: "#0f172a" }}>{member.name}</h3>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{member.relationship}</p>
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

          <div className="flex flex-wrap gap-3 mt-3">
            {member.date_of_birth && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
                <Calendar className="w-3 h-3" /> {formatDate(member.date_of_birth)}
              </span>
            )}
            {member.blood_group && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {member.blood_group}
              </span>
            )}
          </div>

          {member.medical_conditions && member.medical_conditions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {member.medical_conditions.map(c => (
                <span key={c} className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "#f0f4f8", color: "#475569" }}>{c}</span>
              ))}
            </div>
          )}
          {member.allergies && member.allergies.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {member.allergies.map(a => (
                <span key={a} className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "#fffbeb", color: "#d97706" }}>{a}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FamilyPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; member?: FamilyMember }>({ open: false });

  const { data: members = [], isLoading } = useQuery({ queryKey: QUERY_KEYS.family(), queryFn: fetchFamily });

  const deleteMut = useMutation({
    mutationFn: deleteMember,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.family() }); toast.success("Member removed"); },
    onError: () => toast.error("Failed to remove"),
  });

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
            Family Health Records
          </h1>
          <p className="text-sm" style={{ color: "#64748b" }}>Track family members' health history for hereditary insights</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </motion.div>

      {isLoading && <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>}

      {!isLoading && members.length === 0 && (
        <div className="card py-16 text-center">
          <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "#e2e8f0" }} />
          <p className="font-medium mb-1" style={{ color: "#64748b" }}>No family members added yet</p>
          <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>Add family members to track hereditary conditions and health history.</p>
          <button onClick={() => setModal({ open: true })} className="btn btn-primary btn-sm mx-auto">
            <Plus className="w-3.5 h-3.5" /> Add Member
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * .05 }}>
            <MemberCard member={m} onEdit={() => setModal({ open: true, member: m })} onDelete={() => deleteMut.mutate(m.id)} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modal.open && <MemberModal member={modal.member} onClose={() => setModal({ open: false })} />}
      </AnimatePresence>
    </div>
  );
}
