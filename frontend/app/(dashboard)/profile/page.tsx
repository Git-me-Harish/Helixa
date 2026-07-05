"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Mail, Phone, Calendar, Droplets, Venus,
  MapPin, Lock, Save, Loader2, CheckCircle, AlertTriangle,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/queryKeys";
import type { User as UserType } from "@/types";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["male", "female", "non-binary", "prefer not to say", "other"];

function fieldCls(readOnly = false) {
  return `field ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`;
}

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2.5 mb-5 pb-4" style={{borderBottom:"1px solid #f1f5f9"}}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"#e0f2fe"}}>
          <Icon className="w-4 h-4" style={{color:"#0284c7"}}/>
        </div>
        <h2 className="font-semibold text-sm" style={{color:"#0f172a"}}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const { setAuth, user: storeUser } = useAuthStore();

  const { data: profile, isLoading } = useQuery<UserType>({
    queryKey: QUERY_KEYS.profile(),
    queryFn: () => api.get("/api/auth/me").then(r => r.data),
  });

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    blood_group: "",
    gender: "",
    address: "",
  });
  const [initialized, setInitialized] = useState(false);

  // Populate once profile loads
  if (profile && !initialized) {
    setForm({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      phone: profile.phone ?? "",
      date_of_birth: profile.date_of_birth ?? "",
      blood_group: profile.blood_group ?? "",
      gender: profile.gender ?? "",
      address: profile.address ?? "",
    });
    setInitialized(true);
  }

  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [pwError, setPwError] = useState<string | null>(null);

  const patch = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [k]: e.target.value }));

  const updateProfile = useMutation({
    mutationFn: (body: Partial<typeof form>) =>
      api.put<UserType>("/api/auth/me", body).then(r => r.data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.profile() });
      if (storeUser) setAuth(updated, sessionStorage.getItem("helixa_token") ?? "");
      toast.success("Profile updated");
    },
    onError: () => toast.error("Failed to save profile"),
  });

  const updatePassword = useMutation({
    mutationFn: (body: { current_password: string; new_password: string }) =>
      api.put("/api/auth/me", body),
    onSuccess: () => {
      toast.success("Password changed");
      setPwForm({ current_password: "", new_password: "", confirm: "" });
      setPwError(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? "Failed to change password";
      setPwError(msg);
    },
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(form)) {
      body[k] = v.trim() || null;
    }
    updateProfile.mutate(body);
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError("New passwords do not match");
      return;
    }
    updatePassword.mutate({
      current_password: pwForm.current_password,
      new_password: pwForm.new_password,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-5 h-5 animate-spin" style={{color:"#0284c7"}}/>
      </div>
    );
  }

  const initials = profile
    ? `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto" style={{background:"#f0f4f8",minHeight:"100vh"}}>
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-8">
        {/* Avatar + name header */}
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{background:"#e0f2fe",color:"#0284c7",border:"2px solid #bae6fd"}}>
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
              {profile?.first_name} {profile?.last_name}
            </h1>
            <p className="text-sm" style={{color:"#64748b"}}>{profile?.email}</p>
            {profile?.blood_group && (
              <span className="inline-flex items-center gap-1.5 mt-1 text-xs px-2.5 py-0.5 rounded-full font-semibold"
                style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca"}}>
                <Droplets className="w-3 h-3"/>
                {profile.blood_group}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <div className="space-y-5">
        {/* Personal info */}
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.04}}>
          <Section title="Personal Information" icon={User}>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">First name</label>
                  <input value={form.first_name} onChange={patch("first_name")}
                    className={fieldCls()} required/>
                </div>
                <div>
                  <label className="label">Last name</label>
                  <input value={form.last_name} onChange={patch("last_name")}
                    className={fieldCls()} required/>
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" style={{color:"#94a3b8"}}/>
                  Email address
                </label>
                <input value={profile?.email ?? ""} readOnly className={fieldCls(true)}/>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" style={{color:"#94a3b8"}}/>
                    Phone
                  </label>
                  <input value={form.phone} onChange={patch("phone")}
                    placeholder="+1 555 000 0000" className={fieldCls()}/>
                </div>
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" style={{color:"#94a3b8"}}/>
                    Date of birth
                  </label>
                  <input type="date" value={form.date_of_birth} onChange={patch("date_of_birth")}
                    className={fieldCls()}/>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5" style={{color:"#dc2626"}}/>
                    Blood group
                  </label>
                  <select value={form.blood_group} onChange={patch("blood_group")} className={fieldCls()}>
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Venus className="w-3.5 h-3.5" style={{color:"#94a3b8"}}/>
                    Gender
                  </label>
                  <select value={form.gender} onChange={patch("gender")} className={fieldCls()}>
                    <option value="">Prefer not to say</option>
                    {GENDERS.map(g => (
                      <option key={g} value={g} className="capitalize">{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" style={{color:"#94a3b8"}}/>
                  Address
                </label>
                <textarea value={form.address} onChange={patch("address")}
                  rows={2} placeholder="123 Main St, City, State, ZIP"
                  className="field resize-none"/>
              </div>

              <div className="flex justify-end pt-1">
                <button type="submit" disabled={updateProfile.isPending} className="btn btn-primary">
                  {updateProfile.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin"/>Saving…</>
                    : <><Save className="w-4 h-4"/>Save changes</>
                  }
                </button>
              </div>
            </form>
          </Section>
        </motion.div>

        {/* Change password */}
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.08}}>
          <Section title="Change Password" icon={Lock}>
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className="label">Current password</label>
                <input type="password" value={pwForm.current_password} required
                  onChange={e => setPwForm(f => ({...f, current_password: e.target.value}))}
                  className="field"/>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">New password</label>
                  <input type="password" value={pwForm.new_password} required minLength={8}
                    onChange={e => setPwForm(f => ({...f, new_password: e.target.value}))}
                    placeholder="Min. 8 characters" className="field"/>
                </div>
                <div>
                  <label className="label">Confirm new password</label>
                  <input type="password" value={pwForm.confirm} required
                    onChange={e => setPwForm(f => ({...f, confirm: e.target.value}))}
                    placeholder="Repeat new password" className="field"/>
                </div>
              </div>

              {pwError && (
                <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg"
                  style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626"}}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0"/>
                  {pwError}
                </div>
              )}

              {updatePassword.isSuccess && (
                <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg"
                  style={{background:"#ecfdf5",border:"1px solid #a7f3d0",color:"#059669"}}>
                  <CheckCircle className="w-4 h-4 flex-shrink-0"/>
                  Password changed successfully
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button type="submit" disabled={updatePassword.isPending} className="btn btn-primary">
                  {updatePassword.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin"/>Updating…</>
                    : <><Lock className="w-4 h-4"/>Update password</>
                  }
                </button>
              </div>
            </form>
          </Section>
        </motion.div>

        {/* Account info */}
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.12}}>
          <div className="card p-5">
            <p className="text-xs" style={{color:"#94a3b8"}}>
              Account created: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"} ·
              Role: <span className="capitalize">{profile?.role}</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
