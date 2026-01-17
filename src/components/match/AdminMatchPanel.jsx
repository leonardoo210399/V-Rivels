"use client";
import { useState, useEffect } from "react";
import {
  Shield,
  Clock,
  Trophy,
  Users,
  Target,
  Skull,
  Swords,
  Medal,
  Save,
  X,
  Edit3,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  Crosshair,
} from "lucide-react";
import { updateMatchDetails, parsePlayerStats } from "@/lib/brackets";

/**
 * AdminMatchPanel Component
 * Comprehensive admin controls for managing match details
 *
 * @param {Object} props
 * @param {Object} props.match - Match document
 * @param {Object} props.teamA - Team A registration
 * @param {Object} props.teamB - Team B registration
 * @param {Array} props.teamAPlayers - Array of Team A player objects
 * @param {Array} props.teamBPlayers - Array of Team B player objects
 * @param {Function} props.onUpdate - Callback when match is updated
 * @param {Function} props.onScoreSubmit - Callback to submit final score
 * @param {boolean} props.isCompleted - If match is completed
 */
export default function AdminMatchPanel({
  match,
  teamA,
  teamB,
  teamAPlayers = [],
  teamBPlayers = [],
  onUpdate,
  onScoreSubmit,
  isCompleted = false,
}) {
  // Tab state
  const [activeTab, setActiveTab] = useState("scores");

  // Score state
  const [scoreA, setScoreA] = useState(match?.scoreA || 0);
  const [scoreB, setScoreB] = useState(match?.scoreB || 0);

  // Scheduled time state
  const [scheduledTime, setScheduledTime] = useState(
    match?.scheduledTime
      ? new Date(match.scheduledTime).toISOString().slice(0, 16)
      : "",
  );

  // Notes state
  const [notes, setNotes] = useState(match?.notes || "");

  // Player stats state - format: { playerId: { kills, deaths, assists, acs } }
  const [playerStats, setPlayerStats] = useState(() => {
    return parsePlayerStats(match) || {};
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [expandedPlayers, setExpandedPlayers] = useState({});

  // Update local state when match prop changes
  useEffect(() => {
    if (match) {
      setScoreA(match.scoreA || 0);
      setScoreB(match.scoreB || 0);
      setScheduledTime(
        match.scheduledTime
          ? new Date(match.scheduledTime).toISOString().slice(0, 16)
          : "",
      );
      setNotes(match.notes || "");
      setPlayerStats(parsePlayerStats(match) || {});
    }
  }, [match]);

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveStatus(null);

    try {
      await updateMatchDetails(match.$id, {
        scheduledTime: scheduledTime
          ? new Date(scheduledTime).toISOString()
          : null,
        notes,
        playerStats,
        scoreA: parseInt(scoreA),
        scoreB: parseInt(scoreB),
      });

      setSaveStatus({ type: "success", message: "Match details saved!" });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to save match details:", error);
      setSaveStatus({
        type: "error",
        message: "Failed to save: " + error.message,
      });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const updatePlayerStat = (playerKey, stat, value) => {
    setPlayerStats((prev) => ({
      ...prev,
      [playerKey]: {
        ...(prev[playerKey] || { kills: 0, deaths: 0, assists: 0, acs: 0 }),
        [stat]: parseInt(value) || 0,
      },
    }));
  };

  const togglePlayerExpand = (playerKey) => {
    setExpandedPlayers((prev) => ({
      ...prev,
      [playerKey]: !prev[playerKey],
    }));
  };

  const incrementScore = (team) => {
    if (team === "A") {
      setScoreA((prev) => Math.min(13, parseInt(prev || 0) + 1));
    } else {
      setScoreB((prev) => Math.min(13, parseInt(prev || 0) + 1));
    }
  };

  const decrementScore = (team) => {
    if (team === "A") {
      setScoreA((prev) => Math.max(0, parseInt(prev || 0) - 1));
    } else {
      setScoreB((prev) => Math.max(0, parseInt(prev || 0) - 1));
    }
  };

  const tabs = [
    { id: "scores", label: "Scores", icon: Trophy },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "players", label: "Player Stats", icon: Users },
    { id: "notes", label: "Notes", icon: FileText },
  ];

  // Generate player list with unique keys
  const allPlayers = [
    ...(teamAPlayers || []).map((p, i) => ({
      ...p,
      key: `teamA_${i}`,
      team: "A",
      teamName: teamA?.teamName || "Team A",
      teamColor: "rose",
    })),
    ...(teamBPlayers || []).map((p, i) => ({
      ...p,
      key: `teamB_${i}`,
      team: "B",
      teamName: teamB?.teamName || "Team B",
      teamColor: "cyan",
    })),
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.03]">
      {/* Header */}
      <div className="border-b border-emerald-500/10 bg-emerald-500/5 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-black tracking-widest text-emerald-500 uppercase">
              Admin Controls
            </h3>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveAll}
            disabled={saving || isCompleted}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                <span>Save All</span>
              </>
            )}
          </button>
        </div>

        {/* Save Status Toast */}
        {saveStatus && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
              saveStatus.type === "success"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {saveStatus.type === "success" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {saveStatus.message}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/5 bg-slate-900/30 px-4 md:px-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-[10px] font-black tracking-widest whitespace-nowrap uppercase transition-all ${
                activeTab === tab.id
                  ? "border-b-2 border-emerald-500 text-emerald-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 md:p-6">
        {/* SCORES TAB */}
        {activeTab === "scores" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Team A Score */}
              <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4 transition-colors hover:border-rose-500/30">
                <div className="mb-3 flex justify-between">
                  <span className="text-[10px] font-black tracking-widest text-rose-500 uppercase">
                    {teamA?.teamName || "Team A"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    ROUNDS WON
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => decrementScore("A")}
                    disabled={isCompleted}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl font-bold text-white transition-all hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/20 disabled:opacity-50"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={scoreA}
                    onChange={(e) =>
                      setScoreA(
                        Math.max(
                          0,
                          Math.min(13, parseInt(e.target.value) || 0),
                        ),
                      )
                    }
                    disabled={isCompleted}
                    className="w-20 bg-transparent text-center text-5xl font-black text-white italic outline-none disabled:opacity-50"
                    min="0"
                    max="13"
                  />
                  <button
                    onClick={() => incrementScore("A")}
                    disabled={isCompleted}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl font-bold text-white transition-all hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/20 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Team B Score */}
              <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4 transition-colors hover:border-cyan-500/30">
                <div className="mb-3 flex justify-between">
                  <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">
                    {teamB?.teamName || "Team B"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    ROUNDS WON
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => decrementScore("B")}
                    disabled={isCompleted}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl font-bold text-white transition-all hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={scoreB}
                    onChange={(e) =>
                      setScoreB(
                        Math.max(
                          0,
                          Math.min(13, parseInt(e.target.value) || 0),
                        ),
                      )
                    }
                    disabled={isCompleted}
                    className="w-20 bg-transparent text-center text-5xl font-black text-white italic outline-none disabled:opacity-50"
                    min="0"
                    max="13"
                  />
                  <button
                    onClick={() => incrementScore("B")}
                    disabled={isCompleted}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl font-bold text-white transition-all hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Final Score Button */}
            {!isCompleted && scoreA !== scoreB && onScoreSubmit && (
              <button
                onClick={() => onScoreSubmit(scoreA, scoreB)}
                className="group relative w-full overflow-hidden rounded-xl bg-emerald-600 py-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 transition-opacity group-hover:opacity-90" />
                <div className="relative flex items-center justify-center gap-2 text-xs font-black tracking-[0.2em] text-white uppercase">
                  <Trophy className="h-4 w-4" />
                  <span>Finalize & Submit Result</span>
                </div>
              </button>
            )}

            {scoreA === scoreB && scoreA > 0 && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-xs font-bold text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Scores are tied. A winner must be determined to submit.
                </span>
              </div>
            )}
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === "schedule" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                  Match Scheduled Time
                </span>
              </div>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={isCompleted}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-medium text-white transition-colors outline-none focus:border-indigo-500/50 disabled:opacity-50"
              />
              <p className="mt-2 text-[10px] text-slate-500">
                This will update the countdown timer and match schedule display.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-slate-950/30 p-4">
              <p className="text-xs text-slate-400">
                <strong className="text-white">Note:</strong> Changing the
                scheduled time will update the countdown timer visible to all
                players. The match status will remain unchanged.
              </p>
            </div>
          </div>
        )}

        {/* PLAYER STATS TAB */}
        {activeTab === "players" && (
          <div className="space-y-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Enter individual player performance stats for this match
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/50 px-3 py-1.5 text-[9px] font-bold text-slate-500 uppercase">
                <Target className="h-3 w-3" />K / D / A / ACS
              </div>
            </div>

            {allPlayers.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-slate-900/30 p-8 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-slate-600" />
                <p className="text-sm text-slate-500">No players available</p>
                <p className="mt-1 text-xs text-slate-600">
                  Player rosters will appear once teams are assigned
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Group by team */}
                {["A", "B"].map((team) => {
                  const teamPlayers = allPlayers.filter((p) => p.team === team);
                  if (teamPlayers.length === 0) return null;

                  const teamInfo = teamPlayers[0];
                  const borderColor =
                    team === "A" ? "border-rose-500/30" : "border-cyan-400/30";
                  const textColor =
                    team === "A" ? "text-rose-500" : "text-cyan-400";
                  const bgColor =
                    team === "A" ? "bg-rose-500/5" : "bg-cyan-500/5";

                  return (
                    <div key={team} className="space-y-2">
                      <div
                        className={`flex items-center gap-2 rounded-lg ${bgColor} px-3 py-2`}
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${team === "A" ? "bg-rose-500" : "bg-cyan-400"}`}
                        />
                        <span
                          className={`text-xs font-black tracking-widest uppercase ${textColor}`}
                        >
                          {teamInfo.teamName}
                        </span>
                      </div>

                      {teamPlayers.map((player) => {
                        const stats = playerStats[player.key] || {
                          kills: 0,
                          deaths: 0,
                          assists: 0,
                          acs: 0,
                        };
                        const isExpanded = expandedPlayers[player.key];

                        return (
                          <div
                            key={player.key}
                            className={`rounded-xl border ${borderColor} bg-slate-900/40 transition-all`}
                          >
                            {/* Player Header */}
                            <button
                              onClick={() => togglePlayerExpand(player.key)}
                              className="flex w-full items-center justify-between p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${borderColor} bg-slate-950/50`}
                                >
                                  <Crosshair
                                    className={`h-4 w-4 ${textColor}`}
                                  />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-bold text-white">
                                    {player.ingameName ||
                                      player.name ||
                                      "Player"}
                                  </p>
                                  {player.tag && (
                                    <p
                                      className={`text-[10px] font-bold ${textColor}`}
                                    >
                                      #{player.tag}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Quick Stats Display */}
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                  <span className="text-emerald-400">
                                    {stats.kills}
                                  </span>
                                  <span>/</span>
                                  <span className="text-red-400">
                                    {stats.deaths}
                                  </span>
                                  <span>/</span>
                                  <span className="text-amber-400">
                                    {stats.assists}
                                  </span>
                                  <span className="text-slate-600">|</span>
                                  <span className="text-purple-400">
                                    {stats.acs}
                                  </span>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-slate-500" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-slate-500" />
                                )}
                              </div>
                            </button>

                            {/* Expanded Stats Input */}
                            {isExpanded && (
                              <div className="border-t border-white/5 p-4">
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                  {/* Kills */}
                                  <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 uppercase">
                                      <Target className="h-3 w-3" />
                                      Kills
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={stats.kills}
                                      onChange={(e) =>
                                        updatePlayerStat(
                                          player.key,
                                          "kills",
                                          e.target.value,
                                        )
                                      }
                                      disabled={isCompleted}
                                      className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-center text-lg font-bold text-white transition-colors outline-none focus:border-emerald-500 disabled:opacity-50"
                                    />
                                  </div>

                                  {/* Deaths */}
                                  <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[9px] font-bold text-red-400 uppercase">
                                      <Skull className="h-3 w-3" />
                                      Deaths
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={stats.deaths}
                                      onChange={(e) =>
                                        updatePlayerStat(
                                          player.key,
                                          "deaths",
                                          e.target.value,
                                        )
                                      }
                                      disabled={isCompleted}
                                      className="w-full rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-center text-lg font-bold text-white transition-colors outline-none focus:border-red-500 disabled:opacity-50"
                                    />
                                  </div>

                                  {/* Assists */}
                                  <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[9px] font-bold text-amber-400 uppercase">
                                      <Swords className="h-3 w-3" />
                                      Assists
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={stats.assists}
                                      onChange={(e) =>
                                        updatePlayerStat(
                                          player.key,
                                          "assists",
                                          e.target.value,
                                        )
                                      }
                                      disabled={isCompleted}
                                      className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-center text-lg font-bold text-white transition-colors outline-none focus:border-amber-500 disabled:opacity-50"
                                    />
                                  </div>

                                  {/* ACS */}
                                  <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[9px] font-bold text-purple-400 uppercase">
                                      <Medal className="h-3 w-3" />
                                      ACS
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={stats.acs}
                                      onChange={(e) =>
                                        updatePlayerStat(
                                          player.key,
                                          "acs",
                                          e.target.value,
                                        )
                                      }
                                      disabled={isCompleted}
                                      className="w-full rounded-lg border border-purple-500/30 bg-purple-500/5 px-3 py-2 text-center text-lg font-bold text-white transition-colors outline-none focus:border-purple-500 disabled:opacity-50"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                  Admin Notes
                </span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add private notes about this match (only visible to admins)..."
                rows={6}
                disabled={isCompleted}
                className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-600 transition-colors outline-none focus:border-amber-500/50 disabled:opacity-50"
              />
              <p className="mt-2 text-[10px] text-slate-500">
                Notes are only visible to tournament administrators.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-slate-950/30 p-4">
              <p className="text-xs text-slate-400">
                <strong className="text-white">Suggestions:</strong> Use this to
                record match issues, player reports, technical problems, score
                disputes, or any other admin-relevant information.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
