"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const PERKS = [
  "Lifelong health record — vitals, medications, history",
  "AI health agents across 20+ specialties",
  "Find verified doctors from the NPI registry",
  "FDA drug information & interaction checker",
  "Document OCR + AI analysis of lab reports",
  "Predictive analytics & preventive insights",
];

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [form, setForm] = useState({ first_name:"", last_name:"", email:"", password:"", phone:"" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(form);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Could not create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{background:"#f0f9ff"}}>
      {/* Visual panel */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.7,delay:.2}}
        className="hidden lg:flex flex-col justify-between p-12 w-[460px] flex-shrink-0"
        style={{background:"linear-gradient(155deg, #0d9488 0%, #0284c7 100%)"}}>

        <div className="text-sm font-medium" style={{color:"rgba(255,255,255,.55)"}}>Helixa Health Intelligence</div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-4" style={{fontFamily:"Plus Jakarta Sans,sans-serif"}}>
            Everything your health needs, in one place
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{color:"rgba(255,255,255,.65)"}}>
            Join thousands managing their health intelligently with AI-powered tools, real physician data, and FDA drug information.
          </p>

          <div className="space-y-3">
            {PERKS.map(perk => (
              <div key={perk} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{background:"rgba(255,255,255,.2)"}}>
                  <Check className="w-3 h-3 text-white"/>
                </div>
                <span className="text-sm" style={{color:"rgba(255,255,255,.85)"}}>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{color:"rgba(255,255,255,.35)"}}>
          For informational purposes only. Not a substitute for professional medical advice.
        </p>
      </motion.div>

      {/* Form panel */}
      <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{duration:.5}}
        className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <HelixaLogo/>
            <span className="text-xl font-bold" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,Inter,sans-serif"}}>Helixa</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Create your account</h1>
            <p className="text-sm" style={{color:"#64748b"}}>Free forever — no credit card required</p>
          </div>

          <button onClick={() => { window.location.href = "/api/auth/google"; }}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium mb-5 transition-all"
            style={{background:"white",border:"1.5px solid #e2e8f0",color:"#334155",boxShadow:"0 1px 3px rgba(15,23,42,.06)"}}
            onMouseEnter={e=>(e.currentTarget.style.boxShadow="0 4px 12px rgba(15,23,42,.1)")}
            onMouseLeave={e=>(e.currentTarget.style.boxShadow="0 1px 3px rgba(15,23,42,.06)")}>
            <GoogleIcon/>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{background:"#e2e8f0"}}/>
            <span className="text-xs" style={{color:"#94a3b8"}}>or sign up with email</span>
            <div className="flex-1 h-px" style={{background:"#e2e8f0"}}/>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First name</label>
                <input required value={form.first_name} onChange={patch("first_name")}
                  placeholder="Jane" className="field"/>
              </div>
              <div>
                <label className="label">Last name</label>
                <input required value={form.last_name} onChange={patch("last_name")}
                  placeholder="Smith" className="field"/>
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <input type="email" required value={form.email} onChange={patch("email")}
                placeholder="you@example.com" className="field"/>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={form.password}
                  onChange={patch("password")} placeholder="Min. 8 characters" className="field pr-10"
                  minLength={8}/>
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:"#94a3b8"}}>
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Phone <span style={{color:"#94a3b8",fontWeight:400}}>(optional)</span></label>
              <input type="tel" value={form.phone} onChange={patch("phone")}
                placeholder="+1 555 000 0000" className="field"/>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626"}}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Creating account…</> : "Create my account"}
            </button>

            <p className="text-xs text-center" style={{color:"#94a3b8"}}>
              By signing up you agree to our{" "}
              <Link href="/terms" style={{color:"#0284c7"}}>Terms of Service</Link> and{" "}
              <Link href="/privacy" style={{color:"#0284c7"}}>Privacy Policy</Link>.
            </p>
          </form>

          <p className="text-center text-sm mt-5" style={{color:"#64748b"}}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold" style={{color:"#0284c7"}}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
