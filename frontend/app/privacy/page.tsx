import Link from "next/link";

export const metadata = { title: "Privacy Policy – Helixa" };

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-2" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Privacy Policy</h1>
        <p className="text-sm mb-10" style={{color:"#64748b"}}>Last updated: July 2026</p>

        <div className="space-y-8 text-sm leading-relaxed" style={{color:"#334155"}}>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>1. What We Collect</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li><strong>Account information:</strong> name, email, date of birth, phone number.</li>
              <li><strong>Health data:</strong> vitals, medications, allergies, medical history, uploaded documents, and other data you enter into the platform.</li>
              <li><strong>Usage data:</strong> pages visited, features used, and error logs (no advertising identifiers).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>2. How We Use Your Data</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>To operate and improve the platform&apos;s features.</li>
              <li>To generate AI health insights using your data as context (processed server-side; not used to train third-party models).</li>
              <li>To send transactional emails such as password resets.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>3. We Do Not Sell Your Data</h2>
            <p>We do not sell, rent, or trade your personal or health information to third parties for marketing or advertising purposes.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>4. Third-Party Services</h2>
            <p>We query the following third-party APIs with <strong>only the minimum necessary data</strong>:</p>
            <ul className="list-disc ml-5 space-y-1 mt-2">
              <li><strong>FDA Open Data API</strong> — drug names for interaction lookup (no personal data sent).</li>
              <li><strong>NPI Registry</strong> — doctor search queries (no personal data sent).</li>
              <li><strong>Groq / Ollama</strong> — AI inference. Queries are processed per-request and are not stored by the provider.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>5. Data Retention</h2>
            <p>Your data is retained for as long as your account is active. You may delete your account at any time from profile settings, which permanently removes all associated data within 30 days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>6. Security</h2>
            <p>All data is encrypted in transit (TLS) and at rest. Passwords are hashed using bcrypt. Access tokens expire within 15 minutes; refresh tokens are stored as HTTP-only cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>7. Your Rights</h2>
            <p>You have the right to access, correct, export, or delete your personal data. Contact us at privacy@helixa.health with requests.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{color:"#0f172a"}}>8. Changes</h2>
            <p>We will notify you of material changes to this policy by email or in-app notice at least 14 days in advance.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t" style={{borderColor:"#e2e8f0"}}>
          <Link href="/signup" style={{color:"#0284c7"}} className="text-sm font-medium">← Back to sign up</Link>
        </div>
      </main>
    </div>
  );
}
