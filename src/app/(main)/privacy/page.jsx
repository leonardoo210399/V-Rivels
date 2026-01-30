"use client";
import Link from "next/link";

export default function PrivacyPolicy() {
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
          Privacy <span className="text-rose-500">Policy</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
          We value your trust and are committed to protecting your personal
          information.
        </p>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-16">
        <div className="space-y-8 rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md md:space-y-10 md:p-12">
          {/* Section 1: Introduction */}
          <section className="border-b border-white/5 pb-8 md:pb-10">
            <div className="mb-4 flex items-center gap-3 md:gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-sm font-bold text-rose-500">
                01
              </span>
              <h2 className="font-anton text-xl text-white uppercase md:text-2xl">
                Introduction
              </h2>
            </div>
            <p className="pl-11 text-sm leading-relaxed text-slate-400 md:pl-12 md:text-base">
              This Privacy Policy describes how <strong>VRivals Arena</strong>{" "}
              and its affiliates (collectively "VRivals Arena, we, our, us")
              collect, use, share, protect or otherwise process your
              information/personal data through our website
              https://vrivalsarena.com (hereinafter referred to as Platform). By
              visiting this Platform, providing your information or availing any
              product/service offered on the Platform, you expressly agree to be
              bound by the terms and conditions of this Privacy Policy, the
              Terms of Use and the applicable service/product terms and
              conditions.
            </p>
          </section>

          {/* Section 2: Collection */}
          <section className="border-b border-white/5 pb-8 md:pb-10">
            <div className="mb-4 flex items-center gap-3 md:gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-sm font-bold text-rose-500">
                02
              </span>
              <h2 className="font-anton text-xl text-white uppercase md:text-2xl">
                Collection
              </h2>
            </div>
            <div className="space-y-4 pl-11 text-sm leading-relaxed text-slate-400 md:pl-12 md:text-base">
              <p>
                We collect your personal data when you use our Platform,
                services or otherwise interact with us. Some of the information
                we may collect includes:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Personal Information:</strong> Name, date of birth,
                  email ID, mobile number, and gaming IDs (e.g., Riot ID).
                </li>
                <li>
                  <strong>Payment Information:</strong> Sensitive personal data
                  such as bank account or payment instrument details may be
                  collected with your consent to facilitate transactions.
                </li>
                <li>
                  <strong>Usage Data:</strong> We may track your behavior,
                  preferences, and transaction history on our Platform to
                  improve your experience.
                </li>
              </ul>
              <div className="mt-4 rounded-lg border border-rose-500/10 bg-rose-500/5 p-4 text-xs">
                <strong>Security Alert:</strong> If you receive an email or call
                claiming to be VRivals Arena seeking sensitive data like PINs or
                passwords, never provide such information. We will never ask for
                your password via email or phone.
              </div>
            </div>
          </section>

          {/* Section 3: Usage */}
          <section className="border-b border-white/5 pb-8 md:pb-10">
            <div className="mb-4 flex items-center gap-3 md:gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-sm font-bold text-rose-500">
                03
              </span>
              <h2 className="font-anton text-xl text-white uppercase md:text-2xl">
                Usage
              </h2>
            </div>
            <p className="pl-11 text-sm leading-relaxed text-slate-400 md:pl-12 md:text-base">
              We use personal data to provide the services you request,
              including: organizing tournaments, processing entry fees,
              distributing prizes, resolving disputes, and enhancing customer
              experience. We also use data to detect and protect against error,
              fraud, and other criminal activity, and to enforce our terms and
              conditions.
            </p>
          </section>

          {/* Section 4: Sharing */}
          <section className="border-b border-white/5 pb-8 md:pb-10">
            <div className="mb-4 flex items-center gap-3 md:gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-sm font-bold text-rose-500">
                04
              </span>
              <h2 className="font-anton text-xl text-white uppercase md:text-2xl">
                Sharing
              </h2>
            </div>
            <p className="pl-11 text-sm leading-relaxed text-slate-400 md:pl-12 md:text-base">
              We may share your personal data internally within our group
              entities to provide you access to services. We may disclose
              personal data to third parties such as business partners and
              prepaid payment instrument issuers. These disclosures may be
              required for us to provide you access to our services, comply with
              legal obligations, or prevent fraudulent activities. We may also
              disclose data to law enforcement agencies if required by law.
            </p>
          </section>

          {/* Section 5: Security */}
          <section className="border-b border-white/5 pb-8 md:pb-10">
            <div className="mb-4 flex items-center gap-3 md:gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-sm font-bold text-rose-500">
                05
              </span>
              <h2 className="font-anton text-xl text-white uppercase md:text-2xl">
                Security
              </h2>
            </div>
            <p className="pl-11 text-sm leading-relaxed text-slate-400 md:pl-12 md:text-base">
              We adopt reasonable security practices to protect your data.
              However, transmission of information over the internet is not
              completely secure. By using the Platform, you accept the inherent
              security risks of data transmission. Users are responsible for
              protecting their login credentials.
            </p>
          </section>

          {/* Section 6: Data Deletion */}
          <section className="border-b border-white/5 pb-8 md:pb-10">
            <div className="mb-4 flex items-center gap-3 md:gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-sm font-bold text-rose-500">
                06
              </span>
              <h2 className="font-anton text-xl text-white uppercase md:text-2xl">
                Retention & Deletion
              </h2>
            </div>
            <p className="pl-11 text-sm leading-relaxed text-slate-400 md:pl-12 md:text-base">
              You may delete your account via your profile settings. This will
              result in the loss of all account-related information. We may
              refuse or delay deletion if there are pending grievances, claims,
              or active services. We retain personal data only as long as
              required for the purpose collected or as mandated by law.
            </p>
          </section>

          {/* Section 7: Consent */}
          <section className="border-b border-white/5 pb-8 md:pb-10">
            <div className="mb-4 flex items-center gap-3 md:gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-sm font-bold text-rose-500">
                07
              </span>
              <h2 className="font-anton text-xl text-white uppercase md:text-2xl">
                Consent
              </h2>
            </div>
            <p className="pl-11 text-sm leading-relaxed text-slate-400 md:pl-12 md:text-base">
              By visiting our Platform, you consent to the processing of your
              information in accordance with this Policy. You may withdraw your
              consent by writing to our Grievance Officer, though this may
              restrict your access to certain services.
            </p>
          </section>

          {/* Section 8: Contact */}
          <section>
            <div className="mb-4 flex items-center gap-3 md:gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-sm font-bold text-rose-500">
                08
              </span>
              <h2 className="font-anton text-xl text-white uppercase md:text-2xl">
                Contact Us
              </h2>
            </div>
            <div className="pl-0 md:pl-12">
              <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-slate-950/50 p-6 md:flex-row">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    Entity
                  </p>
                  <p className="font-medium text-white">
                    VRivals Arena Support
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    Email
                  </p>
                  <a
                    href="mailto:support@vrivalsarena.com"
                    className="font-medium text-rose-400 transition-colors hover:text-rose-300"
                  >
                    support@vrivalsarena.com
                  </a>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    Phone
                  </p>
                  <p className="font-medium text-white">9356832187</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    Address
                  </p>
                  <p className="text-sm text-slate-300">
                    Krishna Apartment, Nigdi
                  </p>
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
