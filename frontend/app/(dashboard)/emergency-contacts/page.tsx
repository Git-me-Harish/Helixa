"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, Plus, X, Edit2, Star, Mail, MapPin, Phone } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/queryKeys";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone_primary: string;
  phone_secondary: string | null;
  email: string | null;
  address: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
}

const RELATIONSHIPS = ["Spouse/Partner", "Parent", "Child", "Sibling", "Friend", "Caregiver", "Doctor", "Neighbor", "Other"];
const EMPTY_FORM = {
  name: "", relationship: "", phone_primary: "", phone_secondary: "",
  email: "", address: "", is_primary: false, notes: "",
};

async function fetchContacts(): Promise<EmergencyContact[]> {
  const res = await api.get<EmergencyContact[]>("/api/emergency-contacts");
  return res.data;
}

async function saveContact(data: typeof EMPTY_FORM, id?: string): Promise<EmergencyContact> {
  const body = {
    name: data.name, relationship: data.relationship,
    phone_primary: data.phone_primary,
    phone_secondary: data.phone_secondary || null,
    email: data.email || null,
    address: data.address || null,
    is_primary: data.is_primary,
    notes: data.notes || null,
  };
  const res = id
    ? await api.put<EmergencyContact>(`/api/emergency-contacts/${id}`, body)
    : await api.post<EmergencyContact>("/api/emergency-contacts", body);
  return res.data;
}

async function deleteContact(id: string): Promise<void> {
  await api.delete(`/api/emergency-contacts/${id}`);
}

function ContactModal({ contact, onClose }: { contact?: EmergencyContact; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(contact ? {
    name: contact.name, relationship: contact.relationship,
    phone_primary: contact.phone_primary, phone_secondary: contact.phone_secondary ?? "",
    email: contact.email ?? "", address: contact.address ?? "",
    is_primary: contact.is_primary, notes: contact.notes ?? "",
  } : EMPTY_FORM);
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => saveContact(form as typeof EMPTY_FORM, contact?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emergencyContacts() });
      toast.success(contact ? "Contact updated" : "Contact added");
      onClose();
    },
    onError: () => toast.error("Failed to save"),
  });

  const valid = form.name.trim() && form.relationship && form.phone_primary.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,.4)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: .96 }} className="card w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <h2 className="font-bold text-base" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
            {contact ? "Edit Contact" : "Add Emergency Contact"}
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
              <label className="label">Primary Phone *</label>
              <input type="tel" value={form.phone_primary} onChange={e => set("phone_primary", e.target.value)}
                placeholder="+1 555 0100" className="field" />
            </div>
            <div>
              <label className="label">Secondary Phone</label>
              <input type="tel" value={form.phone_secondary} onChange={e => set("phone_secondary", e.target.value)}
                placeholder="+1 555 0101" className="field" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="contact@email.com" className="field" />
          </div>
          <div>
            <label className="label">Address</label>
            <input value={form.address} onChange={e => set("address", e.target.value)}
              placeholder="123 Main St, City" className="field" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Additional notes..." className="field resize-none" />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={form.is_primary} onChange={e => set("is_primary", e.target.checked)} className="sr-only" />
              <div className="w-9 h-5 rounded-full transition-colors"
                style={{ background: form.is_primary ? "#0284c7" : "#e2e8f0" }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{ transform: form.is_primary ? "translateX(18px)" : "translateX(2px)" }} />
              </div>
            </div>
            <span className="text-sm font-medium" style={{ color: "#334155" }}>Set as primary emergency contact</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
            <button onClick={() => valid && mutation.mutate()} disabled={!valid || mutation.isPending} className="btn btn-primary flex-1">
              {mutation.isPending ? "Saving..." : contact ? "Update" : "Add Contact"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ContactCard({ contact, onEdit, onDelete }: { contact: EmergencyContact; onEdit: () => void; onDelete: () => void }) {
  const initials = contact.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="card p-5" style={{ outline: contact.is_primary ? "2px solid #0284c7" : "none" }}>
      {contact.is_primary && (
        <div className="flex items-center gap-1 text-xs font-medium mb-3 px-2 py-1 rounded-lg w-fit"
          style={{ background: "#e0f2fe", color: "#0284c7" }}>
          <Star className="w-3 h-3" /> Primary Contact
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: "#fef2f2", color: "#dc2626" }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold" style={{ color: "#0f172a" }}>{contact.name}</h3>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{contact.relationship}</p>
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
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#0284c7" }} />
              <a href={`tel:${contact.phone_primary}`} className="font-medium" style={{ color: "#0284c7" }}>
                {contact.phone_primary}
              </a>
              {contact.phone_secondary && <span style={{ color: "#94a3b8" }}>· {contact.phone_secondary}</span>}
            </div>
            {contact.email && (
              <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </div>
            )}
            {contact.address && (
              <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{contact.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmergencyContactsPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; contact?: EmergencyContact }>({ open: false });

  const { data: contacts = [], isLoading } = useQuery({ queryKey: QUERY_KEYS.emergencyContacts(), queryFn: fetchContacts });

  const deleteMut = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emergencyContacts() }); toast.success("Contact removed"); },
    onError: () => toast.error("Failed to remove"),
  });

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
            Emergency Contacts
          </h1>
          <p className="text-sm" style={{ color: "#64748b" }}>People to contact in case of a medical emergency</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </motion.div>

      {isLoading && <div className="space-y-3">{[1, 2].map(i => <div key={i} className="skeleton h-36 rounded-xl" />)}</div>}

      {!isLoading && contacts.length === 0 && (
        <div className="card py-16 text-center">
          <PhoneCall className="w-12 h-12 mx-auto mb-3" style={{ color: "#e2e8f0" }} />
          <p className="font-medium mb-1" style={{ color: "#64748b" }}>No emergency contacts</p>
          <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>Add people who should be contacted in a medical emergency.</p>
          <button onClick={() => setModal({ open: true })} className="btn btn-primary btn-sm mx-auto">
            <Plus className="w-3.5 h-3.5" /> Add Contact
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * .05 }}>
            <ContactCard contact={c} onEdit={() => setModal({ open: true, contact: c })} onDelete={() => deleteMut.mutate(c.id)} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modal.open && <ContactModal contact={modal.contact} onClose={() => setModal({ open: false })} />}
      </AnimatePresence>
    </div>
  );
}
