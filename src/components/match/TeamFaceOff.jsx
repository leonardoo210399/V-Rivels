"use client";
import { Trophy, Swords, Crown, Clock } from "lucide-react";

export default function TeamFaceOff({ teamA, teamB, match, isCompleted }) {
  const scoreA = match?.scoreA || 0;
  const scoreB = match?.scoreB || 0;
  const isTeamAWinner = isCompleted && scoreA > scoreB;
  const isTeamBWinner = isCompleted && scoreB > scoreA;
  const scheduledTime = match?.scheduledTime;
  const formattedTime = scheduledTime
    ? new Date(scheduledTime).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="glass-heavy relative overflow-hidden rounded-3xl border border-white/10">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-transparent to-cyan-500/10" />
        <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-rose-500/5 to-transparent" />
        <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-cyan-500/5 to-transparent" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-8">
          {/* Team A */}
          <div className="group flex flex-col items-center text-center md:items-start md:text-left">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-black tracking-[0.3em] text-rose-500/80 uppercase">
                Team A
              </span>
              {isTeamAWinner && (
                <Crown className="h-4 w-4 animate-bounce text-rose-500" />
              )}
            </div>

            <h2
              className={`mb-2 text-3xl font-black tracking-tight uppercase italic transition-all duration-300 md:text-4xl lg:text-5xl ${
                isTeamAWinner
                  ? "text-glow-rose text-rose-400"
                  : "text-white group-hover:text-rose-400"
              }`}
            >
              {teamA?.teamName ||
                (match?.teamA && match.teamA !== "LOBBY"
                  ? "Loading..."
                  : "TBD")}
            </h2>

            {teamA && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span className="font-bold">
                  {teamA.playerCount || 5} Players
                </span>
                {teamA.tag && (
                  <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-black text-rose-400">
                    {teamA.tag}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* VS / Score Section */}
          <div className="flex shrink-0 flex-col items-center justify-center gap-4">
            {isCompleted ? (
              <div className="flex flex-col items-center gap-6">
                {/* Match Score */}
                <div className="flex items-center gap-6 md:gap-8">
                  {/* Team A Score */}
                  <div
                    className={`relative flex flex-col items-center transition-all duration-500 ${isTeamAWinner ? "scale-110" : "scale-100"}`}
                  >
                    <span
                      className={`text-6xl font-black italic md:text-7xl lg:text-8xl ${
                        isTeamAWinner
                          ? "text-glow-rose text-rose-500"
                          : "text-slate-600"
                      }`}
                    >
                      {scoreA}
                    </span>
                  </div>

                  {/* VS Divider */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-800/50 md:h-14 md:w-14">
                      <span className="text-sm font-black text-slate-400 md:text-base">
                        VS
                      </span>
                    </div>
                  </div>

                  {/* Team B Score */}
                  <div
                    className={`relative flex flex-col items-center transition-all duration-500 ${isTeamBWinner ? "scale-110" : "scale-100"}`}
                  >
                    <span
                      className={`text-6xl font-black italic md:text-7xl lg:text-8xl ${
                        isTeamBWinner
                          ? "text-glow-cyan text-cyan-400"
                          : "text-slate-600"
                      }`}
                    >
                      {scoreB}
                    </span>
                  </div>
                </div>

                {/* Winner Banner */}
                {(isTeamAWinner || isTeamBWinner) && (
                  <div
                    className={`flex items-center gap-2 rounded-full border px-6 py-2.5 ${
                      isTeamAWinner
                        ? "glow-rose border-rose-500/40 bg-gradient-to-r from-rose-500/20 to-rose-500/10"
                        : "glow-cyan border-cyan-400/40 bg-gradient-to-r from-cyan-400/20 to-cyan-400/10"
                    }`}
                  >
                    <Trophy
                      className={`h-4 w-4 ${isTeamAWinner ? "text-rose-400" : "text-cyan-400"}`}
                    />
                    <p
                      className={`text-sm font-black tracking-wider uppercase ${isTeamAWinner ? "text-rose-400" : "text-cyan-400"}`}
                    >
                      {isTeamAWinner ? teamA?.teamName : teamB?.teamName} Wins!
                    </p>
                  </div>
                )}

                {/* Match Time */}
                {formattedTime && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase">
                      Match Time: {formattedTime}
                    </span>
                  </div>
                )}

                {/* Series Breakdown */}
                {match?.seriesScores &&
                  JSON.parse(match.seriesScores).length > 0 && (
                    <div className="mt-2 flex flex-col items-center gap-2">
                      <p className="text-[8px] font-black tracking-widest text-slate-500 uppercase">
                        Series Breakdown
                      </p>
                      <div className="flex gap-1.5">
                        {JSON.parse(match.seriesScores).map((score, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col items-center rounded-lg border border-white/5 bg-slate-950/50 px-3 py-1.5 ${
                              score.a === 0 && score.b === 0 ? "opacity-30" : ""
                            }`}
                          >
                            <span className="mb-1 text-[7px] font-bold text-slate-600 uppercase">
                              Map {idx + 1}
                            </span>
                            <div className="flex items-center gap-2 font-mono text-xs font-black">
                              <span
                                className={
                                  score.a > score.b
                                    ? "text-rose-500"
                                    : "text-slate-400"
                                }
                              >
                                {score.a}
                              </span>
                              <span className="text-slate-700">-</span>
                              <span
                                className={
                                  score.b > score.a
                                    ? "text-cyan-400"
                                    : "text-slate-400"
                                }
                              >
                                {score.b}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <>
                {/* VS Badge */}
                <div className="group relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/10 bg-slate-900/80 shadow-2xl transition-all hover:scale-110 hover:border-rose-500/50 md:h-28 md:w-28">
                  <Swords className="h-10 w-10 text-slate-500 transition-all group-hover:text-rose-500 md:h-12 md:w-12" />
                  <div className="absolute inset-0 rounded-full bg-rose-500/0 blur-2xl transition-all group-hover:bg-rose-500/20" />

                  {/* Pulsing Ring */}
                  <div className="absolute inset-0 animate-ping rounded-full border-2 border-rose-500/20 opacity-75" />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <p className="text-center text-sm font-bold tracking-wider text-slate-400 uppercase">
                    Match Pending
                  </p>
                  {formattedTime && (
                    <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-slate-900/50 px-3 py-1 opacity-60">
                      <Clock className="h-3 w-3 text-rose-500" />
                      <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        {formattedTime}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Team B */}
          <div className="group flex flex-col items-center text-center md:items-end md:text-right">
            <div className="mb-3 flex items-center gap-2">
              {isTeamBWinner && (
                <Crown className="h-4 w-4 animate-bounce text-cyan-400" />
              )}
              <span className="text-xs font-black tracking-[0.3em] text-cyan-400/80 uppercase">
                Team B
              </span>
            </div>

            <h2
              className={`mb-2 text-3xl font-black tracking-tight uppercase italic transition-all duration-300 md:text-4xl lg:text-5xl ${
                isTeamBWinner
                  ? "text-glow-cyan text-cyan-400"
                  : "text-white group-hover:text-cyan-400"
              }`}
            >
              {teamB?.teamName || (match?.teamB ? "Loading..." : "TBD")}
            </h2>

            {teamB && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                {teamB.tag && (
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-400">
                    {teamB.tag}
                  </span>
                )}
                <span className="font-bold">
                  {teamB.playerCount || 5} Players
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Border Glow */}
      <div className="absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-rose-500/50 via-transparent to-cyan-500/50" />
    </div>
  );
}
