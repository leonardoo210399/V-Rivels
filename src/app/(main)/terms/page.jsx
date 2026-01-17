"use client";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <div className="relative border-b border-white/5 bg-slate-900 px-6 py-16 text-center">
        <h1 className="font-anton mb-4 text-4xl text-white uppercase md:text-6xl">
          Terms of <span className="text-rose-500">Service</span>
        </h1>
        <p className="mx-auto max-w-2xl text-slate-400">
          Please read these terms carefully before participating in our
          tournaments.
        </p>
      </div>

      <div className="container mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8 rounded-xl border border-white/5 bg-slate-900/50 p-8 text-sm leading-relaxed md:p-12 md:text-base">
          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              1. Acceptance of Terms
            </h2>
            <p className="text-slate-400">
              By accessing or using the VRivals Arena platform, you agree to be
              bound by these Terms of Service. If you do not agree, you may not
              use our services.
            </p>
          </section>

          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              2. Eligibility
            </h2>
            <ul className="ml-2 list-inside list-disc space-y-2 text-slate-400">
              <li>
                You must be at least 13 years of age (or the minimum age of
                digital consent in your country).
              </li>
              <li>You must have a valid Valorant account in good standing.</li>
              <li>
                Employees and immediate family members of VRivals Arena
                organizers may be restricted from winning prizes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              3. Code of Conduct
            </h2>
            <p className="text-slate-400">
              Users are expected to promote a healthy competitive environment.
              The following are strictly prohibited:
            </p>
            <ul className="mt-2 ml-2 list-inside list-disc space-y-2 text-slate-400">
              <li>
                Cheating, hacking, or using unauthorized third-party software.
              </li>
              <li>
                Harassment, hate speech, or toxic behavior towards other players
                or staff.
              </li>
              <li>Match-fixing or colluding to alter the outcome of a game.</li>
              <li>
                Creating multiple accounts to bypass bans or manipulate rankings
                (smurfing rules apply).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              4. Payments and Payouts
            </h2>
            <ul className="ml-2 list-inside list-disc space-y-2 text-slate-400">
              <li>
                Entry fees are non-refundable except as specified in our{" "}
                <Link
                  href="/refund-policy"
                  className="text-rose-500 hover:underline"
                >
                  Refund Policy
                </Link>
                .
              </li>
              <li>Prizes are distributed to the verified winner's account.</li>
              <li>
                You are responsible for any taxes associated with prize winnings
                in your jurisdiction.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              5. Limitation of Liability
            </h2>
            <p className="text-slate-400">
              VRivals Arena is not affiliated with Riot Games. We are not liable
              for any direct, indirect, incidental, or consequential damages
              resulting from your use of the service or participation in
              tournaments.
            </p>
          </section>

          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              6. Contact Information
            </h2>
            <div className="mt-4 inline-block rounded-lg bg-slate-800/50 p-4 text-slate-300">
              <p>
                Email:{" "}
                <a
                  href="mailto:aditya210399@gmail.com"
                  className="text-rose-400 hover:underline"
                >
                  aditya210399@gmail.com
                </a>
              </p>
              <p>
                Phone: <span className="text-rose-400">+91 90284 10543</span>
              </p>
            </div>
          </section>

          <div className="mt-12 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
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
