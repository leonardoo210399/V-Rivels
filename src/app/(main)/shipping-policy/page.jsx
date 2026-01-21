"use client";
import Link from "next/link";

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <div className="relative border-b border-white/5 bg-slate-900 px-6 py-16 text-center">
        <h1 className="font-anton mb-4 text-4xl text-white uppercase md:text-6xl">
          Shipping & <span className="text-rose-500">Delivery</span>
        </h1>
        <p className="mx-auto max-w-2xl text-slate-400">
          Information regarding the delivery of our digital services.
        </p>
      </div>

      <div className="container mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8 rounded-xl border border-white/5 bg-slate-900/50 p-8 text-sm leading-relaxed md:p-12 md:text-base">
          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              1. Digital Service Delivery
            </h2>
            <p className="text-slate-400">
              VRivals Arena is a digital esports platform. We do not sell or
              ship physical products. All services, including tournament
              entries, subscriptions, and digital goods, are delivered
              electronically.
            </p>
          </section>

          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              2. Immediate Fulfillment
            </h2>
            <p className="text-slate-400">
              Upon successful payment, your access to the purchased service
              (e.g., tournament registration slot, premium features) is
              activated immediately. You will receive a confirmation email
              and/or on-screen notification verifying your purchase.
            </p>
          </section>

          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              3. Proof of Delivery
            </h2>
            <p className="text-slate-400">
              For every transaction, a unique Transaction ID is generated and
              linked to your account. This serves as proof of delivery for the
              digital service. You can view your transaction history in your
              profile settings.
            </p>
          </section>

          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              4. Issues with Access
            </h2>
            <p className="text-slate-400">
              If you have completed a payment but have not received the
              corresponding service access within 15 minutes, please contact our
              support team immediately with your transaction details.
            </p>
          </section>

          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              5. Contact Us
            </h2>
            <div className="mt-4 inline-block rounded-lg bg-slate-800/50 p-4 text-slate-300">
              <p className="mb-1">
                <span className="font-bold text-white">Entity Name:</span>{" "}
                VRivals Arena
              </p>
              <p className="mb-1">
                <span className="font-bold text-white">Email:</span>{" "}
                <a
                  href="mailto:support@vrivalsarena.com"
                  className="text-rose-400 hover:underline"
                >
                  support@vrivalsarena.com
                </a>
              </p>
              <p className="mb-1">
                <span className="font-bold text-white">Phone:</span>{" "}
                <span className="text-rose-400">9356832187</span>
              </p>
              <p>
                <span className="font-bold text-white">
                  Registered Address:
                </span>{" "}
                Krishna Apartment, Nigdi
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
