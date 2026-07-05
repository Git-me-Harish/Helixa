import Link from "next/link";

export const metadata = { title: "Terms of Service – Helixa" };

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{background:"#f0f9ff"}}>
      <header className="border-b px-6 py-4 flex items-center gap-3" style={{background:"white",borderColor:"#e2e8f0"}}>
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="9" fill="#0284c7"/>
          <path d="M8 16C8 11.582 11.582 8 16 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M24 16C24 20.418 20.418 24 16 24" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="16" cy="16" r="3.5" fill="#fff"/>
        </svg>
        <span className="font-bold text-lg" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Helixa</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Terms of Service</h1>
        <p className="text-sm mb-10" style={{color:"#64748b"}}>Last updated: July 2026</p>

        <div className="space-y-8 text-sm leading-relaxed" style={{color:"#334155"}}>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>1. Acceptance</h2>
            <p>By creating an account or using Helixa you agree to these Terms. If you do not agree, do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>2. Not Medical Advice</h2>
            <p>Helixa is an informational tool only. All content, AI-generated insights, summaries, and recommendations are for informational purposes and are <strong>not</strong> a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making medical decisions.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>3. Account Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You must provide accurate information and promptly update it if it changes.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>4. Health Data</h2>
            <p>You grant Helixa a limited license to process the health information you upload solely to provide the platform&apos;s features. We do not sell your health data. See our <Link href="/privacy" style={{color:"#0284c7"}}>Privacy Policy</Link> for full details.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>5. AI Limitations</h2>
            <p>AI-generated content may be inaccurate, incomplete, or outdated. Drug interaction information is sourced from the FDA Open Data API and is provided without warranty. Always verify with a licensed pharmacist or physician.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>6. Prohibited Use</h2>
            <p>You may not use Helixa for any unlawful purpose, to harass others, to submit false medical information, or to attempt to reverse-engineer the platform.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>7. Termination</h2>
            <p>We may suspend or terminate your account at any time for violations of these Terms. You may delete your account at any time from the profile settings.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>8. Disclaimer of Warranties</h2>
            <p>The platform is provided &quot;as is&quot; without warranties of any kind. We do not warrant that the service will be uninterrupted, error-free, or that any particular result will be obtained.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>9. Changes</h2>
            <p>We may update these Terms at any time. Continued use after changes constitutes acceptance of the revised Terms.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t" style={{borderColor:"#e2e8f0"}}>
          <Link href="/signup" style={{color:"#0284c7"}} className="text-sm font-medium">← Back to sign up</Link>
        </div>
      </main>
    </div>
  );
}
