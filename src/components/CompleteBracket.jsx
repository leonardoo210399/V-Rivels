import React from "react";
import { Trophy, Clock, Maximize2 } from "lucide-react";
import Link from "next/link";

const MatchCard = ({ match, teamA, teamB, isFinal }) => {
  const getStatusColor = (s) => {
    if (s === "completed") return "border-emerald-500/30 bg-emerald-500/5";
    if (s === "ongoing")
      return "border-amber-500/50 bg-amber-500/10 animate-pulse";
    return "border-white/10 bg-slate-900/40";
  };

  const isWinnerA = match.winner && match.winner === match.teamA;
  const isWinnerB = match.winner && match.winner === match.teamB;

  const time = match.scheduledTime;
  let displayTime = time;
  if (
    !time &&
    match.round &&
    match.matchIndex !== undefined &&
    match.tournamentDate
  ) {
    const startDate = new Date(match.tournamentDate);
    const offset = (match.round - 1) * 4 + match.matchIndex;
    startDate.setHours(startDate.getHours() + offset);
    displayTime = startDate.toISOString();
  }

  const dateOptions = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  const formattedTime = displayTime
    ? new Date(displayTime).toLocaleString([], dateOptions)
    : null;

  const isBye = match.round === 1 && (!match.teamA || !match.teamB);

  const containerClasses = `group relative flex w-64 flex-col gap-3 overflow-hidden rounded-xl border p-4 backdrop-blur-md transition-all ${getStatusColor(match.status)} ${isFinal ? "border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.05)] ring-1 ring-yellow-500/10" : ""} ${isBye ? "cursor-default opacity-80" : "cursor-pointer hover:translate-x-1 hover:border-rose-500/30"}`;

  const content = (
    <>
      {/* Team A */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex max-w-[170px] items-center gap-2">
          <div
            className={`h-6 w-1 rounded-full transition-colors duration-500 ${isWinnerA ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-slate-800"}`}
          />
          <span
            className={`truncate text-sm font-bold tracking-tight uppercase transition-colors ${isWinnerA ? "text-white" : !match.teamA && match.round === 1 ? "text-slate-600/50 italic" : "text-slate-400"}`}
          >
            {!match.teamA && match.round === 1
              ? "BYE"
              : teamA?.teamName || teamA?.name || "TBD"}
          </span>
        </div>
        <span
          className={`text-sm font-black italic ${isWinnerA ? "text-emerald-400" : "text-slate-600"}`}
        >
          {match.scoreA !== null
            ? match.scoreA
            : match.round === 1 && !match.teamA
              ? ""
              : "-"}
        </span>
      </div>

      {/* VS Divider */}
      <div className="relative h-px w-full bg-white/5">
        <div className="absolute top-1/2 left-4 -translate-y-1/2 bg-[#0a0c10] px-2 text-[8px] font-black tracking-widest text-slate-700 uppercase italic">
          VS
        </div>
      </div>

      {/* Team B */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex max-w-[170px] items-center gap-2">
          <div
            className={`h-6 w-1 rounded-full transition-colors duration-500 ${isWinnerB ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-slate-800"}`}
          />
          <span
            className={`truncate text-sm font-bold tracking-tight uppercase transition-colors ${isWinnerB ? "text-white" : !match.teamB && match.round === 1 ? "text-slate-600/50 italic" : "text-slate-400"}`}
          >
            {!match.teamB && match.round === 1
              ? "BYE"
              : teamB?.teamName || teamB?.name || "TBD"}
          </span>
        </div>
        <span
          className={`text-sm font-black italic ${isWinnerB ? "text-emerald-400" : "text-slate-600"}`}
        >
          {match.scoreB !== null
            ? match.scoreB
            : match.round === 1 && !match.teamB
              ? ""
              : "-"}
        </span>
      </div>

      {formattedTime && match.status !== "completed" && !isBye && (
        <div className="mt-1 flex items-center gap-1.5 border-t border-white/5 pt-2 opacity-50 transition-opacity group-hover:opacity-100">
          <Clock className="h-3 w-3 text-rose-500" />
          <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
            Scheduled: {formattedTime}
          </span>
        </div>
      )}
    </>
  );

  if (isBye) {
    return <div className={containerClasses}>{content}</div>;
  }

  return (
    <Link
      href={`/tournaments/${match.tournamentId}/match/${match.$id}`}
      className={containerClasses}
    >
      {content}
    </Link>
  );
};

export default function CompleteBracket({
  matches = [],
  participants = {},
  tournament = {},
}) {
  if (!matches.length) return null;

  const rounds = matches.reduce((acc, m) => {
    if (!acc[m.round]) acc[m.round] = [];
    acc[m.round].push(m);
    return acc;
  }, {});

  const roundKeys = Object.keys(rounds).sort(
    (a, b) => parseInt(a) - parseInt(b),
  );
  const getTeam = (id) => participants[id] || { name: "TBD" };

  const BASE_SLOT_HEIGHT = 180;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-[#0a0c10] shadow-2xl md:rounded-3xl">
      <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-rose-500/5 to-transparent p-4 md:p-8">
        <div>
          <h3 className="text-xl font-black tracking-tighter text-white uppercase md:text-2xl">
            Tournament Map
          </h3>
          <p className="text-[9px] font-black tracking-[0.2em] text-rose-500 uppercase md:text-[10px] md:tracking-[0.3em]">
            Official Bracket Progression
          </p>
        </div>
        <Trophy className="h-6 w-6 text-rose-500/20 md:h-8 md:w-8" />
      </div>

      <div className="custom-scrollbar max-h-[600px] overflow-x-auto overflow-y-auto scroll-smooth p-4 md:max-h-[800px] md:p-12">
        <div className="flex min-w-max gap-12 md:gap-24">
          {roundKeys.map((round, rIndex) => {
            const roundMatches = [...rounds[round]].sort(
              (a, b) => a.matchIndex - b.matchIndex,
            );
            const slotHeight = BASE_SLOT_HEIGHT * Math.pow(2, rIndex);

            return (
              <div key={round} className="relative flex w-64 flex-col">
                <div className="mb-10 text-center">
                  <span className="rounded-full border border-white/5 bg-slate-900 px-4 py-1.5 text-[9px] font-black tracking-[0.3em] text-rose-500 uppercase italic">
                    {rIndex === roundKeys.length - 1
                      ? "Championship"
                      : rIndex === roundKeys.length - 2
                        ? "Semi Finals"
                        : rIndex === roundKeys.length - 3
                          ? "Quarter Finals"
                          : `Stage ${round}`}
                  </span>
                </div>

                {roundMatches.map((match, mIndex) => {
                  const connectorHeight = slotHeight / 2;
                  return (
                    <div
                      key={match.$id}
                      className="relative flex items-center justify-center"
                      style={{ height: `${slotHeight}px` }}
                    >
                      <div className="relative z-10 transition-transform duration-300 hover:scale-105">
                        <MatchCard
                          match={{
                            ...match,
                            tournamentId: tournament.$id,
                            tournamentDate: tournament?.date,
                          }}
                          teamA={getTeam(match.teamA)}
                          teamB={getTeam(match.teamB)}
                          isFinal={rIndex === roundKeys.length - 1}
                        />
                      </div>

                      {rIndex < roundKeys.length - 1 && (
                        <div className="pointer-events-none absolute top-1/2 -right-24 z-0 w-24">
                          <div className="absolute top-0 left-0 h-px w-12 bg-white/20" />
                          <div
                            className="absolute left-12 w-px bg-white/20"
                            style={{
                              height: `${connectorHeight}px`,
                              top:
                                mIndex % 2 === 0
                                  ? "0"
                                  : `-${connectorHeight}px`,
                            }}
                          />
                          {mIndex % 2 === 0 && (
                            <div
                              className="absolute left-12 h-px w-12 bg-white/20"
                              style={{ top: `${connectorHeight}px` }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(225, 29, 72, 0.2);
        }
      `}</style>
    </div>
  );
}
