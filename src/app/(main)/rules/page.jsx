"use client";
import Link from "next/link";
import { Shield, Users, Monitor, Gavel } from "lucide-react";

export default function RulesAndRegulations() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <div className="relative bg-slate-900 py-16 px-6 text-center border-b border-white/5">
        <h1 className="font-anton text-4xl md:text-6xl uppercase text-white mb-4">
          Rules & <span className="text-rose-500">Regulations</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          To ensure fair play and a competitive environment, all participants must adhere to the following rules.
        </p>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="space-y-8">
          
          {/* Section 1: General */}
          <section className="bg-slate-900/50 p-8 rounded-xl border border-white/5 hover:border-rose-500/20 transition-all">
            <div className="flex items-center gap-4 mb-6">
                <div className="bg-rose-500/10 p-3 rounded-lg text-rose-500">
                    <Shield size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white uppercase">1. General Integrity</h2>
            </div>
            <ul className="list-disc list-inside space-y-3 text-slate-400 ml-2">
              <li><strong>Zero Tolerance for Cheating:</strong> Any use of third-party software (aimbots, wallhacks, macros) will result in an immediate permanent ban.</li>
              <li><strong>Respectful Conduct:</strong> Toxicity, hate speech, or harassment towards other players or admins is strictly prohibited.</li>
              <li><strong>Account Sharing:</strong> You must play on your own account. Account sharing or "ringing" (playing for another team) is forbidden.</li>
            </ul>
          </section>

          {/* Section 2: Tournament Procedures */}
          <section className="bg-slate-900/50 p-8 rounded-xl border border-white/5 hover:border-rose-500/20 transition-all">
            <div className="flex items-center gap-4 mb-6">
                <div className="bg-rose-500/10 p-3 rounded-lg text-rose-500">
                    <Users size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white uppercase">2. Tournament Procedures</h2>
            </div>
            <ul className="list-disc list-inside space-y-3 text-slate-400 ml-2">
              <li><strong>Check-in:</strong> Teams must check in 30 minutes before the scheduled start time. Failure to check in results in disqualification.</li>
              <li><strong>Punctuality:</strong> Teams have 10 minutes from the match start time to join the lobby. If a team is not ready, they forfeit the map.</li>
              <li><strong>Roster Lock:</strong> Rosters are locked once the tournament bracket is generated. No substitutes can be added mid-tournament unless explicitly allowed by admins.</li>
            </ul>
          </section>

           {/* Section 3: In-Game Rules */}
           <section className="bg-slate-900/50 p-8 rounded-xl border border-white/5 hover:border-rose-500/20 transition-all">
            <div className="flex items-center gap-4 mb-6">
                <div className="bg-rose-500/10 p-3 rounded-lg text-rose-500">
                    <Monitor size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white uppercase">3. In-Game Rules</h2>
            </div>
            <ul className="list-disc list-inside space-y-3 text-slate-400 ml-2">
              <li><strong>Map Pool:</strong> The active competitive map pool will be used for all matches.</li>
              <li><strong>Pauses:</strong> Each team is allowed one tactical pause per half. Technical pauses can be called for connection issues but must be communicated to the other team.</li>
              <li><strong>Exploits:</strong> Using map exploits or bugs (e.g., getting into unintended areas) causes an immediate round loss or map forfeit.</li>
            </ul>
          </section>

          {/* Section 4: Disputes */}
          <section className="bg-slate-900/50 p-8 rounded-xl border border-white/5 hover:border-rose-500/20 transition-all">
            <div className="flex items-center gap-4 mb-6">
                <div className="bg-rose-500/10 p-3 rounded-lg text-rose-500">
                    <Gavel size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white uppercase">4. Disputes & Reporting</h2>
            </div>
            <p className="text-slate-400 mb-4">
                If you suspect a violation of these rules, you must capture proof (screenshots, video recording).
            </p>
            <ul className="list-disc list-inside space-y-3 text-slate-400 ml-2">
              <li><strong>Evidence:</strong> Admins will only act on solid evidence. "He seems suspicious" is not enough.</li>
              <li><strong>Reporting:</strong> Open a ticket in our Support center immediately after the match. Do not spam admins.</li>
              <li><strong>Final Decision:</strong> Admin decisions are final and binding in all disputes.</li>
            </ul>
          </section>

          <div className="mt-12 text-center">
            <p className="text-slate-400 mb-6">
                Detailed specifics for each tournament type (Deathmatch vs 5v5) can be found on individual tournament pages.
            </p>
            <Link href="/support" className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-8 rounded-full transition-all hover:scale-105">
                Contact Support for Clarifications
            </Link>
          </div>

          <div className="border-t border-slate-800 pt-8 mt-12 text-center text-xs text-slate-500">
            <p>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
