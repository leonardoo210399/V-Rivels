"use client";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <div className="relative bg-slate-900 py-16 px-6 text-center border-b border-white/5">
        <h1 className="font-anton text-4xl md:text-6xl uppercase text-white mb-4">
          Privacy <span className="text-rose-500">Policy</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          We value your trust and are committed to protecting your personal information.
        </p>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="bg-slate-900/50 p-8 md:p-12 rounded-xl border border-white/5 text-sm md:text-base leading-relaxed space-y-8">
          
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-rose-500 pl-4">1. Information We Collect</h2>
            <p className="text-slate-400 mb-2">We collect information you provide directly to us when you create an account, register for a tournament, or contact support.</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li><strong>Personal Information:</strong> Name, email address, date of birth, and Discord ID.</li>
              <li><strong>Game Data:</strong> Riot ID (IGN), rank, and match statistics necessary for tournament validation.</li>
              <li><strong>Payment Information:</strong> Transaction details when you pay entry fees (we do not store full credit card numbers; these are handled by our payment processors).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-rose-500 pl-4">2. How We Use Your Information</h2>
            <p className="text-slate-400">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2 mt-2">
              <li>Facilitate tournament organization, bracketing, and prize distribution.</li>
              <li>Verify your identity and eligibility (e.g., rank requirements).</li>
              <li>Communicate with you about updates, security alerts, and support messages.</li>
              <li>Monitor and prevent cheating, fraud, and abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-rose-500 pl-4">3. Data Sharing</h2>
            <p className="text-slate-400">
              We do not sell your personal data. We may share information with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2 mt-2">
              <li><strong>Service Providers:</strong> Payment processors (e.g., Razorpay, Stripe) and hosting services.</li>
              <li><strong>Public Display:</strong> Your username, rank, and match history may be visible on leaderboards and bracket pages.</li>
              <li><strong>Legal Compliance:</strong> If required by law or to protect the safety of our users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-rose-500 pl-4">4. Data Security</h2>
            <p className="text-slate-400">
              We implement appropriate technical and organizational measures to protect your data. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-rose-500 pl-4">5. Contact Us</h2>
            <p className="text-slate-400">
              If you have any questions about this Privacy Policy, please contact our Data Protection Officer:
            </p>
            <div className="mt-4 bg-slate-800/50 p-4 rounded-lg inline-block text-slate-300">
              <p>Email: <a href="mailto:aditya210399@gmail.com" className="text-rose-400 hover:underline">aditya210399@gmail.com</a></p>
              <p>Phone: <span className="text-rose-400">+91 90284 10543</span></p>
            </div>
          </section>

          <div className="border-t border-slate-800 pt-8 mt-12 text-center text-xs text-slate-500">
            <p>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
