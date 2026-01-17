import React from "react";
import { Trophy, Users, Target, Medal, Clock } from "lucide-react";

export default function CompleteStandings({
  registrations,
  tournament,
  matches = [],
}) {
  // Find the DM Lobby match status
  const lobbyMatch = matches.find((m) => m.teamA === "LOBBY");
  const isCompleted = lobbyMatch?.status === "completed";

  // Sort registrations by score if available
  const sortedParticipants = [...registrations].sort((a, b) => {
    const parseMeta = (str) => {
      try {
        return str ? (typeof str === "string" ? JSON.parse(str) : str) : {};
      } catch (e) {
        return {};
      }
    };
    const metaA = parseMeta(a.metadata);
    const metaB = parseMeta(b.metadata);
    return (metaB.kills || 0) - (metaA.kills || 0);
  });

  if (registrations.length === 0) return null;

  return (
    <section
      id="tournament-standings"
      className="animate-in fade-in slide-in-from-bottom-8 mx-auto mt-12 max-w-6xl px-6 duration-1000"
    >
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0a0c10]/80 p-6 shadow-2xl backdrop-blur-3xl md:p-12">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -mt-48 -mr-48 h-96 w-96 rounded-full bg-rose-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -mb-48 -ml-48 h-96 w-96 rounded-full bg-blue-500/5 blur-[100px]" />

        <div className="relative">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-500">
                  <Trophy className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic md:text-4xl">
                  Live Standings
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
                  Official Tournament Leaderboard
                </p>
                {lobbyMatch && (
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-black tracking-widest uppercase shadow-lg ${
                      lobbyMatch.status === "completed"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                        : lobbyMatch.status === "ongoing"
                          ? "animate-pulse border-amber-500/20 bg-amber-500/10 text-amber-500"
                          : "border-white/5 bg-slate-500/10 text-slate-500"
                    }`}
                  >
                    {lobbyMatch.status}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-slate-900/50 px-6 py-3 backdrop-blur-md">
                <Users className="h-4 w-4 text-rose-500" />
                <span className="text-xs font-black tracking-widest text-white uppercase">
                  {registrations.length} Players
                </span>
              </div>
              {(lobbyMatch?.scheduledTime || tournament?.date) && (
                <div
                  className="flex items-center gap-2 rounded-2xl border border-white/5 bg-slate-900/50 px-6 py-3 backdrop-blur-md"
                  suppressHydrationWarning
                >
                  <Clock className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
                    {new Date(
                      lobbyMatch?.scheduledTime || tournament?.date,
                    ).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Layout - Card based */}
          <div className="space-y-3 md:hidden">
            {/* Mobile Header */}
            <div className="grid grid-cols-[40px_40px_1fr_auto] items-center gap-3 border-b border-white/5 px-4 py-3 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
              <span className="text-center">#</span>
              <span></span>
              <span>Player</span>
              <span className="flex gap-3">
                <span className="w-8 text-center">K</span>
                <span className="w-8 text-center">D</span>
              </span>
            </div>

            {sortedParticipants.map((reg, index) => {
              let metadata = {};
              try {
                metadata = reg.metadata
                  ? typeof reg.metadata === "string"
                    ? JSON.parse(reg.metadata)
                    : reg.metadata
                  : {};
              } catch (e) {
                metadata = {};
              }
              const isTop3 = index < 3;

              return (
                <div
                  key={reg.$id}
                  className={`relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition-all ${index === 0 ? "border-rose-500/20 bg-rose-500/[0.05]" : ""}`}
                >
                  {/* Main Row */}
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black italic ${
                        index === 0
                          ? "bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-500/20"
                          : index === 1
                            ? "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950"
                            : index === 2
                              ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                              : "border border-white/5 bg-slate-900 text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-slate-900">
                      {metadata.playerCard ? (
                        <img
                          src={`https://media.valorant-api.com/playercards/${metadata.playerCard}/displayicon.png`}
                          alt="Card"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Target
                          className={`h-4 w-4 ${isTop3 ? "text-rose-500" : "text-slate-600"}`}
                        />
                      )}
                    </div>

                    {/* Player Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black tracking-tighter text-white uppercase italic">
                        {metadata.playerName || reg.teamName || "Anonymous"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${reg.checkedIn ? "bg-emerald-500" : "bg-slate-700"}`}
                        />
                        <p className="text-[9px] font-black tracking-widest text-slate-500 uppercase">
                          {reg.checkedIn ? (
                            <span className="text-emerald-500">Checked In</span>
                          ) : (
                            "Awaiting"
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-center">
                        <p className="text-[8px] font-black text-slate-600 uppercase">
                          K
                        </p>
                        <p className="text-lg font-black text-white italic">
                          {metadata.kills || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-slate-600 uppercase">
                          D
                        </p>
                        <p className="text-sm font-black text-slate-600 italic">
                          {metadata.deaths || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Winner Badge for top positions */}
                  {index === 0 && isCompleted && (
                    <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[8px] font-black tracking-widest text-rose-500 uppercase">
                      <Medal className="h-2.5 w-2.5" /> Winner
                    </div>
                  )}
                  {index === 1 && isCompleted && (
                    <div className="absolute top-2 right-2 text-[8px] font-black tracking-widest text-emerald-500 uppercase">
                      Runner Up
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Layout - Table based */}
          <div className="hidden overflow-hidden rounded-3xl border border-white/5 bg-slate-950/40 shadow-inner backdrop-blur-sm md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/80 text-[10px] font-black tracking-[0.25em] text-slate-500 uppercase">
                  <th className="w-20 px-8 py-6 text-center">#</th>
                  <th className="px-8 py-6">Player</th>
                  <th className="w-32 px-8 py-6 text-center">Kills</th>
                  <th className="w-32 px-8 py-6 text-center">Deaths</th>
                  <th className="px-8 py-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedParticipants.map((reg, index) => {
                  let metadata = {};
                  try {
                    metadata = reg.metadata
                      ? typeof reg.metadata === "string"
                        ? JSON.parse(reg.metadata)
                        : reg.metadata
                      : {};
                  } catch (e) {
                    metadata = {};
                  }
                  const isTop3 = index < 3;

                  return (
                    <tr
                      key={reg.$id}
                      className={`group transition-all duration-300 hover:bg-white/[0.03] ${index === 0 ? "bg-rose-500/[0.03]" : ""}`}
                    >
                      <td className="px-8 py-6">
                        <div
                          className={`mx-auto flex h-10 w-10 transform items-center justify-center rounded-xl text-sm font-black italic shadow-2xl transition-transform group-hover:scale-110 ${
                            index === 0
                              ? "bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-rose-500/20"
                              : index === 1
                                ? "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950"
                                : index === 2
                                  ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                                  : "border border-white/5 bg-slate-900 text-slate-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-slate-900 shadow-lg transition-all group-hover:border-rose-500/30">
                            {metadata.playerCard ? (
                              <img
                                src={`https://media.valorant-api.com/playercards/${metadata.playerCard}/displayicon.png`}
                                alt="Card"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <Target
                                className={`h-5 w-5 ${isTop3 ? "text-rose-500" : "text-slate-600"}`}
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-lg font-black tracking-tighter text-white uppercase italic transition-colors group-hover:text-rose-500">
                              {metadata.playerName ||
                                reg.teamName ||
                                "Anonymous Player"}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${reg.checkedIn ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-700"}`}
                              />
                              <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                                {reg.checkedIn ? (
                                  <span className="text-emerald-500">
                                    Checked In
                                  </span>
                                ) : (
                                  "Awaiting"
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="block text-2xl font-black tracking-tighter text-white italic transition-transform group-hover:scale-125">
                          {metadata.kills || 0}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-lg font-black tracking-tighter text-slate-600 italic transition-colors group-hover:text-slate-400">
                          {metadata.deaths || 0}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end">
                          {index === 0 && isCompleted ? (
                            <div className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-[10px] font-black tracking-[0.2em] text-rose-500 uppercase shadow-lg shadow-rose-500/5">
                              <Medal className="h-3 w-3" /> Winner
                            </div>
                          ) : index === 1 && isCompleted ? (
                            <span className="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase">
                              Runner Up
                            </span>
                          ) : (
                            <span className="text-[10px] font-black tracking-[0.3em] text-slate-700 uppercase">
                              Contender
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
