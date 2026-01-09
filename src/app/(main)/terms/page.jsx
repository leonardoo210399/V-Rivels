"use client";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <div className="relative bg-slate-900 py-16 px-6 text-center border-b border-white/5">
        <h1 className="font-anton text-4xl md:text-6xl uppercase text-white mb-4">
          Terms of <span className="text-teal-500">Service</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Please read these terms carefully before participating in our tournaments.
        </p>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="bg-slate-900/50 p-8 md:p-12 rounded-xl border border-white/5 text-sm md:text-base leading-relaxed space-y-8">
          
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-teal-500 pl-4">1. Acceptance of Terms</h2>
            <p className="text-slate-400">
              By accessing or using the Valolant Tournament platform, you agree to be bound by these Terms of Service. If you do not agree, you may not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-teal-500 pl-4">2. Eligibility</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>You must be at least 13 years of age (or the minimum age of digital consent in your country).</li>
              <li>You must have a valid Valorant account in good standing.</li>
              <li>Employees and immediate family members of Valolant Tournament organizers may be restricted from winning prizes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-teal-500 pl-4">3. Code of Conduct</h2>
            <p className="text-slate-400">Users are expected to promote a healthy competitive environment. The following are strictly prohibited:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2 mt-2">
              <li>Cheating, hacking, or using unauthorized third-party software.</li>
              <li>Harassment, hate speech, or toxic behavior towards other players or staff.</li>
              <li>Match-fixing or colluding to alter the outcome of a game.</li>
              <li>Creating multiple accounts to bypass bans or manipulate rankings (smurfing rules apply).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-teal-500 pl-4">4. Payments and Payouts</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>Entry fees are non-refundable except as specified in our <Link href="/refund-policy" className="text-teal-500 hover:underline">Refund Policy</Link>.</li>
              <li>Prizes are distributed to the verified winner's account.</li>
              <li>You are responsible for any taxes associated with prize winnings in your jurisdiction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-teal-500 pl-4">5. Limitation of Liability</h2>
            <p className="text-slate-400">
              Valolant Tournament is not affiliated with Riot Games. We are not liable for any direct, indirect, incidental, or consequential damages resulting from your use of the service or participation in tournaments.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-teal-500 pl-4">6. Contact Information</h2>
             <div className="mt-4 bg-slate-800/50 p-4 rounded-lg inline-block text-slate-300">
              <p>Email: <a href="mailto:aditya210399@gmail.com" className="text-teal-400 hover:underline">aditya210399@gmail.com</a></p>
              <p>Phone: <span className="text-teal-400">+91 90284 10543</span></p>
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
