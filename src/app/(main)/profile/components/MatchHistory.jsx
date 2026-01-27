import { useState, useRef, useEffect } from "react";
import {
  Activity,
  ArrowRight,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { agentIcons } from "@/assets/images/agents";
import Loader from "@/components/Loader";

export default function MatchHistory({
  matches,
  matchesLoading,
  valProfile,
  onMatchClick,
  onRefetch,
}) {
  const [activeTab, setActiveTab] = useState("All");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [cooldown, setCooldown] = useState(0);
  const COOLDOWN_TIME = 180; // 3 minutes in seconds

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isInitialMount = useRef(true);

  // Fetch matches specifically for the active mode when tab changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // We NO LONGER call with "" (All) because All is an aggregation of specific modes
    if (activeTab === "All") return;

    onRefetch(activeTab.toLowerCase());
  }, [activeTab]);

  // Cooldown logic
  useEffect(() => {
    const savedLastRefresh = localStorage.getItem(
      `last_refresh_${valProfile?.puuid}`,
    );
    if (savedLastRefresh) {
      const elapsed = Math.floor(
        (Date.now() - parseInt(savedLastRefresh)) / 1000,
      );
      if (elapsed < COOLDOWN_TIME) {
        setCooldown(COOLDOWN_TIME - elapsed);
      }
    }
  }, [valProfile]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleRefresh = () => {
    if (cooldown > 0 || matchesLoading) return;

    // If we refresh on "All", we refresh the most important mode (Competitive)
    // to trigger the chain reaction, or refresh current active mode
    const modeToRefresh =
      activeTab === "All" ? "competitive" : activeTab.toLowerCase();

    onRefetch(modeToRefresh, true);
    const now = Date.now();
    localStorage.setItem(`last_refresh_${valProfile?.puuid}`, now.toString());
    setCooldown(COOLDOWN_TIME);
  };

  const tabs = [
    "All",
    "Competitive",
    "Unrated",
    "Swiftplay",
    "Deathmatch",
    "Custom",
  ];

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-sm">
      {/* Header Section */}
      <div className="border-b border-white/5 p-4 md:p-8">
        {/* Top Row: Title & Refresh */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-white uppercase sm:text-2xl">
              <Activity className="h-6 w-6 text-rose-500" />
              In Game Record
            </h3>
            <p className="mt-1 ml-9 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
              Recent Match Performance
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={matchesLoading || cooldown > 0}
            className="group relative flex h-10 items-center justify-center gap-3 rounded-xl border border-white/5 bg-slate-950/80 px-4 text-slate-500 transition-all hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
            title={cooldown > 0 ? `Wait ${cooldown}s` : "Refresh matches"}
          >
            {cooldown > 0 ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 opacity-30" />
                <span className="font-mono text-xs font-black text-rose-500">
                  {Math.floor(cooldown / 60)}:
                  {String(cooldown % 60).padStart(2, "0")}
                </span>
              </div>
            ) : (
              <>
                <span className="hidden text-[10px] font-black tracking-widest uppercase sm:inline">
                  Refresh
                </span>
                <RefreshCw
                  className={`h-4 w-4 transition-transform ${matchesLoading ? "animate-spin" : "group-hover:rotate-45"}`}
                />
              </>
            )}
          </button>
        </div>

        {/* Bottom Row: Tab Filters */}
        <div className="flex w-full items-center">
          <div className="relative w-full" ref={dropdownRef}>
            {/* Mobile Dropdown */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-[#05060b] px-4 py-2.5 text-[11px] font-bold tracking-tight text-white transition-all duration-300 ${
                  isOpen
                    ? "border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.1)] ring-1 ring-amber-400/20"
                    : "border-white/10 shadow-lg hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Filter className="h-4 w-4 text-rose-500" strokeWidth={2.5} />
                  <span className="opacity-90">
                    {activeTab === "All" ? "All Modes" : activeTab}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="animate-in fade-in zoom-in-95 slide-in-from-top-2 absolute left-0 z-[100] mt-2 w-full min-w-[200px] origin-top-left overflow-hidden rounded-2xl border border-white/5 bg-[#12141c] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl duration-200">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center rounded-xl px-4 py-3.5 text-[11px] font-bold tracking-tight transition-all duration-200 ${
                        activeTab === tab
                          ? "bg-rose-500/10 text-rose-500"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      {tab === "All" ? "All Modes" : tab}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Tabs - Now Full Width */}
            <div className="hidden w-full items-center gap-1 rounded-2xl border border-white/5 bg-slate-950/80 p-1.5 md:flex">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-xl py-2.5 text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
                    activeTab === tab
                      ? "bg-rose-600 text-white shadow-xl shadow-rose-600/20"
                      : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Match List Section */}
      <div className="custom-scrollbar min-h-[400px] space-y-2 overflow-y-auto p-2 md:max-h-[800px]">
        {matchesLoading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-0 text-center">
            <Loader fullScreen={false} size="lg" />
            <div className="animate-pulse">
              <p className="text-sm font-black tracking-[0.2em] text-rose-500 uppercase">
                Syncing with Riot HQ
              </p>
              <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                Loading match intelligence...
              </p>
            </div>
          </div>
        ) : (
          (() => {
            const filteredMatches = matches
              .filter((m) => {
                if (!m || !m.metadata) return false;
                if (activeTab === "All") return true;
                const mode = m.metadata.mode?.toLowerCase() || "";
                const tab = activeTab.toLowerCase();

                if (tab === "deathmatch") return mode.includes("deathmatch");
                if (tab === "custom") return mode.includes("custom");

                return mode === tab;
              })
              .filter((m) => {
                if (!m || !m.players) return false;
                const allPlayers = m.players?.all_players || [];
                return allPlayers.some((p) => p.puuid === valProfile.puuid);
              });

            if (filteredMatches.length === 0) {
              return (
                <div className="flex h-96 flex-col items-center justify-center p-8 text-center">
                  <div className="mb-6 inline-flex rounded-full border border-white/5 bg-slate-950 p-8 shadow-inner shadow-rose-500/5">
                    <Search className="h-12 w-12 text-slate-500" />
                  </div>
                  <h4 className="text-lg font-black tracking-widest text-white uppercase">
                    No {activeTab !== "All" ? activeTab : ""} Missions
                  </h4>
                  <p className="mt-2 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
                    No combat records found in this category
                  </p>
                </div>
              );
            }

            return filteredMatches.map((match) => {
              const allPlayers = match.players?.all_players || [];
              const me = allPlayers.find((p) => p.puuid === valProfile.puuid);
              if (!me) return null;

              const myTeam = me.team?.toLowerCase();
              const teamData = match.teams?.[myTeam] || {};
              const hasWon = teamData.has_won || false;
              const roundsWon = teamData.rounds_won || 0;
              const roundsLost = teamData.rounds_lost || 0;
              const isDraw = roundsWon === roundsLost;

              const acs = Math.round(
                me.stats.score / match.metadata.rounds_played,
              );

              return (
                <div
                  key={match.metadata.matchid}
                  onClick={() => onMatchClick(match)}
                  className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/5 bg-slate-950/40 p-4 transition-all duration-300 hover:bg-slate-900/60 sm:flex-row sm:items-stretch sm:gap-6"
                >
                  <div
                    className={`absolute inset-y-0 left-0 w-1 ${
                      hasWon
                        ? "bg-emerald-500 shadow-[2px_0_10px_rgba(16,185,129,0.5)]"
                        : isDraw
                          ? "bg-slate-400 shadow-[2px_0_10px_rgba(148,163,184,0.5)]"
                          : "bg-rose-500 shadow-[2px_0_10px_rgba(244,63,94,0.5)]"
                    }`}
                  />

                  <div className="flex w-full flex-1 items-center justify-between gap-4 sm:w-auto sm:justify-start sm:gap-6">
                    <div className="relative order-last shrink-0 sm:order-first">
                      <div
                        className={`h-16 w-16 overflow-hidden rounded-2xl border border-white/10 transition-colors group-hover:border-white/20 md:h-24 md:w-24 ${
                          hasWon
                            ? "bg-emerald-950/20"
                            : isDraw
                              ? "bg-slate-900/40"
                              : "bg-rose-950/20"
                        }`}
                      >
                        <img
                          src={
                            typeof agentIcons[me.character] === "object"
                              ? agentIcons[me.character]?.src
                              : agentIcons[me.character] ||
                                me.assets.agent.small
                          }
                          alt={me.character}
                          className="h-full w-full object-cover p-1 transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-center">
                      <div className="mb-2 flex items-center gap-3">
                        <h4 className="text-base font-black tracking-tight text-white uppercase transition-colors group-hover:text-rose-500 md:text-xl">
                          {match.metadata.map}
                        </h4>
                        <span className="rounded-md border border-white/5 bg-white/5 px-2 py-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                          {match.metadata.mode}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                            KDA
                          </span>
                          <p className="font-mono text-sm font-black text-white">
                            {me.stats.kills}{" "}
                            <span className="font-normal text-slate-600">
                              /
                            </span>{" "}
                            {me.stats.deaths}{" "}
                            <span className="font-normal text-slate-600">
                              /
                            </span>{" "}
                            {me.stats.assists}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                            ACS
                          </span>
                          <p className="font-mono text-sm font-black text-white">
                            {acs}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 px-4 py-2 sm:mt-0 sm:flex-col sm:items-end sm:justify-center sm:px-8 sm:py-0">
                    <p
                      className={`mb-1 text-[10px] font-black tracking-[0.2em] ${
                        hasWon
                          ? "text-emerald-400"
                          : isDraw
                            ? "text-slate-400"
                            : "text-rose-400"
                      }`}
                    >
                      {hasWon ? "VICTORY" : isDraw ? "DRAW" : "DEFEAT"}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white tabular-nums md:text-3xl">
                        {roundsWon}
                      </span>
                      <span className="text-lg font-bold text-slate-600">
                        :
                      </span>
                      <span className="text-xl font-bold text-slate-500 tabular-nums">
                        {roundsLost}
                      </span>
                    </div>
                  </div>

                  <div className="hidden w-12 items-center justify-center text-slate-700 transition-colors group-hover:text-white md:flex">
                    <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
    </div>
  );
}
