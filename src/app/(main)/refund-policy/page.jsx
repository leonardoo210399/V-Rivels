"use client";
import Link from "next/link";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <div className="relative bg-slate-900 py-16 px-6 text-center border-b border-white/5">
        <h1 className="font-anton text-4xl md:text-6xl uppercase text-white mb-4">
          Refund <span className="text-rose-500">Policy</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Transparency and fairness are core to our platform. Please read our refund policy carefully.
        </p>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="bg-slate-900/50 p-8 md:p-12 rounded-xl border border-white/5 text-sm md:text-base leading-relaxed space-y-8">
          
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-rose-500 pl-4">1. General Policy</h2>
            <p className="text-slate-400">
              We strive to provide a seamless competitive experience. However, we understand that issues may arise. 
              Refunds are generally processed within 5-7 business days to the original payment method once approved.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-rose-500 pl-4">2. Tournament Entry Fees</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>
                <strong className="text-slate-200">Tournament Cancellation:</strong> If a tournament is cancelled by the organizers for any reason (e.g., server issues, insufficient participation), all entry fees will be refunded automatically 100%.
              </li>
              <li>
                <strong className="text-slate-200">Withdrawal before Check-in:</strong> If you withdraw your team from a tournament before the check-in period begins, you are eligible for a full refund.
              </li>
              <li>
                <strong className="text-slate-200">Disqualification:</strong> Teams or players disqualified for violating our <Link href="/rules" className="text-rose-500 hover:underline">Rules & Regulations</Link> (cheating, toxicity, etc.) are <strong className="text-red-400">NOT</strong> eligible for refunds.
              </li>
              <li>
                <strong className="text-slate-200">No-Shows:</strong> If you register but fail to show up for your match ("No-Show"), no refund will be provided.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-rose-500 pl-4">3. Subscription Services</h2>
            <p className="text-slate-400">
              For any premium memberships or subscription services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2 mt-2">
              <li>You may cancel your subscription at any time.</li>
              <li>Refunds for unused time on a subscription are generally not provided unless required by local law.</li>
              <li>If you believe you were charged in error, please contact support immediately.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-rose-500 pl-4">4. Dispute Resolution</h2>
            <p className="text-slate-400">
              If you have an issue with a transaction, please contact us first before initiating a chargeback with your bank. 
              We are committed to resolving legitimate disputes fairly. Unjustified chargebacks may result in a permanent ban from the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 border-l-4 border-rose-500 pl-4">5. Contact Us</h2>
            <p className="text-slate-400">
              To request a refund or if you have questions about this policy, please reach out to our support team:
            </p>
            <div className="mt-4 bg-slate-800/50 p-4 rounded-lg inline-block text-slate-300">
              <p>Email: <a href="mailto:aditya210399@gmail.com" className="text-rose-400 hover:underline">aditya210399@gmail.com</a></p>
              <p>Phone: <span className="text-rose-400">+91 90284 10543</span></p>
            </div>
            <div className="mt-6">
                 <Link href="/support" className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Go to Support Page
                 </Link>
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
