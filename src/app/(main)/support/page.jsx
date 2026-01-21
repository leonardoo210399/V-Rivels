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
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <div className="relative border-b border-white/5 bg-slate-900 px-6 py-20 text-center">
        <h1 className="font-anton mb-6 text-5xl text-white uppercase md:text-7xl">
          Support <span className="text-rose-500">Center</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-400">
          Need help? We're here for you. Find answers to common questions or get
          in touch with our team directly.
        </p>
      </div>

      <div className="container mx-auto px-6 py-16">
        {/* Contact Cards */}
        <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="group rounded-xl border border-white/5 bg-slate-900/50 p-8 transition-all hover:border-rose-500/50">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 transition-colors group-hover:bg-rose-500">
              <Mail className="text-white" size={24} />
            </div>
            <h3 className="mb-3 text-xl font-bold text-white">Email Support</h3>
            <p className="mb-4 text-slate-400">
              For general inquiries and account issues.
            </p>
            <a
              href="mailto:support@vrivalsarena.com"
              className="font-medium text-rose-400 hover:text-rose-300"
            >
              support@vrivalsarena.com
            </a>
          </div>

          <div className="group rounded-xl border border-white/5 bg-slate-900/50 p-8 transition-all hover:border-rose-500/50">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 transition-colors group-hover:bg-rose-500">
              <MessageSquare className="text-white" size={24} />
            </div>
            <h3 className="mb-3 text-xl font-bold text-white">
              Discord Community
            </h3>
            <p className="mb-4 text-slate-400">
              Get real-time help from mods and the community.
            </p>
            <a
              href="https://discord.gg/vrivals"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-rose-400 hover:text-rose-300"
            >
              Join Discord Server
            </a>
          </div>

          <div className="group rounded-xl border border-white/5 bg-slate-900/50 p-8 transition-all hover:border-rose-500/50">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 transition-colors group-hover:bg-rose-500">
              <FileText className="text-white" size={24} />
            </div>
            <h3 className="mb-3 text-xl font-bold text-white">Documentation</h3>
            <p className="mb-4 text-slate-400">
              Read our rules, terms, and guides.
            </p>
            <a
              href="/rules"
              className="font-medium text-rose-400 hover:text-rose-300"
            >
              View Rules & FAQ
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Contact Form */}
          <div>
            <h2 className="font-anton mb-8 border-l-4 border-rose-500 pl-4 text-3xl text-white">
              Send us a Message
            </h2>

            {success && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 text-emerald-400">
                <div className="rounded-full bg-emerald-500 p-1">
                  <Send size={12} className="text-slate-950" />
                </div>
                <p className="text-sm font-bold">
                  Message received! We'll get back to you shortly.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* ... fields ... */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-400">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white transition-colors focus:border-rose-500 focus:outline-none"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-400">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white transition-colors focus:border-rose-500 focus:outline-none"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Subject
                </label>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white transition-colors focus:border-rose-500 focus:outline-none"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Select a topic
                  </option>
                  <option value="General">General Inquiry</option>
                  <option value="Technical">Technical Issue</option>
                  <option value="Billing">Billing / Payments</option>
                  <option value="Report">Report a Player</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white transition-colors focus:border-rose-500 focus:outline-none"
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-rose-500 px-8 py-4 font-bold text-slate-900 transition-all hover:translate-x-1 hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Message"} <Send size={18} />
              </button>
            </form>
          </div>

          {/* FAQ Accordion */}
          <div>
            <h2 className="font-anton mb-8 border-l-4 border-rose-500 pl-4 text-3xl text-white">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50"
                >
                  <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between p-6 font-medium text-white transition-colors hover:text-rose-400">
                      {faq.question}
                      <span className="transform transition-transform group-open:rotate-180">
                        <HelpCircle size={20} />
                      </span>
                    </summary>
                    <div className="border-t border-slate-800/50 px-6 pt-4 pb-6 leading-relaxed text-slate-400">
                      {faq.answer}
                    </div>
                  </details>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-rose-500/20 bg-gradient-to-r from-rose-900/20 to-slate-900 p-6">
              <h4 className="mb-2 font-bold text-white">
                Still have questions?
              </h4>
              <p className="mb-4 text-sm text-slate-400">
                Our support team is available 24/7 to assist you with any
                inquiries.
              </p>
              <a
                href="mailto:support@vrivalsarena.com"
                className="text-sm font-bold text-rose-400 hover:underline"
              >
                Contact Support &rarr;
              </a>
            </div>
          </div>
        </div>
        {/* Business Details - Required for Payment Gateways */}
        <div className="mt-20 border-t border-slate-800 pt-10 text-center">
          <h3 className="mb-6 text-sm font-bold tracking-wide text-white uppercase">
            Official Business Details
          </h3>
          <div className="flex flex-col justify-center gap-10 text-sm text-slate-400 md:flex-row">
            <div className="inline-block text-left">
              <p className="mb-2 font-bold text-slate-300">VRivals Arena</p>
              <p>Email: support@vrivalsarena.com</p>
              <p>Phone: 9356832187</p>
              <p>Address: Krishna Apartment, Nigdi</p>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-xs text-slate-500">
            Note: For payment related disputes, please contact us within 24
            hours of the transaction. Refunds are processed according to our{" "}
            <a href="/refund-policy" className="text-rose-500 hover:underline">
              Refund Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
