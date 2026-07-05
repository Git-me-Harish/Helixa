"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import api from "@/lib/api";

function HelixaLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="#0284c7"/>
      <path d="M8 16C8 11.582 11.582 8 16 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 16C24 20.418 20.418 24 16 24" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="3.5" fill="#fff"/>
    </svg>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{background:"#fef2f2",border:"1px solid #fecaca"}}>
          <AlertCircle className="w-8 h-8" style={{color:"#dc2626"}}/>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Invalid link</h1>
        <p className="text-sm mb-6" style={{color:"#64748b"}}>
          This reset link is missing a token. Please request a new one.
        </p>
        <Link href="/forgot-password" className="btn btn-primary inline-flex">Request new link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{background:"#ecfdf5",border:"1px solid #a7f3d0"}}>
          <CheckCircle className="w-8 h-8" style={{color:"#059669"}}/>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Password updated</h1>
        <p className="text-sm mb-6" style={{color:"#64748b"}}>
          Your password has been changed successfully. You can now sign in.
        </p>
        <Link href="/login" className="btn btn-primary inline-flex">Sign in</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, new_password: password });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Invalid or expired link. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Set new password</h1>
        <p className="text-sm" style={{color:"#64748b"}}>
          Choose a strong password with at least 8 characters, a letter, and a digit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">New password</label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} required minLength={8}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters" className="field pr-10"/>
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:"#94a3b8"}}>
              {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
            </button>
          </div>
        </div>

        <div>
          <label className="label">Confirm new password</label>
          <input type={showPw ? "text" : "password"} required minLength={8}
            value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password" className="field"/>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626"}}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Updating…</> : "Update password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:"#f0f9ff"}}>
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.4}}
        className="w-full max-w-md">
        <Link href="/login" className="flex items-center gap-2.5 mb-10">
          <HelixaLogo/>
          <span className="text-xl font-bold" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,Inter,sans-serif"}}>Helixa</span>
        </Link>
        <Suspense fallback={<div className="text-sm" style={{color:"#64748b"}}>Loading…</div>}>
          <ResetPasswordForm/>
        </Suspense>
      </motion.div>
    </div>
  );
}
