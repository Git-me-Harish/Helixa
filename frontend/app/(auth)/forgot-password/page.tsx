"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:"#f0f9ff"}}>
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.4}}
        className="w-full max-w-md">

        <Link href="/login" className="flex items-center gap-2.5 mb-10">
          <HelixaLogo/>
          <span className="text-xl font-bold" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,Inter,sans-serif"}}>Helixa</span>
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{background:"#ecfdf5",border:"1px solid #a7f3d0"}}>
              <CheckCircle className="w-8 h-8" style={{color:"#059669"}}/>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Check your email</h1>
            <p className="text-sm mb-6" style={{color:"#64748b"}}>
              If <span className="font-medium" style={{color:"#334155"}}>{email}</span> is registered,
              you&apos;ll receive a password reset link within a few minutes.
            </p>
            <Link href="/login" className="btn btn-primary inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4"/> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Reset your password</h1>
              <p className="text-sm" style={{color:"#64748b"}}>
                Enter your account email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:"#94a3b8"}}/>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" className="field pl-9"/>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626"}}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Sending…</> : "Send reset link"}
              </button>
            </form>

            <p className="text-center text-sm mt-6">
              <Link href="/login" className="flex items-center justify-center gap-1.5 font-medium" style={{color:"#0284c7"}}>
                <ArrowLeft className="w-3.5 h-3.5"/> Back to sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
