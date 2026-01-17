"use client";
import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimatedTitle from "@/components/AnimatedTitle";
import { Shield, Users, Trophy, Zap, Target, Globe } from "lucide-react";
import Link from "next/link";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";

gsap.registerPlugin(ScrollTrigger);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const TOURNAMENTS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_TOURNAMENTS_COLLECTION_ID;
const USERS_COLLECTION_ID = "users"; // Consistent with lib/users.js

export default function AboutPage() {
  const { user } = useAuth();
  const containerRef = useRef(null);
  const [stats, setStats] = useState({
    activePlayers: "...",
    tournamentsHosted: "...",
    prizePool: "...",
  });

  useGSAP(
    () => {
      // Hero Image Animation
      gsap.from("#about-hero-img", {
        scale: 1.2,
        opacity: 0,
        duration: 2,
        ease: "power2.out",
      });

      // Features Stagger
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: "#features-grid",
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
      });

      // Stats Counter Animation (Simulated)
      gsap.from(".stat-item", {
        scrollTrigger: {
          trigger: "#stats-section",
          start: "top 75%",
        },
        y: 30,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "back.out(1.7)",
      });
    },
    { scope: containerRef, dependencies: [] },
  );

  // Fetch Realtime Stats
  React.useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch Users Count
        const users = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.limit(1)], // We only need the total
        );

        // Fetch Tournaments Count & Prize Pool
        // Note: For total prize pool, we ideally need a server-side aggregation or fetch all.
        // For now, we fetch up to 100 recent tournaments to calculate an estimate.
        const tournaments = await databases.listDocuments(
          DATABASE_ID,
          TOURNAMENTS_COLLECTION_ID,
          [Query.limit(100)],
        );

        const totalPrizePool = tournaments.documents.reduce((acc, t) => {
          // Parse prize pool string "10000" or number 10000.
          // Handle cases where it might be empty or non-numeric strings
          const val = parseFloat(t.prizePool) || 0;
          return acc + val;
        }, 0);

        // Format Prize Pool (e.g. 50K+, 1.2L+)
        const formatPrize = (num) => {
          if (num >= 1000000) return `₹${(num / 1000000).toFixed(1)}M+`;
          if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L+`;
          if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K+`;
          return `₹${num}`;
        };

        setStats({
          activePlayers: users.total > 0 ? `${users.total}+` : "0",
          tournamentsHosted:
            tournaments.total > 0 ? `${tournaments.total}+` : "0",
          prizePool: formatPrize(totalPrizePool),
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        // Fallback to static if backend fails or env vars missing
        setStats({
          activePlayers: "100+",
          tournamentsHosted: "10+",
          prizePool: "₹50K+",
        });
      }
    }

    fetchStats();
  }, []);

  const features = [
    {
      icon: <Trophy className="h-8 w-8 text-yellow-500" />,
      title: "Premium Tournaments",
      description:
        "Compete in high-stakes tournaments with automated bracket management and instant prize distribution.",
    },
    {
      icon: <Shield className="h-8 w-8 text-rose-500" />,
      title: "Anti-Cheat Integration",
      description:
        "Competitive integrity is our priority. Our platform leverages Riot's Vanguard anti-cheat to ensure a fair and cheat-free environment.",
    },
    {
      icon: <Users className="h-8 w-8 text-blue-500" />,
      title: "Vibrant Community",
      description:
        "Join thousands of passionate players. Find teammates, scrim partners, and make lasting connections.",
    },
    {
      icon: <Zap className="h-8 w-8 text-purple-500" />,
      title: "Instant Updates",
      description:
        "Real-time match tracking and live leaderboard updates using our advanced websocket infrastructure.",
    },
    {
      icon: <Target className="h-8 w-8 text-emerald-500" />,
      title: "Skill Matching",
      description:
        "Find players and teams that match your skill level with our proprietary matchmaking algorithm.",
    },
    {
      icon: <Globe className="h-8 w-8 text-cyan-500" />,
      title: "VRivals Arena Leaderboard",
      description:
        "Climb the dedicated platform leaderboards and track your progress against other competitors on VRivals Arena.",
    },
  ];

  return (
    <main
      ref={containerRef}
      className="relative min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-200"
    >
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-10 bg-slate-950/80" />
        <div
          id="about-hero-img"
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"
        />

        <div className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center">
          <p className="font-general mb-4 text-sm font-bold tracking-[0.2em] text-rose-500 uppercase">
            Beyond the Game
          </p>
          <AnimatedTitle
            title='Redefining <br /> <span>Competitive</span> <span class="special-gradient">Esports</span>'
            containerClass="!text-white !text-5xl md:!text-7xl lg:!text-8xl leading-[0.9]"
          />
          <p className="mt-6 max-w-2xl text-lg font-medium text-slate-300 md:text-xl">
            VRivals Arena is the premier destination for India&apos;s
            competitive gamers. We bridge the gap between casual play and
            professional esports across the subcontinent.
          </p>
        </div>

        {/* Gradient Fade at bottom */}
        <div className="absolute bottom-0 left-0 z-20 h-32 w-full bg-gradient-to-t from-slate-950 to-transparent" />
      </section>

      {/* Mission Section */}
      <section className="relative py-32 md:py-48">
        <div className="container mx-auto px-4">
          <div className="grid gap-16 md:grid-cols-2 lg:gap-24">
            <div className="flex flex-col justify-center">
              <h2 className="font-anton text-4xl leading-tight text-white uppercase md:text-6xl">
                Our Mission
              </h2>
              <div className="mt-6 space-y-6 text-lg text-slate-400">
                <p>
                  At VRivals Arena, we believe that every gamer deserves to
                  experience the thrill of professional competition. Whether you
                  are an aspiring pro or a weekend warrior, our platform
                  provides the infrastructure you need to shine.
                </p>
                <p>
                  We are building more than just a tournament site; we are
                  building a legacy. A place where reputations are forged,
                  rivalries are born, and champions are crowned.
                </p>
              </div>
            </div>
            <div className="relative aspect-square md:aspect-auto md:h-full">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose-500/20 to-blue-600/20 md:rotate-3" />
              <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop"
                  alt="Esports Arena"
                  className="h-full w-full object-cover opacity-80 transition-transform duration-700 hover:scale-110"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        id="stats-section"
        className="mt-20 border-y border-white/5 bg-white/5 py-20 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { label: "Active Players", value: stats.activePlayers },
              { label: "Tournaments Hosted", value: stats.tournamentsHosted },
              { label: "Prize Pool Paid", value: stats.prizePool },
            ].map((stat, i) => (
              <div
                key={i}
                className="stat-item flex flex-col items-center justify-center text-center"
              >
                <span className="font-anton text-4xl text-white md:text-5xl">
                  {stat.value}
                </span>
                <span className="mt-2 text-sm font-semibold tracking-wider text-rose-500 uppercase">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features-grid" className="py-32 md:py-48">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="font-anton text-4xl text-white uppercase md:text-6xl">
              Why Choose VRivals Arena
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Experience the next generation of competitive gaming features
              designed to elevate your gameplay.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 p-8 transition-colors duration-300 hover:bg-slate-800/50 hover:shadow-[0_0_30px_rgba(244,63,94,0.1)]"
              >
                <div className="mb-6 inline-block rounded-xl bg-slate-950 p-3 shadow-lg ring-1 ring-white/10 transition-all group-hover:ring-rose-500/50">
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-white transition-colors group-hover:text-rose-400">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden pt-32 pb-40 text-center">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-rose-900/10 to-slate-950" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-[size:40px_40px]" />

        {/* Animated Glow Blobs */}
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-600/10 blur-[120px]" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="mb-6 inline-block rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-[10px] font-black tracking-[0.3em] text-rose-500 uppercase">
            Join the elite
          </div>

          <h2 className="font-anton mb-6 text-6xl leading-none tracking-tight text-white uppercase italic md:text-8xl">
            READY TO{" "}
            <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
              COMPETE?
            </span>
          </h2>

          <p className="mx-auto mb-12 max-w-lg text-lg font-medium text-slate-400">
            India&apos;s next generation of competitive Valorant is calling.
            Forge your legacy and rise through the national ranks today.
          </p>

          <Link
            href={user ? "/tournaments" : "/login"}
            className="group relative inline-flex items-center gap-4 rounded-full bg-rose-600 px-10 py-5 text-xl font-black text-white transition-all hover:bg-rose-700 hover:shadow-[0_0_50px_rgba(244,63,94,0.4)] active:scale-95"
          >
            <span>JOIN THE ARENA</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform group-hover:rotate-45">
              <Target className="h-5 w-5" />
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
