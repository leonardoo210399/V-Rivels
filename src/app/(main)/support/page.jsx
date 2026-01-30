"use client";
import { useState, useEffect } from "react";
import { Mail, MessageSquare, HelpCircle, FileText, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SupportPage() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  // Import appwrite locally to avoid top-level SSR issues if any
  // But usually we import at top. Let's assume standard import at top.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { databases } = await import("@/lib/appwrite");
      const { ID } = await import("appwrite");

      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_SUPPORT_TICKETS_COLLECTION_ID, // Collection ID
        ID.unique(),
        {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          status: "open",
          createdAt: new Date().toISOString(),
        },
      );

      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSuccess(false), 5000); // Hide success msg after 5s
    } catch (error) {
      console.error("Failed to submit ticket", error);
      alert("Something went wrong. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      question: "How do I join a tournament?",
      answer:
        "Create an account, navigate to the 'Tournaments' page, select an active tournament, and click 'Register'. Make sure your team roster is complete if required.",
    },
    {
      question: "When are prizes distributed?",
      answer:
        "Prizes are usually processed within 24-48 hours after the tournament concludes. Winners will be contacted via email or Discord.",
    },
    {
      question: "I encountered a bug/issue. What should I do?",
      answer:
        "Please assume the issue is on your end first! If it persists, join our Discord and open a ticket in the #support channel, or use the contact form on this page.",
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-200">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 right-0 left-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-rose-500 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
      </div>

      <div className="relative container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <div className="mb-12 text-center md:mb-20">
          <div className="inline-flex items-center rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-sm font-medium text-rose-500 backdrop-blur-md">
            <span className="mr-2 flex h-2 w-2 items-center justify-center rounded-full bg-rose-500">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-rose-500"></span>
            </span>
            24/7 Support Active
          </div>
          <h1 className="font-anton mt-6 text-4xl text-white uppercase md:text-7xl">
            Support <span className="text-rose-500">Center</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 md:text-lg">
            Need assistance? We're here to help you get back in the game. Choose
            a support channel below or send us a direct message.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="mb-16 grid grid-cols-1 gap-4 md:mb-20 md:grid-cols-3 md:gap-6">
          {[
            {
              icon: <Mail className="text-rose-400" size={32} />,
              title: "Email Support",
              desc: "For general inquiries and account issues.",
              action: "support@vrivalsarena.com",
              href: "mailto:support@vrivalsarena.com",
            },
            {
              icon: <MessageSquare className="text-blue-400" size={32} />,
              title: "Discord Community",
              desc: "Get real-time help from mods and community.",
              action: "Join Server",
              href: "https://discord.gg/gexZcZzCHV",
            },
            {
              icon: <FileText className="text-amber-400" size={32} />,
              title: "Documentation",
              desc: "Read our rules, terms, and guides.",
              action: "View Guides",
              href: "/rules",
            },
          ].map((card, i) => (
            <a
              key={i}
              href={card.href}
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/30 hover:bg-slate-900/60 hover:shadow-[0_0_30px_-10px_rgba(244,63,94,0.3)] md:p-8"
            >
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-slate-950 shadow-lg transition-transform duration-300 group-hover:scale-110">
                {card.icon}
              </div>
              <h3 className="font-anton mb-2 text-2xl tracking-wide text-white uppercase">
                {card.title}
              </h3>
              <p className="mb-6 font-medium text-slate-400">{card.desc}</p>
              <div className="flex items-center text-sm font-bold text-white transition-colors group-hover:text-rose-500">
                {card.action} <span className="ml-2">→</span>
              </div>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
          {/* Contact Form */}
          <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md md:p-10">
            <h2 className="font-anton mb-8 text-3xl text-white uppercase md:text-4xl">
              Send a <span className="text-rose-500">Message</span>
            </h2>

            {success && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
                <div className="rounded-full bg-emerald-500 p-1">
                  <Send size={12} className="text-slate-950" />
                </div>
                <p className="text-sm font-bold">
                  Message received! We'll get back to you shortly.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white placeholder-slate-600 transition-all focus:border-rose-500 focus:bg-slate-950 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white placeholder-slate-600 transition-all focus:border-rose-500 focus:bg-slate-950 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Subject
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white transition-all focus:border-rose-500 focus:bg-slate-950 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Select a topic...
                    </option>
                    <option value="General">General Inquiry</option>
                    <option value="Technical">Technical Issue</option>
                    <option value="Billing">Billing / Payments</option>
                    <option value="Report">Report a Player</option>
                  </select>
                  <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate-500">
                    ▼
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white placeholder-slate-600 transition-all focus:border-rose-500 focus:bg-slate-950 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  placeholder="Tell us strictly what happened..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-8 py-4 font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] hover:shadow-rose-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* FAQ Accordion */}
          <div>
            <h2 className="font-anton mb-8 text-3xl text-white uppercase md:text-4xl">
              Common <span className="text-blue-500">Questions</span>
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="group overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-sm transition-all hover:border-white/10 hover:bg-slate-900/60"
                >
                  <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between p-6 font-bold text-white transition-colors hover:text-rose-400">
                      <span className="text-lg">{faq.question}</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition-all group-open:rotate-180 group-hover:bg-rose-500/20 group-hover:text-rose-500">
                        <HelpCircle size={18} />
                      </span>
                    </summary>
                    <div className="border-t border-white/5 px-6 pt-2 pb-6 leading-relaxed text-slate-400">
                      {faq.answer}
                    </div>
                  </details>
                </div>
              ))}
            </div>

            {/* Quick Contact Box */}
            <div className="mt-10 overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-900/10 to-transparent p-8 backdrop-blur-md">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="font-anton text-xl text-white uppercase">
                    Still Stuck?
                  </h4>
                  <p className="mt-1 text-sm text-slate-400">
                    Our team is available 24/7 on Discord.
                  </p>
                </div>
                <a
                  href="https://discord.gg/gexZcZzCHV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-white/5 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-rose-400"
                >
                  Front Desk Support
                </a>
              </div>
            </div>

            {/* Business Details */}
            <div className="mt-12 border-t border-white/5 pt-8">
              <h3 className="mb-4 text-xs font-bold tracking-[0.2em] text-slate-600 uppercase">
                Corporate Info
              </h3>
              <div className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-slate-500 md:grid-cols-2">
                <p>
                  <span className="text-slate-400">VRivals Arena</span>
                </p>
                <p>Krishna Apartment, Nigdi</p>
                <p>+91 9356832187</p>
                <p>support@vrivalsarena.com</p>
              </div>
              <p className="mt-6 text-xs text-slate-600">
                Disputes must be raised within 24h of transaction. See{" "}
                <a
                  href="/refund-policy"
                  className="text-rose-500/50 hover:text-rose-500 hover:underline"
                >
                  Refund Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
