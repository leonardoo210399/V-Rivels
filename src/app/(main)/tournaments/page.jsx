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
  ChevronDown,
  Banknote,
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState("All");
  const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false);

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

      const matchesPrice =
        priceFilter === "All" ||
        (priceFilter === "Free" && (!t.entryFee || Number(t.entryFee) === 0)) ||
        (priceFilter === "Paid" && t.entryFee && Number(t.entryFee) > 0);

      return matchesFilter && matchesSearch && matchesStatus && matchesPrice;
    });
  }, [tournaments, filter, searchQuery, activeTab, priceFilter]);

  const tabCounts = useMemo(() => {
    const baseFiltered = tournaments.filter((t) => {
      const matchesFilter = filter === "All" || t.gameType === filter;
      const matchesSearch = t.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesPrice =
        priceFilter === "All" ||
        (priceFilter === "Free" && (!t.entryFee || Number(t.entryFee) === 0)) ||
        (priceFilter === "Paid" && t.entryFee && Number(t.entryFee) > 0);

      return matchesFilter && matchesSearch && matchesPrice;
    });

    return {
      UPCOMING: baseFiltered.filter(
        (t) => (t.status || "scheduled") === "scheduled",
      ).length,
      LIVE: baseFiltered.filter((t) => (t.status || "scheduled") === "ongoing")
        .length,
      COMPLETED: baseFiltered.filter(
        (t) => (t.status || "scheduled") === "completed",
      ).length,
    };
  }, [tournaments, filter, searchQuery]);

  if (loading) {
    return <Loader />;
  }

  // Optimize SEO with Structured Data for Events
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: tournaments.map((t, index) => ({
      "@type": "Event",
      position: index + 1,
      name: t.name,
      startDate: t.date,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      location: {
        "@type": "VirtualLocation",
        url: "https://www.vrivalsarena.com/tournaments/" + t.$id,
      },
      image: [
        "https://www.vrivalsarena.com/vrivals_logo.png", // Fallback or dynamic image
      ],
      description: `Join the ${t.name} Valorant tournament. Prize Pool: ₹${t.prizePool}. Format: ${t.gameType}.`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        availability:
          t.maxTeams > (t.registeredTeams || 0)
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
        url: "https://www.vrivalsarena.com/tournaments/" + t.$id,
      },
      organizer: {
        "@type": "Organization",
        name: "VRivals Arena",
        url: "https://www.vrivalsarena.com",
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="relative h-[30vh] w-full overflow-hidden border-b border-white/10 md:h-[40vh]">
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

        <div className="relative z-20 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-6 md:px-6 md:pb-12">
          {/* Header */}
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 px-1">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <h2 className="text-[11px] font-black tracking-[0.3em] text-rose-500 uppercase">
                  Operations Center
                </h2>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white uppercase italic md:text-5xl">
                <span className="text-rose-500 underline decoration-rose-500/30 underline-offset-8">
                  Competitive
                </span>{" "}
                Tournaments
              </h1>
              <p className="mt-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase md:mt-4 md:text-xs">
                Competitive Hub • Active Brackets
              </p>
            </div>

            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link
                  href="/tournaments/create"
                  className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-3 text-[10px] font-black tracking-[0.15em] text-white uppercase shadow-2xl shadow-rose-600/30 transition-all hover:scale-[1.02] hover:from-rose-500 hover:to-rose-600 active:scale-95 md:gap-4 md:rounded-2xl md:px-8 md:py-4 md:text-[11px] md:tracking-[0.2em]"
                >
                  <Trophy className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Create Tournament</span>
                  <span className="sm:hidden">Create</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-12">
        {/* Controls - Redesigned to match Player Finder */}
        <div className="relative z-30 mb-8 flex flex-col gap-4 rounded-2xl border border-white/5 bg-slate-900/50 p-2 backdrop-blur-sm md:mb-12 md:flex-row md:items-center">
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

          <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 md:w-auto md:overflow-visible md:pb-0">
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

            {/* Premium Custom Filter */}
            <div className="relative h-full flex-1 md:flex-none">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex w-full min-w-[160px] items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-950 px-6 py-3 text-sm text-slate-300 transition-all hover:border-white/10 focus:border-rose-500/50 md:w-44"
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-rose-500" />
                  {filter === "All" ? "All Modes" : filter}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${isFilterOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isFilterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsFilterOpen(false)}
                  />
                  <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-1 shadow-2xl backdrop-blur-xl md:right-0 md:left-auto">
                    {[
                      { value: "All", label: "All Modes" },
                      { value: "5v5", label: "5v5 Plant/Defuse" },
                      { value: "Deathmatch", label: "Deathmatch Arena" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilter(option.value);
                          setIsFilterOpen(false);
                        }}
                        className={`flex w-full items-center rounded-lg px-4 py-3 text-left text-sm transition-all hover:bg-white/5 ${
                          filter === option.value
                            ? "bg-rose-500/10 text-rose-500"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Price Filter */}
            <div className="relative h-full flex-1 md:flex-none">
              <button
                onClick={() => setIsPriceFilterOpen(!isPriceFilterOpen)}
                className="flex w-full min-w-[160px] items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-950 px-6 py-3 text-sm text-slate-300 transition-all hover:border-white/10 focus:border-rose-500/50 md:w-44"
              >
                <span className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-500" />
                  {priceFilter === "All" ? "All Prices" : priceFilter}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${isPriceFilterOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isPriceFilterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsPriceFilterOpen(false)}
                  />
                  <div className="absolute top-full right-0 z-50 mt-2 w-full min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-1 shadow-2xl backdrop-blur-xl">
                    {[
                      { value: "All", label: "All Prices" },
                      { value: "Free", label: "Free Entry" },
                      { value: "Paid", label: "Paid Tournaments" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setPriceFilter(option.value);
                          setIsPriceFilterOpen(false);
                        }}
                        className={`flex w-full items-center rounded-lg px-4 py-3 text-left text-sm transition-all hover:bg-white/5 ${
                          priceFilter === option.value
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tournament Segments */}
        <div className="mb-8 flex items-center gap-6 overflow-x-auto border-b border-white/5 pb-0.5 [-ms-overflow-style:'none'] [scrollbar-width:'none'] md:gap-8 md:overflow-visible [&::-webkit-scrollbar]:hidden">
          {[
            {
              id: "UPCOMING",
              label: "UPCOMING",
              fullLabel: "SCHEDULED / UPCOMING",
            },
            { id: "LIVE", label: "LIVE", fullLabel: "ONGOING (LIVE)" },
            {
              id: "COMPLETED",
              label: "COMPLETED",
              fullLabel: "COMPLETED / PAST",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative flex items-center gap-3 pb-4 text-xs font-black tracking-[0.2em] uppercase transition-all ${
                activeTab === tab.id
                  ? "text-rose-500"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span
                className={`flex h-5 min-w-[20px] items-center justify-center rounded-md border px-1.5 text-[9px] font-black tracking-normal transition-all ${
                  activeTab === tab.id
                    ? "border-rose-500/30 bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                    : "border-white/10 bg-slate-900 text-slate-500 group-hover:border-white/20 group-hover:text-slate-300"
                }`}
              >
                {tabCounts[tab.id]}
              </span>
              <span className="md:hidden">{tab.label}</span>
              <span className="hidden md:inline">{tab.fullLabel}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-8 flex items-baseline gap-2 pb-2">
          <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
            Showing
          </span>
          <span className="text-xl font-black text-white italic">
            {filteredTournaments.length}
          </span>
          <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
            Tournament{filteredTournaments.length !== 1 ? "s" : ""}
          </span>
          {searchQuery && (
            <>
              <span className="ml-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                for
              </span>
              <span className="text-sm font-bold text-rose-500">
                &quot;{searchQuery}&quot;
              </span>
            </>
          )}
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
                    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0a0c10] p-4 transition-all group-hover:scale-[1.02] hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-900/20 md:p-6">
                      {/* Decorative Glow Blob */}
                      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-rose-500/5 blur-[100px] transition-colors group-hover:bg-rose-500/10" />

                      {/* Card Header */}
                      <div className="relative z-10 mb-3 flex min-h-[90px] items-start justify-between gap-4">
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
                          <h3 className="py-1 text-xl leading-[0.9] font-black tracking-tight text-white uppercase italic transition-all group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 group-hover:bg-clip-text group-hover:text-transparent md:text-3xl">
                            {tournament.name}
                          </h3>
                        </div>
                        <div className="shrink-0 rounded-2xl border border-white/5 bg-white/5 p-3 text-slate-500 shadow-lg transition-all duration-300 group-hover:rotate-12 group-hover:border-rose-500 group-hover:bg-rose-500 group-hover:text-white">
                          <Shield className="h-6 w-6" />
                        </div>
                      </div>

                      {/* Prize Pool Box */}
                      <div className="relative z-10 mb-5 overflow-hidden rounded-2xl border border-white/5 bg-slate-950/50 p-4 transition-all duration-500 group-hover:border-rose-500/30 md:p-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                        <div className="relative z-10 flex flex-col gap-4">
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <span className="block text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase transition-colors group-hover:text-rose-400">
                                Total Prize Pool
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                                  Entry:
                                </span>
                                <span
                                  className={`text-[10px] font-black tracking-widest uppercase ${
                                    !tournament.entryFee ||
                                    Number(tournament.entryFee) === 0
                                      ? "text-emerald-500"
                                      : "text-amber-500"
                                  }`}
                                >
                                  {!tournament.entryFee ||
                                  Number(tournament.entryFee) === 0
                                    ? "FREE"
                                    : `₹${tournament.entryFee}`}
                                </span>
                              </div>
                            </div>
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
                      <div className="flex items-center gap-4 md:w-[25%] md:gap-6">
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
                      <div className="grid grid-cols-4 gap-2 border-y border-white/5 py-3 md:flex md:flex-1 md:items-center md:justify-between md:border-none md:px-8 md:py-0">
                        <div className="flex flex-col">
                          <span className="mb-1 text-[8px] font-black tracking-widest text-slate-600 uppercase md:text-[9px] md:tracking-[0.2em]">
                            Entry Fee
                          </span>
                          <span
                            className={`text-base leading-none font-black tracking-tight transition-colors md:text-xl ${
                              !tournament.entryFee ||
                              Number(tournament.entryFee) === 0
                                ? "text-emerald-500"
                                : "text-amber-500"
                            }`}
                          >
                            {!tournament.entryFee ||
                            Number(tournament.entryFee) === 0
                              ? "FREE"
                              : `₹${tournament.entryFee}`}
                          </span>
                        </div>
                        <div className="hidden h-10 w-[1px] bg-white/10 md:block" />
                        <div className="group/prize flex flex-col">
                          <span className="mb-1 text-[8px] font-black tracking-widest text-slate-600 uppercase transition-colors group-hover:text-rose-500 md:text-[9px] md:tracking-[0.2em]">
                            Prize Pool
                          </span>
                          <span className="origin-left text-xl leading-none font-black tracking-tight text-white italic transition-all group-hover:bg-gradient-to-r group-hover:from-rose-400 group-hover:to-amber-300 group-hover:bg-clip-text group-hover:text-transparent md:text-3xl md:group-hover:scale-110">
                            ₹{tournament.prizePool}
                          </span>
                        </div>
                        <div className="hidden h-10 w-[1px] bg-white/10 md:block" />
                        <div className="flex flex-col text-center md:text-left">
                          <span className="mb-1 text-[8px] font-black tracking-widest text-emerald-500 uppercase md:text-[9px] md:tracking-[0.2em]">
                            Winner
                          </span>
                          <span className="text-base leading-none font-black tracking-tight text-slate-200 transition-colors group-hover:text-white md:text-xl">
                            ₹{tournament.firstPrize || "TBD"}
                          </span>
                        </div>
                        <div className="hidden h-10 w-[1px] bg-white/10 md:block" />
                        <div className="flex flex-col text-right md:text-left">
                          <span className="mb-1 text-[8px] font-black tracking-widest text-slate-600 uppercase md:text-[9px] md:tracking-[0.2em]">
                            Runner Up
                          </span>
                          <span className="text-base leading-none font-black tracking-tight text-slate-400 transition-colors group-hover:text-slate-200 md:text-xl">
                            ₹{tournament.secondPrize || "TBD"}
                          </span>
                        </div>
                      </div>

                      {/* Right Section: Date & Slots */}
                      <div className="flex items-center justify-between gap-4 md:w-[30%] md:justify-end md:gap-8">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black tracking-widest text-slate-600 uppercase md:text-[9px]">
                            Start Date
                          </span>
                          <span className="text-xs font-black tracking-tight text-slate-300 uppercase md:text-sm">
                            {new Date(tournament.date).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <div className="flex h-8 items-center gap-2 rounded-lg border border-white/5 bg-slate-950/50 px-3 md:h-10 md:gap-3 md:rounded-xl md:px-4">
                          <Users className="h-3 w-3 text-slate-500 md:h-4 md:w-4" />
                          <span
                            className={`text-[9px] font-black tracking-widest uppercase md:text-[10px] ${
                              tournament.maxTeams -
                                (tournament.registeredTeams || 0) <=
                              2
                                ? "text-rose-500"
                                : "text-emerald-500"
                            }`}
                          >
                            {tournament.maxTeams -
                              (tournament.registeredTeams || 0)}{" "}
                            <span className="hidden sm:inline">OPEN</span>
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
