"use client";
import { useEffect, useState, useMemo } from "react";
import { getTournaments } from "@/lib/tournaments";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Calendar, Trophy, Users, Search, Filter, ArrowRight, Shield } from "lucide-react";
import { BentoTilt } from "@/components/BentoGrid";
import Image from "next/image";
import Loader from "@/components/Loader";

export default function TournamentsPage() {
  const { isAdmin } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [registrationCounts, setRegistrationCounts] = useState({});

  useEffect(() => {
    async function loadTournaments() {
      try {
        const data = await getTournaments();
        setTournaments(data);

        // Fetch all registrations to get accurate counts (bypass flaky registeredTeams field)
        const { databases } = await import("@/lib/appwrite");
        const regsRes = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID,
            [] // Fetch all to be accurate
        );

        const counts = {};
        regsRes.documents.forEach(reg => {
            counts[reg.tournamentId] = (counts[reg.tournamentId] || 0) + 1;
        });
        setRegistrationCounts(counts);
      } catch (error) {
        console.error("Failed to load tournaments", error);
      } finally {
        setLoading(false);
      }
    }
    loadTournaments();
  }, []);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(t => {
      const matchesFilter = filter === "All" || t.gameType === filter;
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [tournaments, filter, searchQuery]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <section className="relative h-[40vh] w-full overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0 opacity-40">
           <img 
            src="/hero-bg.png" 
            alt="Hero Background" 
            className="h-full w-full object-cover"
           />
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        
        <div className="container relative z-20 mx-auto flex h-full flex-col justify-end px-6 pb-12">
            <h1 className="special-font hero-heading text-white">
                TOURN<b>A</b>MENTS
            </h1>
            <p className="mt-4 max-w-xl text-lg font-medium text-slate-400">
                Join high-stakes competitions, show off your skills, and win big prizes in our curated Valorant tournaments.
            </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {/* Controls */}
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {["All", "5v5", "Deathmatch"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                  filter === tab
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                    : "bg-slate-900 border border-white/5 hover:border-white/20 text-slate-400"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Search tournaments..." 
                    className="rounded-full bg-slate-900 border border-white/5 pl-10 pr-4 py-2 text-sm focus:border-rose-500/50 focus:outline-none w-64 md:w-80"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             {isAdmin && (
                <Link href="/tournaments/create">
                    <button className="flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-slate-950 hover:bg-slate-200 transition-colors">
                        CREATE
                    </button>
                </Link>
             )}
          </div>
        </div>

        {/* Tournament Grid */}
        {filteredTournaments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tournament) => (
                <Link href={`/tournaments/${tournament["$id"]}`} key={tournament["$id"]}>
                    <BentoTilt className="h-full">
                        <div className="relative group flex h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#0a0c10] p-6 transition-all hover:border-rose-500/30">
                            {/* Card Header */}
                            <div className="mb-4 flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">{tournament.gameType}</span>
                                    <h3 className="text-2xl font-black text-white group-hover:text-rose-500 transition-colors uppercase tracking-tight">{tournament.name}</h3>
                                </div>
                                <div className="rounded-2xl bg-white/5 p-3 text-slate-500 border border-white/5 group-hover:text-white transition-colors">
                                    <Shield className="h-6 w-6" />
                                </div>
                            </div>

                            {/* Prize Pool Box */}
                            <div className="mb-6 rounded-2xl bg-rose-500/[0.03] p-6 border border-rose-500/10 flex flex-col justify-center min-h-[120px]">
                                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/60">Prize Pool</span>
                                <span className="text-4xl font-black text-white italic tracking-tighter">
                                    {tournament.prizePool}
                                </span>
                            </div>

                            {/* Footer Details */}
                            <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-6">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Calendar className="h-5 w-5 text-rose-600" />
                                    <span className="text-sm font-bold">{new Date(tournament.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-rose-600" />
                                        <span className="text-sm font-bold">
                                            {tournament.maxTeams} {tournament.gameType === 'Deathmatch' ? 'Players' : 'Teams'}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                        (tournament.maxTeams - (registrationCounts[tournament["$id"]] || 0)) <= 2 
                                        ? "text-rose-500 animate-pulse" 
                                        : "text-emerald-500"
                                    }`}>
                                        {(tournament.maxTeams - (registrationCounts[tournament["$id"]] || 0))} SLOTS REMAINING
                                    </span>
                                </div>
                            </div>
                        </div>
                    </BentoTilt>
                </Link>
            ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Trophy className="mb-4 h-16 w-16 text-slate-800" />
                <h3 className="text-xl font-bold text-slate-500">No tournaments found</h3>
                <p className="mt-2 text-slate-600">Try adjusting your filters or search query.</p>
            </div>
        )}
      </div>
    </div>
  );
}
