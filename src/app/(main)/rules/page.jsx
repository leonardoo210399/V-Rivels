"use client";
import Link from "next/link";
import { Shield, Users, Monitor, Gavel } from "lucide-react";

export default function RulesAndRegulations() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-200">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 right-0 left-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-rose-500 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
      </div>

      {/* Hero Section */}
      {/* Hero Section */}
      <div className="relative border-b border-white/5 bg-slate-900/40 px-6 py-16 text-center backdrop-blur-sm md:py-24">
        <h1 className="font-anton mb-6 text-4xl text-white uppercase md:text-7xl">
          Rules & <span className="text-rose-500">Regulations</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
          To ensure fair play and a competitive environment, all participants
          must adhere to the following rules.
        </p>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="space-y-6">
          {/* Section 1: General */}
          <section className="group rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md transition-all hover:border-rose-500/20 hover:bg-slate-900/60 md:p-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-rose-500 shadow-lg transition-transform duration-300 group-hover:scale-110 md:h-14 md:w-14">
                <Shield size={24} className="md:h-7 md:w-7" />
              </div>
              <h2 className="font-anton text-2xl text-white uppercase md:text-3xl">
                1. General Integrity
              </h2>
            </div>
            <ul className="list-disc space-y-4 pl-6 text-sm leading-relaxed text-slate-400 md:text-base">
              <li>
                <strong className="text-white">
                  Zero Tolerance for Cheating:
                </strong>{" "}
                Any use of third-party software (aimbots, wallhacks, macros)
                will result in an immediate permanent ban.
              </li>
              <li>
                <strong className="text-white">Respectful Conduct:</strong>{" "}
                Toxicity, hate speech, or harassment towards other players or
                admins is strictly prohibited.
              </li>
              <li>
                <strong className="text-white">Account Sharing:</strong> You
                must play on your own account. Account sharing or "ringing"
                (playing for another team) is forbidden.
              </li>
            </ul>
          </section>

          {/* Section 2: Tournament Procedures */}
          <section className="group rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md transition-all hover:border-rose-500/20 hover:bg-slate-900/60 md:p-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-blue-500 shadow-lg transition-transform duration-300 group-hover:scale-110 md:h-14 md:w-14">
                <Users size={24} className="md:h-7 md:w-7" />
              </div>
              <h2 className="font-anton text-2xl text-white uppercase md:text-3xl">
                2. Tournament Procedures
              </h2>
            </div>
            <ul className="list-disc space-y-4 pl-6 text-sm leading-relaxed text-slate-400 md:text-base">
              <li>
                <strong className="text-white">Check-in:</strong> Teams must
                check in 30 minutes before the scheduled start time. Failure to
                check in results in disqualification.
              </li>
              <li>
                <strong className="text-white">Punctuality:</strong> Teams have
                10 minutes from the match start time to join the lobby. If a
                team is not ready, they forfeit the map.
              </li>
              <li>
                <strong className="text-white">Roster Lock:</strong> Rosters are
                locked once the tournament bracket is generated. No substitutes
                can be added mid-tournament unless explicitly allowed by admins.
              </li>
            </ul>
          </section>

          {/* Section 3: In-Game Rules */}
          <section className="group rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md transition-all hover:border-rose-500/20 hover:bg-slate-900/60 md:p-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-emerald-500 shadow-lg transition-transform duration-300 group-hover:scale-110 md:h-14 md:w-14">
                <Monitor size={24} className="md:h-7 md:w-7" />
              </div>
              <h2 className="font-anton text-2xl text-white uppercase md:text-3xl">
                3. In-Game Rules
              </h2>
            </div>
            <ul className="list-disc space-y-4 pl-6 text-sm leading-relaxed text-slate-400 md:text-base">
              <li>
                <strong className="text-white">Map Pool:</strong> The active
                competitive map pool will be used for all matches.
              </li>
              <li>
                <strong className="text-white">Pauses:</strong> Each team is
                allowed one tactical pause per half. Technical pauses can be
                called for connection issues but must be communicated to the
                other team.
              </li>
              <li>
                <strong className="text-white">Exploits:</strong> Using map
                exploits or bugs (e.g., getting into unintended areas) causes an
                immediate round loss or map forfeit.
              </li>
            </ul>
          </section>

          {/* Section 4: Disputes */}
          <section className="group rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md transition-all hover:border-rose-500/20 hover:bg-slate-900/60 md:p-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-amber-500 shadow-lg transition-transform duration-300 group-hover:scale-110 md:h-14 md:w-14">
                <Gavel size={24} className="md:h-7 md:w-7" />
              </div>
              <h2 className="font-anton text-2xl text-white uppercase md:text-3xl">
                4. Disputes & Reporting
              </h2>
            </div>
            <p className="mb-4 text-sm text-slate-400 md:text-base">
              If you suspect a violation of these rules, you must capture proof
              (screenshots, video recording).
            </p>
            <ul className="list-disc space-y-4 pl-6 text-sm leading-relaxed text-slate-400 md:text-base">
              <li>
                <strong className="text-white">Evidence:</strong> Admins will
                only act on solid evidence. "He/She seems suspicious" is not
                enough.
              </li>
              <li>
                <strong className="text-white">Reporting:</strong> Open a ticket
                in our Support center immediately after the match. Do not spam
                admins.
              </li>
              <li>
                <strong className="text-white">Final Decision:</strong> Admin
                decisions are final and binding in all disputes.
              </li>
            </ul>
          </section>

          <div className="mt-8 text-center">
            <p className="mb-6 text-slate-400">
              Detailed specifics for each tournament type (Deathmatch vs 5v5)
              can be found on individual tournament pages.
            </p>
            <Link
              href="/support"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-8 py-4 font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-105 hover:shadow-rose-500/40"
            >
              Contact Support for Clarifications
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>

          <div className="mt-8 border-t border-white/5 pt-8 text-center text-xs tracking-widest text-slate-600 uppercase">
            <p>
              Last Updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
