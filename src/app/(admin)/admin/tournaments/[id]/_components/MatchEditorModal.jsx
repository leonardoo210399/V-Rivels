import {
  Swords,
  CheckCircle2,
  AlertCircle,
  Loader as LoaderIcon,
  Save,
  X,
  RotateCcw,
  Zap,
  Trophy,
  ChevronDown,
  ChevronUp,
  Map as MapIcon,
} from "lucide-react";

export default function MatchEditorModal({
  isOpen,
  onClose,
  match,
  actions,
  tournament,
  participantMap,
}) {
  if (!isOpen || !match) return null;

  // Destructure actions from useMatchActions hook
  const {
    matchEditData,
    setMatchEditData,
    teamAPlayers,
    teamBPlayers,
    expandedPlayers,
    savingMatch,
    saveStatus,
    valMatchId,
    setValMatchId,
    valRegion,
    setValRegion,
    isFetchingVal,
    importStatus,
    mapMatchIds,
    setMapMatchIds,
    fetchingMapIdx,
    viewingMapIdx,
    setViewingMapIdx,

    handleSaveMatchDetails,
    handleImportMatchJSON,
    updateMapScore,
    updatePlayerStat,
    togglePlayerExpand,
  } = actions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-slate-800/50 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Swords className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white uppercase">
                Edit Match Details
              </h2>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                {match.teamA === "LOBBY"
                  ? "Lobby Info"
                  : `Round ${match.round} • ${participantMap[match.teamA]?.name || "TBD"} vs ${participantMap[match.teamB]?.name || "TBD"}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus && (
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
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

            <button
              onClick={handleSaveMatchDetails}
              disabled={savingMatch}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-emerald-500 disabled:opacity-50"
            >
              {savingMatch ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save All
            </button>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition-all hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-rose-500/20 flex-1 space-y-6 overflow-y-auto p-6">
          {/* Quick Import - Only for non-lobby matches */}
          {match.teamA !== "LOBBY" && tournament.gameType === "5v5" && (
            <div className="mb-8 rounded-3xl border border-white/5 bg-slate-950/40 p-6 backdrop-blur-sm">
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-white uppercase">
                        Quick Import (BO1 / Single Match)
                      </span>
                      <p className="text-[8px] font-bold text-slate-500 uppercase">
                        For series use per-map inputs below
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/5 bg-slate-900/50 p-1.5 focus-within:border-rose-500/30">
                    <select
                      value={valRegion}
                      onChange={(e) => setValRegion(e.target.value)}
                      className="h-9 w-24 rounded-lg bg-slate-950 px-2 text-[10px] font-black text-rose-500 outline-none hover:bg-slate-900"
                    >
                      <option value="ap">ASIA (AP)</option>
                      <option value="eu">EUROPE (EU)</option>
                      <option value="na">N.AMERICA (NA)</option>
                      <option value="kr">KOREA (KR)</option>
                    </select>
                    <input
                      type="text"
                      value={valMatchId}
                      onChange={(e) => setValMatchId(e.target.value)}
                      placeholder="Match ID..."
                      className="h-9 flex-1 bg-transparent px-2 text-xs font-bold text-white outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleImportMatchJSON(null)}
                    disabled={!valMatchId.trim() || isFetchingVal}
                    className="flex h-10 w-32 items-center justify-center gap-2 rounded-xl bg-rose-600 text-[10px] font-black text-white uppercase transition-all hover:bg-rose-500 disabled:opacity-30"
                  >
                    {isFetchingVal ? (
                      <LoaderIcon className="h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3" />
                    )}
                    <span>Fetch All</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            className={`grid grid-cols-1 gap-8 ${match.teamA === "LOBBY" ? "mx-auto max-w-xl" : "lg:grid-cols-12"}`}
          >
            {/* Left Column: Match Config & Info */}
            <div
              className={`space-y-6 ${match.teamA === "LOBBY" ? "" : "lg:col-span-5"}`}
            >
              {/* Valorant Party Code */}
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 shadow-xl shadow-rose-900/5">
                <label className="mb-3 flex items-center gap-2 text-[10px] font-black tracking-widest text-rose-500 uppercase">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                  Valorant Party Code
                </label>
                <input
                  type="text"
                  value={matchEditData.valoPartyCode}
                  onChange={(e) =>
                    setMatchEditData({
                      ...matchEditData,
                      valoPartyCode: e.target.value,
                    })
                  }
                  placeholder="e.g. PARTY-123"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-5 py-4 font-mono text-xl font-black tracking-widest text-white transition-all outline-none focus:border-rose-500"
                />
              </div>

              {/* Manual Score Entry */}
              {match.teamA !== "LOBBY" && (
                <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/50">
                  <div className="flex items-center justify-between bg-slate-900/50 p-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-emerald-400" />
                      <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                        {tournament.gameType === "5v5"
                          ? "Series Score"
                          : "Match Score"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6 p-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-4 text-center">
                        <span className="mb-2 block truncate text-[9px] font-black tracking-widest text-rose-500 uppercase">
                          {participantMap[match.teamA]?.name || "Team A"}
                        </span>
                        <input
                          type="number"
                          value={matchEditData.scoreA}
                          onChange={(e) =>
                            setMatchEditData((prev) => ({
                              ...prev,
                              scoreA: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full bg-transparent text-center text-4xl font-black text-white outline-none"
                        />
                      </div>
                      <div className="relative rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.02] p-4 text-center">
                        <span className="mb-2 block truncate text-[9px] font-black tracking-widest text-cyan-400 uppercase">
                          {participantMap[match.teamB]?.name || "Team B"}
                        </span>
                        <input
                          type="number"
                          value={matchEditData.scoreB}
                          onChange={(e) =>
                            setMatchEditData((prev) => ({
                              ...prev,
                              scoreB: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full bg-transparent text-center text-4xl font-black text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* General Config */}
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-5">
                  <label className="mb-3 block text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    Match Format (Override)
                  </label>
                  <select
                    value={matchEditData.matchFormat || "Auto"}
                    onChange={(e) =>
                      setMatchEditData((prev) => ({
                        ...prev,
                        matchFormat: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-xs font-bold text-white outline-none focus:border-rose-500"
                  >
                    <option value="Auto">Auto (Default)</option>
                    <option value="BO1">BO1 (Best of 1)</option>
                    <option value="BO3">BO3 (Best of 3)</option>
                    <option value="BO5">BO5 (Best of 5)</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-5">
                  <label className="mb-3 block text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    Scheduled Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={matchEditData.scheduledTime}
                    onChange={(e) =>
                      setMatchEditData((prev) => ({
                        ...prev,
                        scheduledTime: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-xs font-bold text-white [color-scheme:dark] outline-none focus:border-rose-500"
                  />
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-5">
                  <label className="mb-3 block text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    Admin Private Notes
                  </label>
                  <textarea
                    value={matchEditData.notes}
                    onChange={(e) =>
                      setMatchEditData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-xs font-bold text-white transition-all outline-none focus:border-rose-500"
                    placeholder="Add internal match notes here..."
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Performances - ONLY FOR BRACKET MATCHES */}
            {match.teamA !== "LOBBY" && (
              <div className="lg:col-span-7">
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-950/50">
                  <div className="bg-slate-900/50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-widest text-white uppercase">
                          Detailed Stats View
                        </span>
                      </div>

                      <div className="flex gap-1 rounded-lg bg-slate-950 p-1">
                        <button
                          onClick={() => setViewingMapIdx(-1)}
                          className={`rounded px-3 py-1 text-[10px] font-bold transition-all ${viewingMapIdx === -1 ? "bg-rose-500 text-white" : "text-slate-500 hover:text-white"}`}
                        >
                          Series
                        </button>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setViewingMapIdx(i)}
                            className={`rounded px-3 py-1 text-[10px] font-bold transition-all ${viewingMapIdx === i ? "bg-rose-500 text-white" : "text-slate-500 hover:text-white"}`}
                          >
                            Map {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Per Map Fetches */}
                    {viewingMapIdx !== -1 && (
                      <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950 p-2">
                        <input
                          type="text"
                          placeholder={`Match ID for Map ${viewingMapIdx + 1}`}
                          className="flex-1 bg-transparent px-3 font-mono text-[10px] text-white outline-none"
                          value={mapMatchIds[viewingMapIdx] || ""}
                          onChange={(e) =>
                            setMapMatchIds((prev) => ({
                              ...prev,
                              [viewingMapIdx]: e.target.value,
                            }))
                          }
                        />
                        <button
                          onClick={() => handleImportMatchJSON(viewingMapIdx)}
                          disabled={
                            isFetchingVal || !mapMatchIds[viewingMapIdx]
                          }
                          className="rounded-lg bg-rose-600 px-3 py-2 text-[10px] font-black text-white uppercase hover:bg-rose-500 disabled:opacity-50"
                        >
                          {fetchingMapIdx === viewingMapIdx ? (
                            <LoaderIcon className="h-3 w-3 animate-spin" />
                          ) : (
                            "Fetch"
                          )}
                        </button>
                      </div>
                    )}

                    {/* Map Score Inputs if viewing specific map */}
                    {viewingMapIdx !== -1 && (
                      <div className="mb-4 flex gap-4">
                        <div className="flex-1 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2">
                          <label className="mb-1 block text-[8px] font-bold text-rose-500 uppercase">
                            Team A Score
                          </label>
                          <input
                            type="number"
                            className="w-full bg-transparent text-center text-xl font-black text-white outline-none"
                            value={
                              matchEditData.seriesScores?.[viewingMapIdx]?.a ||
                              0
                            }
                            onChange={(e) =>
                              updateMapScore(viewingMapIdx, "a", e.target.value)
                            }
                          />
                        </div>
                        <div className="flex-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2">
                          <label className="mb-1 block text-[8px] font-bold text-cyan-500 uppercase">
                            Team B Score
                          </label>
                          <input
                            type="number"
                            className="w-full bg-transparent text-center text-xl font-black text-white outline-none"
                            value={
                              matchEditData.seriesScores?.[viewingMapIdx]?.b ||
                              0
                            }
                            onChange={(e) =>
                              updateMapScore(viewingMapIdx, "b", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Players List */}
                  <div className="max-h-[500px] divide-y divide-white/5 overflow-y-auto p-4">
                    {[
                      {
                        teamName: participantMap[match.teamA]?.name || "Team A",
                        players: teamAPlayers,
                        prefix: "teamA",
                        color: "text-rose-500",
                      },
                      {
                        teamName: participantMap[match.teamB]?.name || "Team B",
                        players: teamBPlayers,
                        prefix: "teamB",
                        color: "text-cyan-500",
                      },
                    ].map((teamGroup) => (
                      <div key={teamGroup.prefix} className="mb-6">
                        <h4
                          className={`mb-3 text-[10px] font-black tracking-widest uppercase ${teamGroup.color}`}
                        >
                          {teamGroup.teamName} Check & Stats
                        </h4>
                        <div className="space-y-2">
                          {teamGroup.players.map((player, idx) => {
                            const uniqueKey = `${teamGroup.prefix}_${idx}`;
                            // Decide which stats to show: Aggregate or Map specific
                            const currentStats =
                              viewingMapIdx === -1
                                ? matchEditData.playerStats?.[uniqueKey] || {}
                                : matchEditData.mapPlayerStats?.[
                                    viewingMapIdx
                                  ]?.[uniqueKey] || {};

                            return (
                              <div
                                key={idx}
                                className="overflow-hidden rounded-xl border border-white/5 bg-slate-900"
                              >
                                <div
                                  className="flex cursor-pointer items-center justify-between p-3 hover:bg-white/5"
                                  onClick={() => togglePlayerExpand(uniqueKey)}
                                >
                                  <div className="flex items-center gap-3">
                                    {currentStats.agent && (
                                      <img
                                        src={`https://media.valorant-api.com/agents/${currentStats.agentId}/displayicon.png`}
                                        alt={currentStats.agent}
                                        className="h-8 w-8 rounded-full border border-white/10 bg-slate-800"
                                        onError={(e) =>
                                          (e.currentTarget.style.display =
                                            "none")
                                        }
                                      />
                                    )}
                                    <div>
                                      <p className="text-xs font-bold text-white">
                                        {player.ingameName}
                                      </p>
                                      <p className="font-mono text-[9px] text-slate-500">
                                        #{player.tag}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-[9px] text-slate-500 uppercase">
                                        K/D/A
                                      </p>
                                      <p className="font-mono text-xs text-white">
                                        {currentStats.kills || 0}/
                                        {currentStats.deaths || 0}/
                                        {currentStats.assists || 0}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[9px] text-slate-500 uppercase">
                                        ACS
                                      </p>
                                      <p className="font-mono text-xs text-emerald-400">
                                        {currentStats.acs || 0}
                                      </p>
                                    </div>
                                    {expandedPlayers[uniqueKey] ? (
                                      <ChevronUp className="h-4 w-4 text-slate-500" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-slate-500" />
                                    )}
                                  </div>
                                </div>

                                {/* Expanded Stats Editor - Only editable in Series Answer? Or allow edit per map? */}
                                {/* Original code edited Aggregate stats directly if map stats weren't used? */}
                                {/* For simplicity allow editing current view values. But update logic needs to know if we are updating map specific or aggregate. */}
                                {/* The hook 'updatePlayerStat' updates 'playerStats'. We need a way to update 'mapPlayerStats' if viewingMapIdx !== -1. */}
                                {/* Current 'updatePlayerStat' in hook only updates 'playerStats'. We might need to enhance hook or just disable editing in modal for now unless it's basic fields. */}
                                {/* Let's stick to displaying them for now to avoid complexity, or just allow editing 'playerStats' (Series Total) when viewing Series. */}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
