"use client";
import { useEffect, useState, useMemo } from "react";
import { getTournaments } from "@/lib/tournaments";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Calendar, Trophy, Users, Search, Filter, ArrowRight, Shield, LayoutGrid, List } from "lucide-react";
import { BentoTilt } from "@/components/BentoGrid";
import Image from "next/image";
import Loader from "@/components/Loader";

export default function TournamentsPage() {
  const { isAdmin } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [activeTab, setActiveTab] = useState("UPCOMING");

  useEffect(() => {
    async function loadTournaments() {
      try {
        const data = await getTournaments();
        setTournaments(data);
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
      
      const status = t.status || 'scheduled';
      let matchesStatus = false;
      if (activeTab === "UPCOMING") {
        matchesStatus = status === 'scheduled';
      } else if (activeTab === "LIVE") {
        matchesStatus = status === 'ongoing';
      } else if (activeTab === "COMPLETED") {
        matchesStatus = status === 'completed';
      }
      
      return matchesFilter && matchesSearch && matchesStatus;
    });
  }, [tournaments, filter, searchQuery, activeTab]);

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

            {/* View Toggle & Filter */}
            <div className="flex gap-2 md:col-span-2">
                <div className="flex bg-slate-950 rounded-xl border border-white/10 p-1">
                    <button 
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/40' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Grid View"
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/40' : 'text-slate-500 hover:text-slate-300'}`}
                        title="List View"
                    >
                        <List className="h-5 w-5" />
                    </button>
                </div>

                <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="flex-1 cursor-pointer appearance-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white transition-all focus:border-rose-500 outline-none"
                >
                    <option value="All">All Modes</option>
                    <option value="5v5">5v5 Tournament</option>
                    <option value="Deathmatch">Deathmatch Arena</option>
                </select>

                {isAdmin && (
                    <Link href="/tournaments/create">
                        <button className="flex h-full items-center gap-2 rounded-xl bg-white px-4 font-bold text-slate-950 hover:bg-slate-200 transition-colors">
                             <Trophy className="h-4 w-4" />
                             <span className="hidden lg:inline">CREATE</span>
                        </button>
                    </Link>
                )}
            </div>
        </div>

        {/* Tournament Segments */}
        <div className="mb-8 flex flex-wrap items-center gap-8 border-b border-white/5">
            {[
                { id: "UPCOMING", label: "SCHEDULED / UPCOMING" },
                { id: "LIVE", label: "ONGOING (LIVE)" },
                { id: "COMPLETED", label: "COMPLETED / PAST" }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                        activeTab === tab.id 
                        ? "text-rose-500" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                    )}
                </button>
            ))}
        </div>

        {/* Tournament Content */}
        {filteredTournaments.length > 0 ? (
            viewMode === "grid" ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTournaments.map((tournament) => (
                    <Link href={`/tournaments/${tournament["$id"]}`} key={tournament["$id"]}>
                        <BentoTilt className="h-full">
                            <div className="relative group flex h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0a0c10] p-6 transition-all hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-900/20 group-hover:scale-[1.02]">
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
                                            <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 group-hover:from-rose-400 group-hover:to-amber-300 italic tracking-tighter transition-all leading-tight inline-block group-hover:scale-105 origin-left">
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
                                        (tournament.maxTeams - (tournament.registeredTeams || 0)) <= 2 
                                        ? "text-rose-500 animate-pulse" 
                                        : "text-emerald-500"
                                    }`}>
                                        {(tournament.maxTeams - (tournament.registeredTeams || 0))} Slots Remaining
                                    </span>
                                </div>
                            </div>
                            </div>
                        </BentoTilt>
                    </Link>
                ))}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                {filteredTournaments.map((tournament) => (
                    <Link href={`/tournaments/${tournament["$id"]}`} key={tournament["$id"]}>
                        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0c10] p-5 transition-all hover:border-rose-500/30 hover:bg-slate-900/50">
                            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                {/* Left Section: Game Type & Name */}
                                <div className="flex items-center gap-6 md:w-[30%]">
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                                        tournament.gameType === 'Deathmatch' 
                                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                                        : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                                    }`}>
                                        {tournament.gameType === 'Deathmatch' ? <Users className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-rose-500 transition-colors">
                                            {tournament.gameType}
                                        </span>
                                        <h3 className="truncate text-xl font-black text-white uppercase italic tracking-tighter transition-all group-hover:text-rose-500">
                                            {tournament.name}
                                        </h3>
                                    </div>
                                </div>

                                {/* Center: Prize Information */}
                                <div className="flex flex-1 items-center justify-between border-y border-white/5 py-4 md:border-none md:py-0 md:px-12">
                                    <div className="flex flex-col group/prize">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1 group-hover:text-rose-500 transition-colors">Total Prize Pool</span>
                                        <span className="text-3xl font-black text-white italic tracking-tighter leading-none group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-400 group-hover:to-amber-300 transition-all group-hover:scale-110 origin-left">
                                            ₹{tournament.prizePool}
                                        </span>
                                    </div>
                                    <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">Winner</span>
                                        <span className="text-xl font-black text-slate-200 group-hover:text-white transition-colors tracking-tighter leading-none">₹{tournament.firstPrize || 'TBD'}</span>
                                    </div>
                                    <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1">Runner Up</span>
                                        <span className="text-xl font-black text-slate-400 group-hover:text-slate-200 transition-colors tracking-tighter leading-none">₹{tournament.secondPrize || 'TBD'}</span>
                                    </div>
                                </div>

                                {/* Right Section: Date & Slots */}
                                <div className="flex items-center justify-between gap-8 md:justify-end md:w-[30%]">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Start Date</span>
                                        <span className="text-sm font-black text-slate-300 uppercase tracking-tighter">
                                            {new Date(tournament.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex h-10 items-center gap-3 rounded-xl bg-slate-950/50 px-4 border border-white/5">
                                        <Users className="h-4 w-4 text-slate-500" />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            (tournament.maxTeams - (tournament.registeredTeams || 0)) <= 2 
                                            ? "text-rose-500" 
                                            : "text-emerald-500"
                                        }`}>
                                            {(tournament.maxTeams - (tournament.registeredTeams || 0))} OPEN
                                        </span>
                                    </div>
                                    <div className="hidden md:block transition-transform group-hover:translate-x-1">
                                        <ArrowRight className="h-5 w-5 text-slate-700 group-hover:text-rose-500" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Hover Bar */}
                            <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500 group-hover:w-full" />
                        </div>
                    </Link>
                ))}
                </div>
            )
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
