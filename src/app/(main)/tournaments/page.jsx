"use client";
import { useEffect, useState, useMemo } from "react";
import { getTournaments } from "@/lib/tournaments";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Calendar, Trophy, Users, Search, Filter, ArrowRight, Shield } from "lucide-react";
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

        // Fetch all registrations to get accurate counts
        const { databases } = await import("@/lib/appwrite");
        const regsRes = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID,
            [] 
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
            <h1 className="special-font hero-heading text-white font-black uppercase tracking-tighter">
                TOURN<b>A</b>MENTS
            </h1>
            <p className="mt-4 max-w-xl text-lg font-medium text-slate-400">
                Join high-stakes competitions, show off your skills, and win big prizes in our curated Valorant tournaments.
            </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Controls - Glassmorphism style */}
        <div className="mb-12 grid grid-cols-1 gap-4 rounded-2xl border border-white/5 bg-slate-900/50 p-4 backdrop-blur-sm md:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Search tournaments..." 
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 pl-10 text-sm text-white transition-all focus:border-rose-500 outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Filter */}
            <div className="flex gap-2 md:col-span-2">
                <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white transition-all focus:border-rose-500 outline-none"
                >
                    <option value="All">All Modes</option>
                    <option value="5v5">5v5 Tournament</option>
                    <option value="Deathmatch">Deathmatch Arena</option>
                </select>

                {isAdmin && (
                    <Link href="/tournaments/create">
                        <button className="flex h-full items-center gap-2 rounded-xl bg-white px-6 font-bold text-slate-950 hover:bg-slate-200 transition-colors">
                             <Trophy className="h-4 w-4" />
                             <span className="hidden sm:inline">CREATE</span>
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
                    <div className="relative group flex h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0a0c10] p-6 transition-all hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-900/20">
                        {/* Decorative Glow Blob */}
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-500/5 blur-[100px] group-hover:bg-rose-500/10 transition-colors pointer-events-none" />
                        
                        {/* Card Header */}
                        <div className="relative z-10 mb-6 flex items-start justify-between gap-4 min-h-[90px]">
                            <div className="flex flex-col gap-2 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                                        tournament.gameType === 'Deathmatch' 
                                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                                        : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                                    }`}>
                                        {tournament.gameType}
                                    </span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter leading-[0.9] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all py-1">
                                    {tournament.name}
                                </h3>
                            </div>
                            <div className="shrink-0 rounded-2xl bg-white/5 p-3 text-slate-500 border border-white/5 group-hover:text-white group-hover:bg-rose-500 group-hover:border-rose-500 group-hover:rotate-12 transition-all duration-300 shadow-lg">
                                <Shield className="h-6 w-6" />
                            </div>
                        </div>

                        {/* Prize Pool Box */}
                        <div className="relative z-10 mb-8 overflow-hidden rounded-2xl bg-slate-950/50 border border-white/5 p-6 group-hover:border-rose-500/30 transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="relative z-10 flex flex-col gap-4">
                                <div>
                                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-rose-400 transition-colors">
                                        Total Prize Pool
                                    </span>
                                    <div className="py-1">
                                        <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 group-hover:from-rose-400 group-hover:to-amber-300 italic tracking-tighter transition-all leading-tight">
                                            ₹{tournament.prizePool}
                                        </span>
                                    </div>
                                </div>

                                {/* Breakdown Row */}
                                <div className="flex items-center gap-4 border-t border-white/5 pt-4 group-hover:border-rose-500/10 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/60 mb-1">Winner</span>
                                        <span className="text-sm font-black text-slate-200 group-hover:text-white transition-colors">₹{tournament.firstPrize || 'TBD'}</span>
                                    </div>
                                    <div className="h-6 w-[1px] bg-white/5" />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Runner Up</span>
                                        <span className="text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors">₹{tournament.secondPrize || 'TBD'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Details */}
                        <div className="relative z-10 mt-auto flex items-center justify-between border-t border-white/5 pt-6 group-hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-800 text-rose-500">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase text-slate-500">Start Date</span>
                                    <span className="text-sm font-bold text-slate-300">
                                        {new Date(tournament.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Users className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm font-bold text-slate-300">
                                        {tournament.maxTeams} {tournament.gameType === 'Deathmatch' ? 'Players' : 'Teams'}
                                    </span>
                                </div>
                                
                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                    (tournament.maxTeams - (registrationCounts[tournament["$id"]] || 0)) <= 2 
                                    ? "text-rose-500 animate-pulse" 
                                    : "text-emerald-500"
                                }`}>
                                    {(tournament.maxTeams - (registrationCounts[tournament["$id"]] || 0))} Slots Remaining
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl">
                <Trophy className="mb-4 h-16 w-16 text-slate-800" />
                <h3 className="text-xl font-bold text-slate-500">No tournaments found</h3>
                <p className="mt-2 text-slate-600">Try adjusting your filters or search query.</p>
                <button 
                    onClick={() => {
                        setSearchQuery("");
                        setFilter("All");
                    }}
                    className="mt-6 text-rose-500 hover:text-rose-400 font-black uppercase tracking-widest text-xs"
                >
                    Clear Filters
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
