"use client";
import { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  Trophy,
  CreditCard,
  User,
  Settings,
  Search,
  Book,
} from "lucide-react";

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openCategory, setOpenCategory] = useState("general");
  const [openQuestion, setOpenQuestion] = useState(null);

  const categories = [
    {
      id: "general",
      name: "General Questions",
      icon: <HelpCircle className="h-5 w-5" />,
      description: "Basics about VRivals Arena platform",
    },
    {
      id: "tournaments",
      name: "Tournaments & Gameplay",
      icon: <Trophy className="h-5 w-5" />,
      description: "Joining, rules, and brackets",
    },
    {
      id: "payments",
      name: "Payments & Wallet",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Deposits, withdrawals, and refunds",
    },
    {
      id: "account",
      name: "Account & Profile",
      icon: <User className="h-5 w-5" />,
      description: "Management and verification",
    },
    {
      id: "technical",
      name: "Technical Support",
      icon: <Settings className="h-5 w-5" />,
      description: "Bugs and platform issues",
    },
  ];

  const faqs = {
    general: [
      {
        q: "What is VRivals Arena?",
        a: "VRivals Arena is a competitive esports platform hosted by Gamersback. We organize daily and weekly tournaments for popular titles like Valorant and BGMI, offering players a chance to compete for real cash prizes.",
      },
      {
        q: "Is it free to play?",
        a: "We offer both free-entry tournaments and paid-entry tournaments with larger prize pools. You can choose which ones to participate in based on your preference.",
      },
      {
        q: "How do I contact support?",
        a: "You can reach our support team via the Support page, email us at support@vrivalsarena.com, or join our Discord server for real-time assistance.",
      },
    ],
    tournaments: [
      {
        q: "How do I join a tournament?",
        a: "Navigate to the 'Tournaments' page, select an active tournament that is 'Open for Registration', and click the 'Register' button. You may need to create a team or join one depending on the tournament format.",
      },
      {
        q: "What happens if I miss my match?",
        a: "If you fail to check in or show up for your match within the grace period (usually 10-15 minutes), you will be disqualified, and your opponent will be given a bye/win.",
      },
      {
        q: "How are brackets generated?",
        a: "Brackets are automatically seeded and generated once registration closes. You can view the bracket on the tournament details page.",
      },
      {
        q: "How do I report scores?",
        a: "After your match is complete, take a screenshot of the final scoreboard. Go to your match page and upload the screenshot as proof. Admin verification may be required for some matches.",
      },
    ],
    payments: [
      {
        q: "How do I deposit money?",
        a: "Go to your Wallet/Profile section and click on 'Add Money'. We support UPI and major payment gateways. Follow the on-screen instructions to complete the transaction.",
      },
      {
        q: "When will I receive my prize money?",
        a: "Winnings are credited to your VRivals wallet within 24-48 hours after the tournament concludes. You can then use it for other tournaments or withdraw it.",
      },
      {
        q: "What is the refund policy?",
        a: "If a tournament is cancelled by us, you will receive a full refund. If you withdraw from a tournament before registration closes, you are eligible for a refund. See our Refund Policy page for full details.",
      },
      {
        q: "Are there withdrawal fees?",
        a: "We may deduct a small processing fee for withdrawals depending on the payment method used. The exact amount will be shown before you confirm your withdrawal.",
      },
    ],
    account: [
      {
        q: "How do I verify my account?",
        a: "Go to your Profile settings. You may need to verify your email address and link your game ID (e.g., Riot ID) to participate in tournaments.",
      },
      {
        q: "Can I change my username?",
        a: "Yes, you can update your display name in the Profile settings. However, you cannot change your unique User ID.",
      },
      {
        q: "I forgot my password.",
        a: "Use the 'Forgot Password' link on the login page. We will send you a password reset link to your registered email address.",
      },
    ],
    technical: [
      {
        q: "The website is running slow.",
        a: "Please check your internet connection first. If the issue persists, try clearing your browser cache or using a different browser.",
      },
      {
        q: "I found a bug, how do I report it?",
        a: "We appreciate bug reports! Please send details and screenshots to our Discord #bugs channel or email support@vrivalsarena.com.",
      },
    ],
  };

  const filteredFAQs = searchTerm
    ? Object.keys(faqs).reduce((acc, category) => {
        const matchingQuestions = faqs[category].filter(
          (item) =>
            item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.a.toLowerCase().includes(searchTerm.toLowerCase()),
        );
        if (matchingQuestions.length > 0) {
          acc[category] = matchingQuestions;
        }
        return acc;
      }, {})
    : categories.reduce((acc, cat) => {
        if (cat.id === openCategory) {
          acc[cat.id] = faqs[cat.id];
        }
        return acc;
      }, {});

  const toggleQuestion = (idx) => {
    setOpenQuestion(openQuestion === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <div className="relative border-b border-white/5 bg-slate-900 px-6 py-20 text-center">
        <h1 className="font-anton mb-6 text-5xl text-white uppercase md:text-7xl">
          Help <span className="text-rose-500">Center</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-400">
          Everything you need to know about VRivals Arena. Search for answers or
          browse by category below.
        </p>

        {/* Search Bar */}
        <div className="mx-auto max-w-xl">
          <div className="relative">
            <Search
              className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Search for questions (e.g. 'refund', 'join tournament')..."
              className="w-full rounded-full border border-slate-700 bg-slate-800 py-4 pr-6 pl-12 text-white placeholder-slate-500 transition-all focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-2 rounded-xl border border-white/5 bg-slate-900/50 p-4">
              <h3 className="mb-4 px-2 text-sm font-bold tracking-wider text-slate-500 uppercase">
                Categories
              </h3>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setOpenCategory(cat.id);
                    setSearchTerm(""); // Clear search when switching category
                    setOpenQuestion(null);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                    openCategory === cat.id && !searchTerm
                      ? "bg-rose-500 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {cat.icon}
                  <span className="font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            {searchTerm ? (
              <div>
                <h2 className="mb-6 text-xl text-white">
                  Search Results for "{searchTerm}"
                </h2>
                {Object.keys(filteredFAQs).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
                    <Book className="mx-auto mb-4 h-12 w-12 text-slate-600" />
                    <p className="text-slate-400">
                      No matching questions found. Try different keywords.
                    </p>
                  </div>
                ) : (
                  Object.keys(filteredFAQs).map((catId) => (
                    <div key={catId} className="mb-8">
                      <h3 className="mb-4 text-lg font-bold text-rose-400 capitalize">
                        {categories.find((c) => c.id === catId)?.name || catId}
                      </h3>
                      <div className="space-y-4">
                        {filteredFAQs[catId].map((faq, idx) => (
                          <div
                            key={`${catId}-${idx}`}
                            className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40"
                          >
                            <details className="group">
                              <summary className="flex cursor-pointer list-none items-center justify-between p-6 font-medium text-white transition-colors hover:text-rose-400">
                                {faq.q}
                                <span className="transform transition-transform group-open:rotate-180">
                                  <ChevronDown size={20} />
                                </span>
                              </summary>
                              <div className="border-t border-slate-800/50 px-6 pt-4 pb-6 leading-relaxed text-slate-400">
                                {faq.a}
                              </div>
                            </details>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div>
                <div className="mb-8 flex items-end justify-between border-b border-white/5 pb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white">
                      {categories.find((c) => c.id === openCategory)?.name}
                    </h2>
                    <p className="mt-2 text-slate-400">
                      {
                        categories.find((c) => c.id === openCategory)
                          ?.description
                      }
                    </p>
                  </div>
                  <div className="hidden text-6xl text-slate-800 opacity-50 md:block">
                    {categories.find((c) => c.id === openCategory)?.icon}
                  </div>
                </div>

                <div className="space-y-4">
                  {faqs[openCategory]?.map((faq, idx) => (
                    <div
                      key={idx}
                      className={`overflow-hidden rounded-xl border transition-all ${
                        openQuestion === idx
                          ? "border-rose-500/30 bg-slate-900"
                          : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                      }`}
                    >
                      <button
                        onClick={() => toggleQuestion(idx)}
                        className="flex w-full cursor-pointer items-center justify-between p-6 text-left font-medium text-white transition-colors"
                      >
                        <span
                          className={`${openQuestion === idx ? "text-rose-400" : ""}`}
                        >
                          {faq.q}
                        </span>
                        <ChevronDown
                          size={20}
                          className={`transform transition-transform duration-200 ${
                            openQuestion === idx
                              ? "rotate-180 text-rose-500"
                              : "text-slate-500"
                          }`}
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          openQuestion === idx
                            ? "max-h-96 opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="border-t border-slate-800/50 px-6 pt-2 pb-6 leading-relaxed text-slate-400">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-20 rounded-2xl border border-white/5 bg-gradient-to-r from-slate-900 to-slate-900/50 p-8 text-center md:p-12">
          <h3 className="mb-4 text-2xl font-bold text-white">
            Can't find what you're looking for?
          </h3>
          <p className="mx-auto mb-8 max-w-xl text-slate-400">
            Our support team is here to help. Send us an email or join our
            Discord community for quick answers.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/support"
              className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-bold text-slate-950 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="https://discord.gg/gexZcZzCHV"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 font-bold text-white transition-colors hover:bg-slate-700"
            >
              Join Discord
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
