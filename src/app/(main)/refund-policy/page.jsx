"use client";
import Link from "next/link";

export default function RefundPolicy() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-200">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 right-0 left-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-rose-500 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
      </div>

      {/* Hero Section */}
      <div className="relative border-b border-white/5 bg-slate-900/40 px-6 py-16 text-center backdrop-blur-sm md:py-24">
        <h1 className="font-anton mb-6 text-4xl text-white uppercase md:text-7xl">
          Refund <span className="text-rose-500">Policy</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
          Transparency is key. Review our policies regarding digital services,
          tournament fees, and dispute resolution.
        </p>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-16">
        <div className="space-y-8 rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md md:space-y-10 md:p-12">
          {/* Section 1 */}
          <section className="border-b border-white/5 pb-8 md:pb-10">
            <div className="mb-4 flex items-center gap-3 md:gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 font-bold text-rose-500">
                01
              </span>
              <h2 className="font-anton text-xl text-white uppercase md:text-3xl">
                Digital Services & Subscriptions
              </h2>
            </div>
            <div className="space-y-4 pl-0 leading-relaxed text-slate-400 md:pl-14">
              <p className="text-sm md:text-base">
                VRivals Arena primarily offers digital services, including
                premium subscriptions and tournament entry processing.
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm md:text-base">
                <li>
                  <strong className="text-slate-200">Non-Refundable:</strong>{" "}
                  Services that have been fully rendered (e.g., a played
                  tournament, a consumed premium month) are generally
                  non-refundable.
                </li>
                <li>
                  <strong className="text-slate-200">Exceptions:</strong> If a
                  system error prevents you from accessing a paid service, a
                  full refund will be issued upon erasing the error log.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="border-b border-white/5 pb-8 md:pb-10">
            <div className="mb-4 flex items-center gap-3 md:gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 font-bold text-rose-500">
                02
              </span>
              <h2 className="font-anton text-xl text-white uppercase md:text-3xl">
                Tournament Entry Fees
              </h2>
            </div>
            <div className="space-y-4 pl-0 leading-relaxed text-slate-400 md:pl-14">
              <p className="text-sm md:text-base">
                We strive to ensure fair play. Eligibility for entry fee refunds
                is as follows:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm md:text-base">
                <li>
                  <strong className="text-slate-200">
                    Cancellations by VRivals:
                  </strong>{" "}
                  If an event is cancelled by the administration, 100% of the
                  entry fee will be refunded automatically.
                </li>
                <li>
                  <strong className="text-slate-200">User Withdrawal:</strong>{" "}
                  Review the specific tournament rules. Generally, entry fees
                  are refundable if you withdraw at least{" "}
                  <strong>24 hours</strong> before the bracket generation or
                  check-in time.
                </li>
                <li>
                  <strong className="text-slate-200">Disqualification:</strong>{" "}
                  Fees are <strong>NOT</strong> refunded if a player or team is
                  disqualified for violating rules (e.g., cheating, toxicity,
                  no-show).
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="border-b border-white/5 pb-8 md:pb-10">
            <div className="mb-4 flex items-center gap-3 md:gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 font-bold text-rose-500">
                03
              </span>
              <h2 className="font-anton text-xl text-white uppercase md:text-3xl">
                Processing Timelines
              </h2>
            </div>
            <div className="space-y-4 pl-0 leading-relaxed text-slate-400 md:pl-14">
              <p className="text-sm md:text-base">
                Approved refunds are processed back to the original payment
                method.
              </p>
              <div className="rounded-xl border border-white/5 bg-slate-950/50 p-4">
                <p className="mb-2 text-sm font-bold text-white">
                  Estimated Times:
                </p>
                <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  <li className="flex justify-between border-b border-white/5 pb-2">
                    <span>Wallet/Credits</span>{" "}
                    <span className="text-rose-400">Instant - 24 Hours</span>
                  </li>
                  <li className="flex justify-between border-b border-white/5 pb-2">
                    <span>UPI / Bank Transfer</span>{" "}
                    <span className="text-rose-400">5 - 7 Business Days</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="mb-4 flex items-center gap-3 md:gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 font-bold text-rose-500">
                04
              </span>
              <h2 className="font-anton text-xl text-white uppercase md:text-3xl">
                Contact & Disputes
              </h2>
            </div>
            <div className="pl-0 md:pl-14">
              <p className="mb-6 text-slate-400">
                If you believe a transaction was made in error or have a dispute
                regarding a match result affecting a prize, contact us
                immediately.
              </p>

              <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-900/10 to-transparent p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="font-bold tracking-wide text-white uppercase">
                    Contact Support
                  </h4>
                  <p className="text-sm text-slate-400">
                    Disputes must be raised within <strong>7 days</strong>.
                  </p>
                </div>
                <div className="flex flex-col gap-3 text-sm md:items-end">
                  <a
                    href="mailto:support@vrivalsarena.com"
                    className="text-white transition-colors hover:text-rose-400"
                  >
                    support@vrivalsarena.com
                  </a>
                  <span className="text-slate-500">+91 9356832187</span>
                  <span className="text-slate-500">
                    Krishna Apartment, Nigdi
                  </span>
                </div>
              </div>
            </div>
          </section>

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
