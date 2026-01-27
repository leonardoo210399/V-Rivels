"use client";
import { Info, Clock, Globe, Gamepad2, ScrollText } from "lucide-react";

/**
 * MatchInfo Component
 * Displays match format, rules, server region, and time limits
 *
 * @param {Object} props
 * @param {Object} props.tournament - Tournament object with game settings
 * @param {Object} props.match - Match object with specific match details
 * @param {number} props.totalRounds - Total number of rounds in the tournament
 */
export default function MatchInfo({ tournament, match, totalRounds }) {
  if (!tournament || !match) {
    return null;
  }

  // Determine match format based on game type and round
  const getMatchFormat = () => {
    if (tournament.gameType === "Deathmatch") {
      return "Solo Deathmatch";
    }

    // Individual match format override (highest priority)
    if (match.matchFormat && match.matchFormat !== "Auto") {
      if (match.matchFormat === "BO1") return "Best of 1 (BO1)";
      if (match.matchFormat === "BO3") return "Best of 3 (BO3)";
      if (match.matchFormat === "BO5") return "Best of 5 (BO5)";
    }

    // Explicit format from tournament settings
    if (tournament.matchFormat === "BO1") return "Best of 1 (BO1)";
    if (tournament.matchFormat === "BO3") return "Best of 3 (BO3)";
    if (tournament.matchFormat === "BO5") return "Best of 5 (BO5)";

    // Default dynamic logic:
    // Final round = Finals
    // Final round - 1 = Semi-finals
    const currentRound = match.round;
    const isFinal = totalRounds > 0 && currentRound === totalRounds;
    const isSemi = totalRounds > 1 && currentRound === totalRounds - 1;

    if (isFinal || isSemi) {
      return "Best of 3 (BO3)";
    }

    return "Best of 1 (BO1)";
  };

  // Get server region from tournament location
  const getServerRegion = () => {
    const location = tournament.location?.toLowerCase() || "online";

    if (location.includes("mumbai") || location.includes("india")) {
      return "Mumbai (ap)";
    } else if (location.includes("singapore")) {
      return "Singapore (ap)";
    } else if (location.includes("eu") || location.includes("europe")) {
      return "Frankfurt (eu)";
    } else if (location.includes("na") || location.includes("america")) {
      return "Virginia (na-east)";
    }

    return "Mumbai (ap)"; // Default
  };

  // Get time limit based on game type
  const getTimeLimit = () => {
    if (tournament.gameType === "Deathmatch") {
      return "10 minutes or 40 kills";
    }
    return "No time limit (Standard Spike mode)";
  };

  const matchRules = [
    "All players must be in the custom lobby 5 minutes before start time",
    "Screenshot proof required for score disputes",
    "Disconnects: 5-minute grace period for reconnection",
    "Exploits and cheating result in immediate disqualification",
    tournament.gameType === "5v5"
      ? "No agent restrictions - play your strongest picks"
      : "Standard deathmatch rules apply",
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl md:rounded-3xl md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3 md:mb-6">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-amber-500 md:p-3">
          <Info className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <div>
          <h3 className="text-base font-black tracking-tight text-white uppercase md:text-lg">
            Match Information
          </h3>
          <p className="text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase md:text-[10px]">
            Format, rules, and server details
          </p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid gap-3 md:gap-4 lg:grid-cols-2">
        {/* Match Format */}
        <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/50 p-4 transition-all hover:border-amber-500/20">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
              <Gamepad2 className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase md:text-[10px]">
                Match Format
              </p>
              <p className="text-sm font-black tracking-tight text-white uppercase md:text-base">
                {getMatchFormat()}
              </p>
              {tournament.gameType === "5v5" && (
                <p className="mt-1 text-[10px] text-slate-600">
                  {getMatchFormat().includes("BO3") ||
                  getMatchFormat().includes("BO5")
                    ? "First to win multiple maps advances"
                    : "Winner advances to next round"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Server Region */}
        <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/50 p-4 transition-all hover:border-cyan-500/20">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2">
              <Globe className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase md:text-[10px]">
                Server Region
              </p>
              <p className="text-sm font-black tracking-tight text-white uppercase md:text-base">
                {getServerRegion()}
              </p>
              <p className="mt-1 text-[10px] text-slate-600">
                Ensure low ping for fair gameplay
              </p>
            </div>
          </div>
        </div>

        {/* Time Limit */}
        <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/50 p-4 transition-all hover:border-rose-500/20">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2">
              <Clock className="h-4 w-4 text-rose-500" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase md:text-[10px]">
                Time Limit
              </p>
              <p className="text-sm font-black tracking-tight text-white md:text-base">
                {getTimeLimit()}
              </p>
              {tournament.gameType === "5v5" && (
                <p className="mt-1 text-[10px] text-slate-600">
                  Standard competitive timer
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Game Mode */}
        <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/50 p-4 transition-all hover:border-emerald-500/20">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
              <ScrollText className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase md:text-[10px]">
                Game Mode
              </p>
              <p className="text-sm font-black tracking-tight text-white uppercase md:text-base">
                {tournament.gameType === "Deathmatch"
                  ? "Deathmatch"
                  : "Standard"}
              </p>
              <p className="mt-1 text-[10px] text-slate-600">
                {tournament.gameType === "Deathmatch"
                  ? "Solo elimination mode"
                  : "Competitive 5v5 spike mode"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Match Rules */}
      <div className="mt-4 md:mt-6">
        <h4 className="mb-3 flex items-center gap-2 text-xs font-black tracking-[0.2em] text-amber-500 uppercase md:text-sm">
          <div className="h-1 w-1 rounded-full bg-amber-500" />
          Match Rules
        </h4>
        <div className="space-y-2">
          {matchRules.map((rule, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-lg border border-white/5 bg-slate-950/30 p-2.5 text-[10px] text-slate-400 transition-all hover:border-amber-500/10 hover:bg-slate-950/50 md:gap-3 md:p-3 md:text-xs"
            >
              <div className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500/60" />
              <span className="flex-1 leading-relaxed">{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notice */}
      <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 md:mt-6 md:p-4">
        <div className="flex items-start gap-2 md:gap-3">
          <Info className="h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="mb-1 text-[9px] font-black tracking-widest text-amber-500 uppercase md:text-[10px]">
              Important
            </p>
            <p className="text-[10px] leading-relaxed text-slate-400 md:text-xs">
              Team captains are responsible for ensuring all members follow the
              rules. Any violations will result in penalties or
              disqualification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
