import { useState } from "react";
import { Activity, ArrowRight, Search } from "lucide-react";
import { agentIcons } from "@/assets/images/agents";
import Loader from "@/components/Loader";

export default function MatchHistory({
  matches,
  matchesLoading,
  valProfile,
  onMatchClick,
}) {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 p-8">
        <div>
          <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-white uppercase">
            <Activity className="h-6 w-6 text-rose-500" />
            In Game Record
          </h3>
          <p className="mt-1 ml-9 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
            Recent Match Performance
          </p>
        </div>

        <div className="flex rounded-2xl border border-white/5 bg-slate-950/80 p-1.5">
          {["All", "Competitive", "Unrated"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-6 py-2 text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
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

      <div className="custom-scrollbar space-y-2 overflow-y-auto p-2 md:max-h-[800px]">
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
        ) : matches.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4 inline-flex rounded-full border border-white/5 bg-slate-950 p-6">
              <Search className="h-10 w-10 text-slate-700" />
            </div>
            <p className="text-sm font-black tracking-widest text-slate-500 uppercase">
              No Missions Recorded
            </p>
          </div>
        ) : (
          matches
            .filter((m) => activeTab === "All" || m.metadata.mode === activeTab)
            .map((match) => {
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
                  {/* Status Edge Glow */}
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
                    {/* Agent Section */}
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

                    {/* Match Details */}
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

                  {/* Score Section */}
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

                  {/* Hover Arrow */}
                  <div className="hidden w-12 items-center justify-center text-slate-700 transition-colors group-hover:text-white md:flex">
                    <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
