"use client";
import React from "react";
import Link from "next/link";
import {
  User,
  Swords,
  Trophy,
  CreditCard,
  MessageSquare,
  Clock,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = React.useState("Getting Started");
  const [openItem, setOpenItem] = React.useState(null);

  const toggleItem = (id) => {
    setOpenItem(openItem === id ? null : id);
  };

  const faqs = [
    {
      category: "Getting Started",
      icon: <User className="h-6 w-6 text-purple-500" />,
      questions: [
        {
          q: "Do I need to link my Riot Account?",
          a: "Yes. To participate in any tournament, you must link your Valorant account (Riot ID & Tag) in your Profile. This verifies your rank and ownership.",
        },
        {
          q: "Why should I link my Discord?",
          a: "Linking Discord is highly recommended. It grants you automatic roles in our server, access to private tournament channels, and faster support from admins.",
        },
        {
          q: "How do I find a team?",
          a: "Use our 'Player Finder' tool. You can post a scouting report as a Free Agent or browse other players looking for a team.",
        },
        {
          q: "Is this platform free to use?",
          a: "Yes! Signing up and creating a profile is 100% free. We host many free-to-enter tournaments with cash prizes, as well as premium paid tournaments.",
        },
        {
          q: "Can I change my username?",
          a: "You can update your display name in your Profile Settings. However, your linked Riot ID must always match your in-game name to avoid disqualification.",
        },
      ],
    },
    {
      category: "Tournaments & Teams",
      icon: <Trophy className="h-6 w-6 text-rose-500" />,
      questions: [
        {
          q: "How do I register for a 5v5 tournament?",
          a: "One captain registers the team. You must create a team name and invite 4 other players who have verified, linked Valorant accounts on our platform.",
        },
        {
          q: "When do I need to check in?",
          a: "Check-in opens 30 minutes before the scheduled start time. You MUST click 'Check In' on the tournament page, or you will be disqualified.",
        },
        {
          q: "Can I change my roster mid-tournament?",
          a: "No. Rosters are locked the moment the bracket is generated. Emergency substitutes are only allowed with explicit Admin approval.",
        },
        {
          q: "What if I don't have a full team?",
          a: "You cannot register for team events (5v5, 3v3) without a full roster. Try playing in our 1v1 or Deathmatch tournaments instead!",
        },
        {
          q: "Can I play in two tournaments at once?",
          a: "No. You cannot check in to two overlapping tournaments simultaneously. You must finish or withdraw from one before joining another.",
        },
        {
          q: "How are brackets seeded?",
          a: "Brackets are generally seeded randomly to ensure fairness, though some premier events may use rank-based seeding.",
        },
      ],
    },
    {
      category: "Matches & Gameplay",
      icon: <Swords className="h-6 w-6 text-blue-500" />,
      questions: [
        {
          q: "How do we join the game lobby?",
          a: "For most matches, a 'Valorant Party Code' will be displayed on your match page on desktop. Copy this code and paste it into the Valorant client to join the lobby.",
        },
        {
          q: "What happens if my team is late?",
          a: "There is a strict 10-minute grace period from the match start time. If a team is not present and ready by then, they forfeit the map.",
        },
        {
          q: "What is the policy on cheating?",
          a: "Zero tolerance. Any use of third-party software (aimbots, walls, scripting) results in an immediate permanent ban and hardware ID blacklist.",
        },
        {
          q: "What loops/exploits are banned?",
          a: "Any map exploit that allows you to see through walls, boosts into unintended textures, or silent plants is prohibited. Normal 'skill jumps' are generally allowed.",
        },
        {
          q: "Which servers are used for matches?",
          a: "By default, matches are played on the server with the lowest average ping for both teams (often Mumbai for Indian tournaments).",
        },
        {
          q: "Can we pause the match?",
          a: "Yes. Each team is allowed two 60-second technical pauses per map. Use the in-game /pause command.",
        },
        {
          q: "What if a player disconnects?",
          a: "Pause immediately. If they cannot reconnect within the pause time, you must continue 4v5 or forfeit. Matches will not be restarted for disconnects after Round 1.",
        },
      ],
    },
    {
      category: "Payments & Prizes",
      icon: <CreditCard className="h-6 w-6 text-emerald-500" />,
      questions: [
        {
          q: "How are entry fees paid?",
          a: "We support major payment methods including UPI. Entry fees must be paid in full at the time of registration.",
        },
        {
          q: "Can I get a refund?",
          a: "Yes, BUT only if you withdraw at least 24 hours before the tournament check-in time. Disqualifications are non-refundable.",
        },
        {
          q: "How do I claim my prize?",
          a: "Prizes are usually credited to your platform wallet instantly. For large cash prizes, we process Bank/UPI transfers within 5-7 business days.",
        },
        {
          q: "Is there a minimum withdrawal amount?",
          a: "Yes, the minimum withdrawal amount is ₹100. Withdrawals are processed daily.",
        },
        {
          q: "Are there transaction fees?",
          a: "We do not charge fees for adding funds. However, a small processing fee may apply to withdrawals depending on your payment method.",
        },
      ],
    },
    {
      category: "Technical Support",
      icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
      questions: [
        {
          q: "My rank isn't updating on my profile.",
          a: "Rank data updates periodically. If it's stuck, try unlinking and re-linking your account, or wait up to 24 hours for the cache to refresh.",
        },
        {
          q: "I found a bug on the website.",
          a: "Please report it to us on Discord! We often reward users who find critical bugs with site credits or unique badges.",
        },
        {
          q: "The lobby code isn't working.",
          a: "Ensure you are on the correct region. If it still fails, have your captain contact an admin immediately in the match chat or Discord.",
        },
        {
          q: "How do I report a toxic player?",
          a: "Use the 'Report' button on the match page or open a support ticket. Proof (screenshots/video) is required for action to be taken.",
        },
      ],
    },
  ];

  const activeSection =
    faqs.find((f) => f.category === activeCategory) || faqs[0];

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
          Freq. Asked <span className="text-rose-500">Questions</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
          Find answers to common questions about tournaments, rules, and
          payments.
        </p>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:gap-12">
          {/* Side Menu (Desktop) / Horizontal Tabs (Mobile) */}
          <aside className="w-full shrink-0 md:w-64 lg:w-72">
            <div className="sticky top-24 space-y-2">
              {/* Mobile Scroll Wrapper */}
              <div className="flex gap-2 overflow-x-auto pb-4 md:flex-col md:overflow-visible md:pb-0">
                {faqs.map((section, idx) => {
                  const isActive = activeCategory === section.category;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveCategory(section.category);
                        setOpenItem(null); // Reset open item when switching category
                      }}
                      className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all md:w-full ${
                        isActive
                          ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                          : "bg-slate-900/40 text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <div
                        className={`${isActive ? "text-white" : "opacity-70"}`}
                      >
                        {React.cloneElement(section.icon, {
                          className: "h-5 w-5",
                        })}
                      </div>
                      <span className="whitespace-nowrap">
                        {section.category}
                      </span>
                      {isActive && (
                        <div className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-white md:block" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Contact Widget (Desktop Only) */}
              <div className="mt-8 hidden rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md md:block">
                <h4 className="mb-2 text-sm font-black text-white uppercase">
                  Need more help?
                </h4>
                <p className="mb-4 text-xs text-slate-400">
                  Our team is available 24/7 on Discord.
                </p>
                <a
                  href="https://discord.gg/gexZcZzCHV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-rose-700"
                >
                  Join Discord
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="min-w-0 flex-1">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="group overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-md">
                <div className="divide-y divide-white/5">
                  {activeSection.questions.map((item, qIdx) => {
                    const itemId = qIdx; // Simple index for current view
                    const isOpen = openItem === itemId;

                    return (
                      <div
                        key={qIdx}
                        className={`transition-colors hover:bg-white/5 ${
                          isOpen ? "bg-white/5" : ""
                        }`}
                      >
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left md:px-8 md:py-6"
                        >
                          <span className="text-sm font-bold text-white md:text-base">
                            {item.q}
                          </span>
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-950 transition-transform duration-300 ${
                              isOpen
                                ? "rotate-180 border-rose-500 bg-rose-500 text-white"
                                : "text-slate-400"
                            }`}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </div>
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isOpen
                              ? "max-h-48 opacity-100"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <p className="px-6 pb-6 text-sm leading-relaxed text-slate-400 md:px-8 md:text-base">
                            {item.a}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Contact CTA (Mobile Only - Bottom of content) */}
            <div className="mt-8 rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-900/10 to-transparent p-6 text-center md:hidden">
              <h3 className="mb-2 text-lg font-bold text-white uppercase">
                Still stuck?
              </h3>
              <p className="mb-4 text-sm text-slate-400">
                Join our Discord for instant support.
              </p>
              <a
                href="https://discord.gg/gexZcZzCHV"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-6 py-2 text-sm font-bold text-white hover:bg-rose-700"
              >
                Join Community
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
