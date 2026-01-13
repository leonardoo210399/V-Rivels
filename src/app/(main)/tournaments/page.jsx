"use client";
import { useEffect, useState, useMemo } from "react";
import { getTournaments } from "@/lib/tournaments";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Calendar,
  Trophy,
  Users,
  Search,
  Filter,
  ArrowRight,
  Shield,
  LayoutGrid,
  List,
} from "lucide-react";
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
    return tournaments.filter((t) => {
      const matchesFilter = filter === "All" || t.gameType === filter;
      const matchesSearch = t.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const status = t.status || "scheduled";
      let matchesStatus = false;
      if (activeTab === "UPCOMING") {
        matchesStatus = status === "scheduled";
      } else if (activeTab === "LIVE") {
        matchesStatus = status === "ongoing";
      } else if (activeTab === "COMPLETED") {
        matchesStatus = status === "completed";
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
          {/* Tactical Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:40px_40px]" />
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        <div className="relative z-20 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-12">
          {/* Header */}
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 px-1">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <h2 className="text-[11px] font-black tracking-[0.3em] text-rose-500 uppercase">
                  Operations Center
                </h2>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white uppercase italic md:text-5xl">
                <span className="text-rose-500 underline decoration-rose-500/30 underline-offset-8">
                  Competitive
                </span>{" "}
                Tournaments
              </h1>
              <p className="mt-4 text-xs font-bold tracking-widest text-slate-500 uppercase">
                Competitive Hub • Active Brackets
              </p>
            </div>

            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link
                  href="/tournaments/create"
                  className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 px-8 py-4 text-[11px] font-black tracking-[0.2em] text-white uppercase shadow-2xl shadow-rose-600/30 transition-all hover:scale-[1.02] hover:from-rose-500 hover:to-rose-600 active:scale-95"
                >
                  <Trophy className="h-5 w-5" />
                  Create Tournament
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Controls - Redesigned to match Player Finder */}
        <div className="mb-12 flex flex-col gap-4 rounded-2xl border border-white/5 bg-slate-900/50 p-2 backdrop-blur-sm md:flex-row md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search tournaments..."
              className="w-full rounded-xl border border-transparent bg-slate-950 px-4 py-3 pl-11 text-sm text-white transition-all outline-none focus:border-rose-500/50 focus:bg-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center rounded-xl border border-white/5 bg-slate-950 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-2 transition-all ${viewMode === "grid" ? "bg-rose-500 text-white shadow-lg shadow-rose-600/20" : "text-slate-500 hover:bg-white/5 hover:text-white"}`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-lg p-2 transition-all ${viewMode === "list" ? "bg-rose-500 text-white shadow-lg shadow-rose-600/20" : "text-slate-500 hover:bg-white/5 hover:text-white"}`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-full cursor-pointer appearance-none rounded-xl border border-white/5 bg-slate-950 px-6 py-3 text-sm text-slate-300 transition-all outline-none hover:border-white/10 focus:border-rose-500/50"
            >
              <option value="All">All Modes</option>
              <option value="5v5">5v5 Plant/Defuse</option>
              <option value="Deathmatch">Deathmatch Arena</option>
            </select>
          </div>
        </div>

        {/* Tournament Segments */}
        <div className="mb-8 flex flex-wrap items-center gap-8 border-b border-white/5">
          {[
            { id: "UPCOMING", label: "SCHEDULED / UPCOMING" },
            { id: "LIVE", label: "ONGOING (LIVE)" },
            { id: "COMPLETED", label: "COMPLETED / PAST" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-4 text-xs font-black tracking-[0.2em] uppercase transition-all ${
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
                <Link
                  href={`/tournaments/${tournament["$id"]}`}
                  key={tournament["$id"]}
                >
                  <BentoTilt className="h-full">
                    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0a0c10] p-6 transition-all group-hover:scale-[1.02] hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-900/20">
                      {/* Decorative Glow Blob */}
                      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-rose-500/5 blur-[100px] transition-colors group-hover:bg-rose-500/10" />

                      {/* Card Header */}
                      <div className="relative z-10 mb-6 flex min-h-[90px] items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-md border px-3 py-1 text-[10px] font-black tracking-widest uppercase ${
                                tournament.gameType === "Deathmatch"
                                  ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                                  : "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                              }`}
                            >
                              {tournament.gameType}
                            </span>
                          </div>
                          <h3 className="py-1 text-2xl leading-[0.9] font-black tracking-tight text-white uppercase italic transition-all group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 group-hover:bg-clip-text group-hover:text-transparent md:text-3xl">
                            {tournament.name}
                          </h3>
                        </div>
                        <div className="shrink-0 rounded-2xl border border-white/5 bg-white/5 p-3 text-slate-500 shadow-lg transition-all duration-300 group-hover:rotate-12 group-hover:border-rose-500 group-hover:bg-rose-500 group-hover:text-white">
                          <Shield className="h-6 w-6" />
                        </div>
                      </div>

                      {/* Prize Pool Box */}
                      <div className="relative z-10 mb-8 overflow-hidden rounded-2xl border border-white/5 bg-slate-950/50 p-6 transition-all duration-500 group-hover:border-rose-500/30">
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                        <div className="relative z-10 flex flex-col gap-4">
                          <div>
                            <span className="mb-2 block text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase transition-colors group-hover:text-rose-400">
                              Total Prize Pool
                            </span>
                            <div className="py-1">
                              <span className="inline-block origin-left bg-gradient-to-r from-white to-slate-400 bg-clip-text text-4xl leading-tight font-black tracking-tight text-transparent italic transition-all group-hover:scale-105 group-hover:from-rose-400 group-hover:to-amber-300 md:text-5xl">
                                ₹{tournament.prizePool}
                              </span>
                            </div>
                          </div>

                          {/* Breakdown Row */}
                          <div className="flex items-center gap-4 border-t border-white/5 pt-4 transition-colors group-hover:border-rose-500/10">
                            <div className="flex flex-col">
                              <span className="mb-1 text-[8px] font-black tracking-widest text-emerald-500/60 uppercase">
                                Winner
                              </span>
                              <span className="text-sm font-black text-slate-200 transition-colors group-hover:text-white">
                                ₹{tournament.firstPrize || "TBD"}
                              </span>
                            </div>
                            <div className="h-6 w-[1px] bg-white/5" />
                            <div className="flex flex-col">
                              <span className="mb-1 text-[8px] font-black tracking-widest text-slate-500 uppercase">
                                Runner Up
                              </span>
                              <span className="text-sm font-bold text-slate-400 transition-colors group-hover:text-slate-200">
                                ₹{tournament.secondPrize || "TBD"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Details */}
                      <div className="relative z-10 mt-auto flex items-center justify-between border-t border-white/5 pt-6 transition-colors group-hover:border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-rose-500">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              Start Date
                            </span>
                            <span className="text-sm font-bold text-slate-300">
                              {new Date(tournament.date).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Users className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-bold text-slate-300">
                              {tournament.maxTeams}{" "}
                              {tournament.gameType === "Deathmatch"
                                ? "Players"
                                : "Teams"}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-black tracking-widest uppercase ${
                              tournament.maxTeams -
                                (tournament.registeredTeams || 0) <=
                              2
                                ? "animate-pulse text-rose-500"
                                : "text-emerald-500"
                            }`}
                          >
                            {tournament.maxTeams -
                              (tournament.registeredTeams || 0)}{" "}
                            Slots Remaining
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
                <Link
                  href={`/tournaments/${tournament["$id"]}`}
                  key={tournament["$id"]}
                >
                  <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0c10] p-5 transition-all hover:border-rose-500/30 hover:bg-slate-900/50">
                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      {/* Left Section: Game Type & Name */}
                      <div className="flex items-center gap-6 md:w-[30%]">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                            tournament.gameType === "Deathmatch"
                              ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                              : "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                          }`}
                        >
                          {tournament.gameType === "Deathmatch" ? (
                            <Users className="h-6 w-6" />
                          ) : (
                            <Shield className="h-6 w-6" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase transition-colors group-hover:text-rose-500">
                            {tournament.gameType}
                          </span>
                          <h3 className="truncate text-xl font-black tracking-tight text-white uppercase italic transition-all group-hover:text-rose-500">
                            {tournament.name}
                          </h3>
                        </div>
                      </div>

                      {/* Center: Prize Information */}
                      <div className="flex flex-1 items-center justify-between border-y border-white/5 py-4 md:border-none md:px-12 md:py-0">
                        <div className="group/prize flex flex-col">
                          <span className="mb-1 text-[9px] font-black tracking-[0.2em] text-slate-600 uppercase transition-colors group-hover:text-rose-500">
                            Total Prize Pool
                          </span>
                          <span className="origin-left text-3xl leading-none font-black tracking-tight text-white italic transition-all group-hover:scale-110 group-hover:bg-gradient-to-r group-hover:from-rose-400 group-hover:to-amber-300 group-hover:bg-clip-text group-hover:text-transparent">
                            ₹{tournament.prizePool}
                          </span>
                        </div>
                        <div className="hidden h-10 w-[1px] bg-white/10 md:block" />
                        <div className="flex flex-col">
                          <span className="mb-1 text-[9px] font-black tracking-[0.2em] text-emerald-500 uppercase">
                            Winner
                          </span>
                          <span className="text-xl leading-none font-black tracking-tight text-slate-200 transition-colors group-hover:text-white">
                            ₹{tournament.firstPrize || "TBD"}
                          </span>
                        </div>
                        <div className="hidden h-10 w-[1px] bg-white/10 md:block" />
                        <div className="flex flex-col">
                          <span className="mb-1 text-[9px] font-black tracking-[0.2em] text-slate-600 uppercase">
                            Runner Up
                          </span>
                          <span className="text-xl leading-none font-black tracking-tight text-slate-400 transition-colors group-hover:text-slate-200">
                            ₹{tournament.secondPrize || "TBD"}
                          </span>
                        </div>
                      </div>

                      {/* Right Section: Date & Slots */}
                      <div className="flex items-center justify-between gap-8 md:w-[30%] md:justify-end">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black tracking-widest text-slate-600 uppercase">
                            Start Date
                          </span>
                          <span className="text-sm font-black tracking-tight text-slate-300 uppercase">
                            {new Date(tournament.date).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <div className="flex h-10 items-center gap-3 rounded-xl border border-white/5 bg-slate-950/50 px-4">
                          <Users className="h-4 w-4 text-slate-500" />
                          <span
                            className={`text-[10px] font-black tracking-widest uppercase ${
                              tournament.maxTeams -
                                (tournament.registeredTeams || 0) <=
                              2
                                ? "text-rose-500"
                                : "text-emerald-500"
                            }`}
                          >
                            {tournament.maxTeams -
                              (tournament.registeredTeams || 0)}{" "}
                            OPEN
                          </span>
                        </div>
                        <div className="hidden transition-transform group-hover:translate-x-1 md:block">
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
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
            <Trophy className="mb-4 h-16 w-16 text-slate-800" />
            <h3 className="text-xl font-bold text-slate-500">
              No tournaments found
            </h3>
            <p className="mt-2 text-slate-600">
              Try adjusting your filters or search query.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilter("All");
              }}
              className="mt-6 text-xs font-black tracking-widest text-rose-500 uppercase hover:text-rose-400"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
