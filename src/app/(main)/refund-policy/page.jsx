"use client";
import Link from "next/link";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <div className="relative border-b border-white/5 bg-slate-900 px-6 py-16 text-center">
        <h1 className="font-anton mb-4 text-4xl text-white uppercase md:text-6xl">
          Refund <span className="text-rose-500">Policy</span>
        </h1>
        <p className="mx-auto max-w-2xl text-slate-400">
          Transparency and fairness are core to our platform. Please read our
          refund policy carefully.
        </p>
      </div>

      <div className="container mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8 rounded-xl border border-white/5 bg-slate-900/50 p-8 text-sm leading-relaxed md:p-12 md:text-base">
          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              1. Cancellation Policy
            </h2>
            <p className="mb-4 text-slate-400">
              Cancellations will only be considered if the request is made
              within <strong>7 days</strong> of placing the order. However,
              cancellation requests may not be entertained if the orders have
              been communicated to such sellers/merchant(s) listed on the
              Platform and they have initiated the process of shipping them, or
              the product is out for delivery. In such an event, you may choose
              to reject the product at the doorstep.
            </p>
            <p className="text-slate-400">
              VRivals Arena does not accept cancellation requests for perishable
              items like flowers, eatables, etc. However, the refund/replacement
              can be made if the user establishes that the quality of the
              product delivered is not good.
            </p>
          </section>

          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              2. Damaged or Defective Items
            </h2>
            <p className="mb-4 text-slate-400">
              In case of receipt of damaged or defective items, please report to
              our customer service team. The request would be entertained once
              the seller/merchant listed on the Platform, has checked and
              determined the same at its own end. This should be reported within{" "}
              <strong>7 days</strong> of receipt of products.
            </p>
            <p className="text-slate-400">
              In case you feel that the product received is not as shown on the
              site or as per your expectations, you must bring it to the notice
              of our customer service within <strong>7 days</strong> of
              receiving the product. The customer service team after looking
              into your complaint will take an appropriate decision.
            </p>
          </section>

          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              3. Warranty & Processing
            </h2>
            <p className="mb-4 text-slate-400">
              In case of complaints regarding the products that come with a
              warranty from the manufacturers, please refer the issue to them.
            </p>
            <p className="text-slate-400">
              In case of any refunds approved by VRivals Arena, it will take{" "}
              <strong>7 days</strong> for the refund to be processed to you.
            </p>
          </section>

          <section>
            <h2 className="mb-4 border-l-4 border-rose-500 pl-4 text-xl font-bold text-white md:text-2xl">
              4. Contact Us
            </h2>
            <div className="mt-4 inline-block rounded-lg bg-slate-800/50 p-4 text-slate-300">
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
                <span className="font-bold text-white">Address:</span> Krishna
                Apartment, Nigdi
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
