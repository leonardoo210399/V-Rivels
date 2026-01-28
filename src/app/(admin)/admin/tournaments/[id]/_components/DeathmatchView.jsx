import { useState } from "react";
import {
  Skull,
  Check,
  X,
  Edit2,
  RotateCcw,
  Loader as LoaderIcon,
  Clock,
  Medal,
} from "lucide-react";
import {
  updateParticipantScore,
  finalizeDeathmatch,
  updateMatchDetails,
} from "@/lib/brackets";
import { updateTournament } from "@/lib/tournaments";
import {
  sendTournamentMessageAction,
  broadcastMatchResultAction,
} from "@/app/actions/discord";

export default function DeathmatchView({
  tournament,
  matches,
  registrations,
  setRegistrations,
  setMatches,
  setTournament, // context updates
  actions, // from useMatchActions
  tournamentActions, // from useTournamentActions
  loadData,
}) {
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bulkEditValues, setBulkEditValues] = useState({});

  const [editingArena, setEditingArena] = useState(false);
  const [arenaForm, setArenaForm] = useState({
    valoPartyCode: "",
    scheduledTime: "",
    notes: "",
    matchFormat: "Auto",
  });

  const { handleUpdateMatchStatus } = actions;

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

  const formatToLocalISO = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const startEditingArena = () => {
    const match = matches[0];
    if (!match) return;

    setArenaForm({
      valoPartyCode: match.valoPartyCode || "",
      scheduledTime: formatToLocalISO(match.scheduledTime || tournament.date),
      notes: match.notes || "",
      matchFormat: match.matchFormat || "Auto",
    });
    setEditingArena(true);
  };

  const handleSaveArenaDetails = async () => {
    const match = matches[0];
    if (!match) return;

    setUpdating(true);
    try {
      const scheduledTimeISO = arenaForm.scheduledTime
        ? new Date(arenaForm.scheduledTime).toISOString()
        : null;

      // Update Match Details (Lobby code, specific time)
      await updateMatchDetails(match.$id, {
        valoPartyCode: arenaForm.valoPartyCode,
        scheduledTime: scheduledTimeISO,
        notes: arenaForm.notes,
        matchFormat: arenaForm.matchFormat,
      });

      // SYNC: Also update the Tournament date so public page reflects it
      if (scheduledTimeISO) {
        await updateTournament(tournament.$id, { date: scheduledTimeISO });
        setTournament((prev) => ({ ...prev, date: scheduledTimeISO }));
      }

      // Send Discord notification if party code changed
      if (
        arenaForm.valoPartyCode &&
        arenaForm.valoPartyCode !== match.valoPartyCode &&
        tournament.discordChannelId
      ) {
        const message = `📢 **DEATHMATCH ARENA READY!**\n\n🔑 **Lobby Code:** \`${arenaForm.valoPartyCode}\`\n\n*All participants, please join the lobby immediately!*`;
        try {
          await sendTournamentMessageAction(
            tournament.discordChannelId,
            message,
            tournament.discordRoleId,
          );
        } catch (discordErr) {
          console.warn("Discord notification failed in DM view:", discordErr);
        }
      }

      // Update local state by reloading
      await loadData();
      setEditingArena(false);
    } catch (e) {
      alert("Failed to save arena details: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const parseMetadata = (metadata) => {
    try {
      return typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    } catch (e) {
      return null;
    }
  };

  const startBulkEdit = () => {
    const initialValues = {};
    registrations.forEach((reg) => {
      const meta = parseMetadata(reg.metadata);
      initialValues[reg.$id] = {
        kills: meta?.kills || 0,
        deaths: meta?.deaths || 0,
      };
    });
    setBulkEditValues(initialValues);
    setEditing(true);
  };

  const handleBulkUpdateScores = async () => {
    setUpdating(true);
    try {
      await Promise.all(
        Object.entries(bulkEditValues).map(([regId, values]) =>
          updateParticipantScore(regId, values.kills, values.deaths),
        ),
      );

      // Identify winner, runner-up
      const entries = Object.entries(bulkEditValues);
      if (entries.length >= 1) {
        const sortedEntries = entries.sort((a, b) => b[1].kills - a[1].kills);
        const winnerId = sortedEntries[0][0];
        const runnerUpId = sortedEntries[1] ? sortedEntries[1][0] : null;

        try {
          await finalizeDeathmatch(tournament.$id, winnerId, runnerUpId);

          if (tournament.discordChannelId) {
            const winnerReg = registrations.find((r) => r.$id === winnerId);
            const winnerMeta = winnerReg
              ? parseMetadata(winnerReg.metadata)
              : {};
            const winnerName =
              winnerMeta?.playerName || winnerReg?.teamName || "Winner";
            const winnerKills = sortedEntries[0][1].kills;
            const winnerDeaths = sortedEntries[0][1].deaths;

            let message = `🏆 **DEATHMATCH RESULT**\n\n**Winner:** ${winnerName} 👑\n**Stats:** ${winnerKills} Kills / ${winnerDeaths} Deaths`;

            if (runnerUpId) {
              const runnerReg = registrations.find((r) => r.$id === runnerUpId);
              const runnerMeta = runnerReg
                ? parseMetadata(runnerReg.metadata)
                : {};
              const runnerName =
                runnerMeta?.playerName || runnerReg?.teamName || "Runner Up";

              const runnerKills = sortedEntries[1]?.[1]?.kills || 0;
              const runnerDeaths = sortedEntries[1]?.[1]?.deaths || 0;

              message += `\n**Runner Up:** ${runnerName} 🥈\n**Stats:** ${runnerKills} Kills / ${runnerDeaths} Deaths`;
            }

            const origin = window.location.origin;
            const tournamentLink = `${origin}/tournaments/${tournament.$id}`;
            message += `\n\n🔗 **View Full Leaderboard:** [Click Here](${tournamentLink})`;

            try {
              // Construct Public Message with extra context
              const publicMessage = `🏆 **DEATHMATCH RESULT**\n**[${tournament.name}](${tournamentLink})**\n\n**Winner:** ${winnerName} 👑\n**Stats:** ${winnerKills} Kills / ${winnerDeaths} Deaths${runnerUpId ? `\n**Runner Up:** ${runnerName} 🥈` : ""}\n\n🔗 **View Full Leaderboard:** [Click Here](${tournamentLink})`;

              await broadcastMatchResultAction(
                tournament.discordChannelId,
                message,
                tournament.discordRoleId,
                publicMessage,
              );
            } catch (discordErr) {
              console.warn(
                "Discord notification failed for DM result:",
                discordErr,
              );
            }
          }
        } catch (err) {
          console.error(
            "Failed to update leaderboard stats for DM winner",
            err,
          );
        }
      }

      // Automatically mark as completed if needed
      if (matches.length > 0) {
        // We iterate through matches but usually DM only has 1 match (LOBBY) or implicit
        await Promise.all(
          matches.map((m) => handleUpdateMatchStatus(m.$id, "completed")),
        );
      }

      await loadData(); // Reload all data to be safe

      setEditing(false);
      setBulkEditValues({});
      alert("Scores saved and tournament marked as completed!");
    } catch (e) {
      alert("Failed to update scores: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const isWorking = updating || tournamentUpdating;

  return (
    <div className="space-y-6">
      {/* Arena Hub Header */}
      <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent p-8 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 shadow-lg shadow-rose-900/20">
              <Skull className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-white uppercase">
                Deathmatch Arena
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Free-for-all elimination • {registrations.length} Players
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {matches.length > 0 && (
              <>
                {editing ? (
                  <>
                    <button
                      onClick={handleBulkUpdateScores}
                      disabled={isWorking}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[10px] font-black text-white uppercase shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700"
                    >
                      {isWorking ? (
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Save All
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-5 py-3 text-[10px] font-black text-slate-400 uppercase transition-all hover:bg-slate-800"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startBulkEdit}
                    disabled={isWorking || editingArena}
                    className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-[10px] font-black text-white uppercase shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-700"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Scores
                  </button>
                )}
                <button
                  onClick={handleResetBracket}
                  disabled={isWorking || resetStep === 2 || editingArena}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[10px] font-black uppercase transition-all ${
                    resetStep === 1
                      ? "animate-pulse bg-amber-500 text-slate-950"
                      : resetStep === 2
                        ? "bg-slate-900 text-slate-600"
                        : "border border-white/5 bg-slate-950 text-slate-500 hover:text-rose-500"
                  }`}
                >
                  {resetStep === 2 ? (
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  {resetStep === 1 ? "Confirm?" : "Reset"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Arena Status & Details (Always visible or in edit mode) */}
        {matches.length > 0 && matches[0] && (
          <div className="mt-8 border-t border-white/5 pt-8">
            {editingArena ? (
              <div className="animate-in fade-in slide-in-from-top-4 grid grid-cols-1 gap-6 duration-300 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="ml-1 text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    Valorant Party Code
                  </label>
                  <input
                    type="text"
                    value={arenaForm.valoPartyCode}
                    onChange={(e) =>
                      setArenaForm({
                        ...arenaForm,
                        valoPartyCode: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-rose-500"
                    placeholder="Enter code..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="ml-1 text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    Match Format
                  </label>
                  <select
                    value={arenaForm.matchFormat}
                    onChange={(e) =>
                      setArenaForm({
                        ...arenaForm,
                        matchFormat: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-rose-500"
                  >
                    <option value="Auto">Auto (Default)</option>
                    <option value="BO1">Best of 1</option>
                    <option value="BO3">Best of 3</option>
                    <option value="BO5">Best of 5</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="ml-1 text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    Scheduled Start
                  </label>
                  <input
                    type="datetime-local"
                    value={arenaForm.scheduledTime}
                    onChange={(e) =>
                      setArenaForm({
                        ...arenaForm,
                        scheduledTime: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white [color-scheme:dark] outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <label className="ml-1 text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    Actions
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveArenaDetails}
                      disabled={updating}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-[10px] font-black text-white uppercase hover:bg-emerald-700"
                    >
                      {updating ? (
                        <LoaderIcon className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={() => setEditingArena(false)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-[10px] font-black text-slate-400 uppercase hover:bg-slate-700"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                  </div>
                </div>
                <div className="space-y-2 lg:col-span-4">
                  <label className="ml-1 text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    Admin Private Notes
                  </label>
                  <textarea
                    value={arenaForm.notes}
                    onChange={(e) =>
                      setArenaForm({ ...arenaForm, notes: e.target.value })
                    }
                    className="min-h-[80px] w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-rose-500"
                    placeholder="Add internal notes for match admins..."
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-3 w-3 rounded-full ${
                      matches[0].status === "ongoing"
                        ? "animate-pulse bg-emerald-500"
                        : matches[0].status === "completed"
                          ? "bg-slate-600"
                          : "bg-amber-500"
                    }`}
                  />
                  <span className="text-xs font-black text-slate-400 uppercase">
                    {matches[0].status === "ongoing"
                      ? "Live Now"
                      : matches[0].status === "completed"
                        ? "Finished"
                        : "Scheduled"}
                  </span>
                  <select
                    value={matches[0].status}
                    onChange={(e) =>
                      handleUpdateMatchStatus(matches[0].$id, e.target.value)
                    }
                    disabled={isWorking}
                    className="ml-2 cursor-pointer rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-[10px] font-black text-white uppercase outline-none hover:bg-slate-900"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="hidden h-6 w-px bg-white/10 md:block" />

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
                    Party Code:
                  </span>
                  <span className="font-mono text-sm font-black tracking-widest text-rose-500">
                    {matches[0].valoPartyCode || "—"}
                  </span>
                  <button
                    onClick={startEditingArena}
                    className="ml-2 flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[9px] font-black text-rose-400 uppercase transition-all hover:bg-rose-500/20"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit Arena
                  </button>
                </div>

                <div className="hidden h-6 w-px bg-white/10 md:block" />

                <div
                  className="flex items-center gap-2"
                  suppressHydrationWarning
                >
                  <Clock className="h-4 w-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-400">
                    {matches[0].scheduledTime
                      ? new Date(matches[0].scheduledTime).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : new Date(tournament.date).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                  </span>
                </div>

                {matches[0].notes && (
                  <>
                    <div className="hidden h-6 w-px bg-white/10 lg:block" />
                    <div
                      className="flex max-w-xs items-center gap-2 truncate"
                      title={matches[0].notes}
                    >
                      <span className="text-[10px] font-black text-slate-600 uppercase">
                        Notes:
                      </span>
                      <span className="truncate text-[11px] text-slate-500 italic">
                        {matches[0].notes}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Player Leaderboard / Start Section */}
      {matches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/5 bg-slate-950/30 py-16 text-center">
          <div className="mx-auto mb-6 w-fit rounded-full border border-white/5 bg-slate-900 p-6">
            <Skull className="h-10 w-10 text-slate-700" />
          </div>
          <h3 className="mb-2 text-xl font-bold tracking-tight text-white uppercase">
            Ready to Start the Arena
          </h3>
          <p className="mx-auto mb-8 max-w-sm text-sm text-slate-500">
            Set up the party code and start the deathmatch standings.
          </p>
          <div className="mx-auto mb-8 max-w-xs space-y-2">
            <label className="ml-1 text-[9px] font-black tracking-widest text-slate-500 uppercase">
              Initial Party Code
            </label>
            <input
              type="text"
              value={dmPartyCode}
              onChange={(e) => setDmPartyCode(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-center font-mono text-sm font-bold text-white transition-all outline-none focus:border-rose-500"
              placeholder="e.g. JOIN-ME-123"
            />
          </div>
          <button
            onClick={handleStartTournament}
            disabled={isWorking || registrations.length < 2 || startStep === 2}
            className={`mx-auto flex items-center gap-3 rounded-2xl px-8 py-4 text-xs font-black tracking-[0.2em] uppercase shadow-xl transition-all ${
              startStep === 1
                ? "animate-pulse bg-amber-500 text-slate-950"
                : startStep === 2
                  ? "bg-slate-900 text-slate-600"
                  : "bg-rose-600 text-white shadow-rose-900/20 hover:bg-rose-700"
            } disabled:opacity-30`}
          >
            {startStep === 2 ? (
              <LoaderIcon className="h-4 w-4 animate-spin" />
            ) : (
              <Skull className="h-4 w-4" />
            )}
            {startStep === 0 && "Start Deathmatch"}
            {startStep === 1 && "Click to Confirm"}
          </button>
          {startError && (
            <p className="mt-4 text-[10px] font-bold tracking-widest text-rose-500 uppercase">
              {startError}
            </p>
          )}
          {registrations.length < 2 && (
            <p className="mt-4 text-[10px] font-bold tracking-widest text-rose-500 uppercase">
              Need at least 2 players to start
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/5 bg-slate-950/30 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Medal className="h-5 w-5 text-amber-500" />
              <h4 className="text-sm font-black tracking-widest text-white uppercase">
                Player Standings
              </h4>
            </div>
            <p className="text-[10px] font-bold text-slate-600">
              Ranked by K/D Ratio
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/5">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/50">
                  <th className="px-4 py-3 text-left text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    Player
                  </th>
                  <th className="px-4 py-3 text-center text-[9px] font-black tracking-widest text-emerald-500/70 uppercase">
                    Kills
                  </th>
                  <th className="px-4 py-3 text-center text-[9px] font-black tracking-widest text-rose-500/70 uppercase">
                    Deaths
                  </th>
                  <th className="px-4 py-3 text-center text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    K/D
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...registrations]
                  .map((reg) => {
                    const meta = parseMetadata(reg.metadata);
                    const kills = editing
                      ? (bulkEditValues[reg.$id]?.kills ?? meta?.kills ?? 0)
                      : (meta?.kills ?? 0);
                    const deaths = editing
                      ? (bulkEditValues[reg.$id]?.deaths ?? meta?.deaths ?? 0)
                      : (meta?.deaths ?? 0);
                    const kd =
                      deaths === 0 ? kills : (kills / deaths).toFixed(2);
                    return {
                      reg,
                      meta,
                      kills,
                      deaths,
                      kd: parseFloat(kd) || 0,
                      playerName: meta?.playerName || reg.teamName,
                    };
                  })
                  .sort((a, b) => b.kd - a.kd || b.kills - a.kills)
                  .map((player, idx) => (
                    <tr
                      key={player.reg.$id}
                      className={`border-b border-white/5 transition-colors ${
                        idx === 0
                          ? "bg-amber-500/5"
                          : idx === 1
                            ? "bg-slate-500/5"
                            : idx === 2
                              ? "bg-orange-500/5"
                              : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${
                            idx === 0
                              ? "bg-amber-500/20 text-amber-500"
                              : idx === 1
                                ? "bg-slate-400/20 text-slate-400"
                                : idx === 2
                                  ? "bg-orange-600/20 text-orange-500"
                                  : "bg-slate-900 text-slate-600"
                          }`}
                        >
                          {idx + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-white">
                          {player.playerName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editing ? (
                          <input
                            type="number"
                            className="w-16 rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-center text-sm font-bold text-emerald-400 outline-none focus:border-emerald-500"
                            value={
                              bulkEditValues[player.reg.$id]?.kills ??
                              player.kills
                            }
                            onChange={(e) =>
                              setBulkEditValues({
                                ...bulkEditValues,
                                [player.reg.$id]: {
                                  ...bulkEditValues[player.reg.$id],
                                  kills: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        ) : (
                          <span className="text-sm font-black text-emerald-400">
                            {player.kills}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editing ? (
                          <input
                            type="number"
                            className="w-16 rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-center text-sm font-bold text-rose-400 outline-none focus:border-rose-500"
                            value={
                              bulkEditValues[player.reg.$id]?.deaths ??
                              player.deaths
                            }
                            onChange={(e) =>
                              setBulkEditValues({
                                ...bulkEditValues,
                                [player.reg.$id]: {
                                  ...bulkEditValues[player.reg.$id],
                                  deaths: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        ) : (
                          <span className="text-sm font-black text-rose-400">
                            {player.deaths}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-sm font-black ${player.kd >= 1 ? "text-emerald-500" : "text-slate-500"}`}
                        >
                          {player.kd.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
