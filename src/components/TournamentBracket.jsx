import React from "react";
import { Trophy, Clock } from "lucide-react";
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

  return (
    <Link
      href={`/tournaments/${match.tournamentId}/match/${match.$id}`}
      className={`group relative flex w-64 cursor-pointer flex-col gap-3 overflow-hidden rounded-xl border p-4 backdrop-blur-md transition-all hover:translate-x-1 hover:border-rose-500/30 ${getStatusColor(match.status)} ${isFinal ? "border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.05)] ring-1 ring-yellow-500/10" : ""} `}
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-24 w-24 bg-rose-500/5 blur-3xl transition-colors group-hover:bg-rose-500/10" />

      {/* Team A */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex max-w-[170px] items-center gap-2">
          <div
            className={`h-6 w-1 rounded-full transition-colors duration-500 ${isWinnerA ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-slate-800"}`}
          />
          <span
            className={`truncate text-sm font-bold tracking-tight uppercase transition-colors ${isWinnerA ? "text-white" : "text-slate-400"}`}
          >
            {teamA?.teamName || teamA?.name || "TBD"}
          </span>
        </div>
        <span
          className={`text-sm font-black italic ${isWinnerA ? "text-emerald-400" : "text-slate-600"}`}
        >
          {match.scoreA !== null ? match.scoreA : "-"}
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
            className={`truncate text-sm font-bold tracking-tight uppercase transition-colors ${isWinnerB ? "text-white" : "text-slate-400"}`}
          >
            {teamB?.teamName || teamB?.name || "TBD"}
          </span>
        </div>
        <span
          className={`text-sm font-black italic ${isWinnerB ? "text-emerald-400" : "text-slate-600"}`}
        >
          {match.scoreB !== null ? match.scoreB : "-"}
        </span>
      </div>

      {formattedTime && match.status !== "completed" && (
        <div
          className="mt-1 flex items-center gap-1.5 border-t border-white/5 pt-2 opacity-50 transition-opacity group-hover:opacity-100"
          suppressHydrationWarning
        >
          <Clock className="h-3 w-3 text-rose-500" />
          <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
            Scheduled: {formattedTime}
          </span>
        </div>
      )}

      {isFinal && (
        <div className="absolute -top-1 -right-1 z-20 rounded-bl-xl bg-gradient-to-br from-yellow-400 to-yellow-600 p-2 text-black shadow-lg shadow-yellow-500/20">
          <Trophy className="h-4 w-4" />
        </div>
      )}
    </Link>
  );
};

export default function TournamentBracket({
  matches = [],
  participants = {},
  tournament = {},
}) {
  if (!matches.length)
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/5 bg-slate-950/20 p-20 text-slate-600">
        <Trophy className="mb-4 h-12 w-12 opacity-10" />
        <p className="text-xs font-black tracking-[0.3em] uppercase">
          Bracket not generated yet
        </p>
      </div>
    );

  // Group matches by round
  const rounds = matches.reduce((acc, m) => {
    if (!acc[m.round]) acc[m.round] = [];
    acc[m.round].push(m);
    return acc;
  }, {});

  const roundKeys = Object.keys(rounds).sort(
    (a, b) => parseInt(a) - parseInt(b),
  );
  const getTeam = (id) => participants[id] || { name: "TBD" };

  // Compact heights for Tab view
  const BASE_SLOT_HEIGHT = 160;

  return (
    <div className="custom-scrollbar w-full overflow-x-auto scroll-smooth pb-10">
      <div className="flex min-w-max gap-12">
        {roundKeys.map((round, rIndex) => {
          const roundMatches = [...rounds[round]].sort(
            (a, b) => a.matchIndex - b.matchIndex,
          );
          const slotHeight = BASE_SLOT_HEIGHT * Math.pow(2, rIndex);

          return (
            <div key={round} className="relative flex w-60 flex-col">
              {/* Round Header */}
              <div className="mb-8 text-center">
                <span className="text-[9px] font-black tracking-[0.3em] whitespace-nowrap text-rose-500/60 uppercase italic">
                  {rIndex === roundKeys.length - 1
                    ? "Finals"
                    : rIndex === roundKeys.length - 2
                      ? "Semi"
                      : rIndex === roundKeys.length - 3
                        ? "Quarter"
                        : `Round ${round}`}
                </span>
              </div>

              {/* Matches */}
              {roundMatches.map((match, mIndex) => {
                const connectorHeight = slotHeight / 2;

                return (
                  <div
                    key={match.$id}
                    className="relative flex items-center justify-center"
                    style={{ height: `${slotHeight}px` }}
                  >
                    <div className="relative z-10 origin-center scale-90">
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

                    {/* Connector Lines */}
                    {rIndex < roundKeys.length - 1 && (
                      <div className="pointer-events-none absolute top-1/2 -right-12 z-0 w-12">
                        <div className="absolute top-0 left-0 h-px w-6 bg-white/10" />
                        <div
                          className="absolute left-6 w-px bg-white/10"
                          style={{
                            height: `${connectorHeight}px`,
                            top:
                              mIndex % 2 === 0 ? "0" : `-${connectorHeight}px`,
                          }}
                        />
                        {mIndex % 2 === 0 && (
                          <div
                            className="absolute left-6 h-px w-6 bg-white/10"
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

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(225, 29, 72, 0.4);
          border: 2px solid transparent;
          background-clip: content-box;
        }
      `}</style>
    </div>
  );
}
