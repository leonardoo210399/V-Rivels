import {
  Swords,
  RotateCcw,
  Loader as LoaderIcon,
  Trophy,
  Info,
  Clock,
  Edit2,
  Map as MapIcon,
  Check,
} from "lucide-react";
import { useState } from "react";

export default function BracketView({
  tournament,
  matches,
  registrations,
  participantMap,
  actions, // from useMatchActions
  tournamentActions, // from useTournamentActions
}) {
  const [selectedFormat, setSelectedFormat] = useState("BO1");
  const {
    handleUpdateMatchStatus,
    handleSaveMatchScore,
    handleResetIndividualMatch,
    handleStartVeto,
    selectMatchForEdit,
    matchScores,
    setMatchScores,
    matchPartyCodes,
    setMatchPartyCodes,
    matchResetSteps,
    updating: matchUpdating,
    handleSkirmishLottery,
  } = actions;

  const {
    handleStartTournament,
    handleResetBracket,
    dmPartyCode,
    setDmPartyCode,
    startStep,
    startError,
    resetStep,
    resetError,
    updating: tournamentUpdating,
  } = tournamentActions;

  const isWorking = matchUpdating || tournamentUpdating;

  const is5v5 = tournament.gameType === "5v5";
  const isBracketMode = ["5v5", "1v1", "2v2", "3v3"].includes(
    tournament.gameType,
  );

  return (
    <div className="rounded-3xl border border-white/5 bg-slate-950/30 p-8 backdrop-blur-sm">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-rose-500/10 p-3 text-rose-500">
            <Swords className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white uppercase">
              Match Control Overview
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Manage statuses and player performances
            </p>
          </div>
        </div>

        {matches.length > 0 && (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleResetBracket}
              disabled={isWorking || resetStep === 2}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black tracking-widest uppercase shadow-lg transition-all ${
                resetStep === 1
                  ? "animate-pulse bg-amber-500 text-slate-950"
                  : resetStep === 2
                    ? "bg-slate-900 text-slate-600"
                    : "border border-white/5 bg-slate-950 text-slate-500 hover:bg-rose-500/5 hover:text-rose-500"
              }`}
              title="Reset Bracket"
            >
              {resetStep === 0 && (
                <>
                  <RotateCcw className="h-4 w-4" /> Reset Matches
                </>
              )}
              {resetStep === 1 && (
                <>
                  <Info className="h-4 w-4" /> Click to Confirm Reset
                </>
              )}
              {resetStep === 2 && (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              )}
            </button>
            {resetError && (
              <p className="text-[8px] font-bold text-rose-500 uppercase">
                {resetError}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {matches.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/5 bg-slate-900/20 py-20 text-center">
            <div className="mx-auto mb-6 w-fit rounded-full border border-white/5 bg-slate-900 p-6">
              <Trophy className="h-10 w-10 text-slate-700" />
            </div>
            <h3 className="mb-2 text-xl font-bold tracking-tight text-white uppercase">
              No active matches found
            </h3>
            <p className="mx-auto mb-8 max-w-sm text-sm text-slate-500">
              To begin management, you first need to generate the bracket for
              this tournament.
            </p>

            <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
              {startStep === 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {[
                    { id: "BO1", label: "All BO1" },
                    { id: "BO3", label: "All BO3" },
                    { id: "BO5", label: "All BO5" },
                    { id: "BO1_FINAL_BO3", label: "BO1 + Final BO3" },
                    { id: "BO1_FINAL_BO5", label: "BO1 + Final BO5" },
                    {
                      id: "BO1_SEMI_BO3_FINAL_BO5",
                      label: "BO1 + Semis BO3 + Final BO5",
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedFormat(option.id)}
                      className={`rounded-xl px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all ${
                        selectedFormat === option.id
                          ? "bg-rose-500 text-white shadow-lg ring-2 shadow-rose-900/40 ring-rose-500 ring-offset-2 ring-offset-slate-950"
                          : "border border-white/5 bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleStartTournament(selectedFormat)}
                disabled={
                  isWorking || registrations.length < 2 || startStep === 2
                }
                className={`flex w-full items-center justify-center gap-3 rounded-2xl px-8 py-4 text-xs font-black tracking-[0.2em] uppercase shadow-xl transition-all md:w-auto ${
                  startStep === 1
                    ? "animate-pulse bg-amber-500 text-slate-950"
                    : startStep === 2
                      ? "bg-slate-900 text-slate-600"
                      : "bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-700"
                } disabled:opacity-30`}
              >
                {startStep === 2 ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <Swords className="h-4 w-4" />
                )}
                {startStep === 0 && (
                  <span>
                    Generate{" "}
                    <span className="text-emerald-200">
                      {[
                        { id: "BO1", label: "All BO1" },
                        { id: "BO3", label: "All BO3" },
                        { id: "BO5", label: "All BO5" },
                        { id: "BO1_FINAL_BO3", label: "Mixed" },
                        { id: "BO1_FINAL_BO5", label: "Mixed" },
                        {
                          id: "BO1_SEMI_BO3_FINAL_BO5",
                          label: "Mixed",
                        },
                      ].find((o) => o.id === selectedFormat)?.label ||
                        selectedFormat}
                    </span>{" "}
                    Bracket
                  </span>
                )}
                {startStep === 1 && "Click to Confirm Start"}
              </button>
            </div>

            {startError && (
              <p className="mt-4 text-[10px] font-bold tracking-widest text-rose-500 uppercase">
                {startError}
              </p>
            )}

            {registrations.length < 2 && (
              <p className="mt-4 text-[10px] font-bold tracking-widest text-rose-500 uppercase">
                Need at least 2 participants to start
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="mb-2 border-b border-white/5 pb-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
              Active Matches
            </h4>
            <div className="grid gap-3">
              {matches
                .filter((m) => m.teamA !== "LOBBY")
                .map((match) => (
                  <div
                    key={match.$id}
                    className="group flex flex-col rounded-2xl border border-white/5 bg-slate-900/50 p-4 transition-all hover:border-rose-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-slate-950 text-xs font-black text-rose-500 italic">
                          {match.teamA === "LOBBY" ? "L" : `R${match.round}`}
                        </div>
                        <div>
                          <p className="text-sm font-black tracking-tight text-white uppercase">
                            {match.teamA === "LOBBY" ? (
                              "Main Lobby Match"
                            ) : (
                              <span className="flex items-center gap-2">
                                <span className="text-rose-500">
                                  {!match.teamA && match.round === 1
                                    ? "BYE"
                                    : participantMap[match.teamA]?.name ||
                                      "TBD"}
                                </span>
                                <span className="text-slate-600 opacity-40">
                                  VS
                                </span>
                                <span className="text-rose-500">
                                  {!match.teamB && match.round === 1
                                    ? "BYE"
                                    : participantMap[match.teamB]?.name ||
                                      "TBD"}
                                </span>
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-3">
                            <p className="text-[10px] font-black text-slate-600 uppercase">
                              ID: {match.$id.substring(0, 8)}...
                            </p>
                            {(() => {
                              const time = match.scheduledTime;
                              let displayTime = time;
                              if (!time && tournament.date) {
                                if (isBracketMode) {
                                  const startDate = new Date(tournament.date);
                                  const offset =
                                    (match.round - 1) * 4 + match.matchIndex;
                                  startDate.setHours(
                                    startDate.getHours() + offset,
                                  );
                                  displayTime = startDate.toISOString();
                                } else {
                                  displayTime = tournament.date;
                                }
                              }
                              return displayTime ? (
                                <p
                                  className="flex items-center gap-1 text-[10px] font-black tracking-widest text-rose-500/60 uppercase"
                                  suppressHydrationWarning
                                >
                                  <Clock className="h-3 w-3" />
                                  {new Date(displayTime).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </p>
                              ) : null;
                            })()}
                            {match.matchFormat && (
                              <p className="ml-2 rounded-md bg-slate-800 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-emerald-400 uppercase">
                                {match.matchFormat === "Auto"
                                  ? "BO1"
                                  : match.matchFormat}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Inline Party Code Input */}
                        {isBracketMode && match.teamA !== "LOBBY" && (
                          <div className="mr-2 flex flex-col gap-1">
                            <label className="ml-1 text-[8px] font-black tracking-widest text-rose-500/60 uppercase">
                              Party Code
                            </label>
                            <div className="group/party relative">
                              <input
                                type="text"
                                placeholder="PARTY-123"
                                className="w-32 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 font-mono text-[10px] font-bold text-white transition-all outline-none focus:border-rose-500"
                                value={
                                  matchPartyCodes[match.$id] ??
                                  match.valoPartyCode ??
                                  ""
                                }
                                onChange={(e) =>
                                  setMatchPartyCodes({
                                    ...matchPartyCodes,
                                    [match.$id]: e.target.value.toUpperCase(),
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    actions.handleSavePartyCode(match.$id);
                                  }
                                }}
                              />
                              {matchPartyCodes[match.$id] !== undefined &&
                                matchPartyCodes[match.$id] !==
                                  match.valoPartyCode && (
                                  <button
                                    onClick={() =>
                                      actions.handleSavePartyCode(match.$id)
                                    }
                                    disabled={isWorking}
                                    className="animate-in zoom-in absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg duration-200"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                )}
                            </div>
                          </div>
                        )}

                        <div className="mr-4 flex flex-col items-end gap-1">
                          <p className="text-[8px] font-black tracking-tighter text-slate-700 uppercase">
                            Current Status
                          </p>
                          <div
                            className={`text-[10px] font-bold tracking-widest uppercase ${
                              match.status === "completed"
                                ? "text-emerald-500"
                                : match.status === "ongoing"
                                  ? "animate-pulse text-amber-500"
                                  : "text-slate-500"
                            }`}
                          >
                            {match.status}
                          </div>
                        </div>
                        <select
                          value={match.status}
                          onChange={(e) =>
                            handleUpdateMatchStatus(match.$id, e.target.value)
                          }
                          disabled={isWorking}
                          className="cursor-pointer rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-[10px] font-black text-white uppercase shadow-xl transition-colors outline-none hover:bg-slate-900 focus:border-rose-500"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="ongoing">Ongoing (Live)</option>
                          <option value="completed">Completed</option>
                        </select>

                        <button
                          onClick={() => selectMatchForEdit(match)}
                          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-[10px] font-black text-emerald-400 uppercase transition-all hover:bg-emerald-500/20"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit Details
                        </button>

                        {is5v5 &&
                          match.teamA !== "LOBBY" &&
                          match.status !== "completed" &&
                          !match.vetoStarted && (
                            <button
                              onClick={() => handleStartVeto(match.$id)}
                              className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-[10px] font-black text-indigo-400 uppercase transition-all hover:bg-indigo-500/20"
                            >
                              <MapIcon className="h-3.5 w-3.5" />
                              Start Veto
                            </button>
                          )}

                        {!is5v5 &&
                          match.teamA !== "LOBBY" &&
                          match.status !== "completed" &&
                          !match.vetoStarted && (
                            <button
                              onClick={() => handleSkirmishLottery(match.$id)}
                              className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-[10px] font-black text-purple-400 uppercase transition-all hover:bg-purple-500/20"
                            >
                              <MapIcon className="h-3.5 w-3.5" />
                              Map Lottery
                            </button>
                          )}

                        {match.teamA !== "LOBBY" && (
                          <button
                            onClick={() =>
                              handleResetIndividualMatch(match.$id)
                            }
                            disabled={
                              isWorking || matchResetSteps[match.$id] === 2
                            }
                            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase transition-all ${
                              matchResetSteps[match.$id] === 1
                                ? "animate-pulse border border-amber-500/50 bg-amber-500/20 text-amber-400"
                                : matchResetSteps[match.$id] === 2
                                  ? "border border-white/5 bg-slate-900 text-slate-600"
                                  : "border border-white/10 bg-slate-900/50 text-slate-500 hover:border-amber-500/30 hover:text-amber-400"
                            }`}
                            title="Reset this match"
                          >
                            {matchResetSteps[match.$id] === 2 ? (
                              <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                            {matchResetSteps[match.$id] === 1
                              ? "Confirm?"
                              : "Reset"}
                          </button>
                        )}
                      </div>
                    </div>

                    {is5v5 &&
                      match.teamA !== "LOBBY" &&
                      match.status !== "completed" && (
                        <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/5 pt-4">
                          <div className="flex flex-1 items-center gap-4">
                            <div className="flex flex-1 flex-col gap-1">
                              <label className="ml-1 text-[8px] font-black text-slate-500 uppercase">
                                {!match.teamA && match.round === 1
                                  ? "BYE"
                                  : participantMap[match.teamA]?.name ||
                                    "TBD"}{" "}
                                Score
                              </label>
                              <input
                                type="number"
                                placeholder="0"
                                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-xs font-bold text-white transition-all outline-none focus:border-rose-500"
                                value={
                                  matchScores[match.$id]?.scoreA ??
                                  match.scoreA ??
                                  0
                                }
                                onChange={(e) =>
                                  setMatchScores({
                                    ...matchScores,
                                    [match.$id]: {
                                      ...matchScores[match.$id],
                                      scoreA: e.target.value,
                                      scoreB:
                                        matchScores[match.$id]?.scoreB ??
                                        match.scoreB ??
                                        0,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="mt-4 text-xs font-black text-slate-700">
                              VS
                            </div>
                            <div className="flex flex-1 flex-col gap-1">
                              <label className="ml-1 text-[8px] font-black text-slate-500 uppercase">
                                {!match.teamB && match.round === 1
                                  ? "BYE"
                                  : participantMap[match.teamB]?.name ||
                                    "TBD"}{" "}
                                Score
                              </label>
                              <input
                                type="number"
                                placeholder="0"
                                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-xs font-bold text-white transition-all outline-none focus:border-rose-500"
                                value={
                                  matchScores[match.$id]?.scoreB ??
                                  match.scoreB ??
                                  0
                                }
                                onChange={(e) =>
                                  setMatchScores({
                                    ...matchScores,
                                    [match.$id]: {
                                      ...matchScores[match.$id],
                                      scoreB: e.target.value,
                                      scoreA:
                                        matchScores[match.$id]?.scoreA ??
                                        match.scoreA ??
                                        0,
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleSaveMatchScore(match.$id)}
                            disabled={isWorking || !match.teamA || !match.teamB}
                            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-30"
                          >
                            Save Result
                          </button>
                        </div>
                      )}

                    {match.status === "completed" &&
                      match.teamA !== "LOBBY" && (
                        <div className="mt-4 flex items-center justify-center gap-12 border-t border-white/5 pt-4 text-slate-400">
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black uppercase opacity-40">
                              Final Score
                            </span>
                            <span className="text-xl font-black italic">
                              <span
                                className={
                                  match.winner === match.teamA
                                    ? "text-emerald-500"
                                    : ""
                                }
                              >
                                {match.scoreA}
                              </span>
                              <span className="mx-3 opacity-20">-</span>
                              <span
                                className={
                                  match.winner === match.teamB
                                    ? "text-emerald-500"
                                    : ""
                                }
                              >
                                {match.scoreB}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
