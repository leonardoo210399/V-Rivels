import { useState, useEffect } from "react";
import {
  Settings,
  Trash2,
  Save,
  AlertCircle,
  Loader as LoaderIcon,
  Info,
  Users,
  ExternalLink,
} from "lucide-react";
import { sendTournamentMessageAction } from "@/app/actions/discord";
import { updateTournament } from "@/lib/tournaments";

export default function SettingsTab({
  tournament,
  setTournament, // to update local state after check-in alert
  onSaveSettings,
  onDelete,
  onDiscordDelete,
  deleteStep,
  deleteError,
  discordDeleteStep,
  discordDeleteError,
  updating,
}) {
  const [localUpdating, setLocalUpdating] = useState(false);

  const formatToLocalISO = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const [editForm, setEditForm] = useState({
    name: "",
    gameType: "5v5",
    prizePool: "",
    maxTeams: 8,
    location: "Online",
    date: "",
    firstPrize: "",
    secondPrize: "",
    additionalPrizes: [],
    description: "",
    entryFee: "",
    status: "scheduled",
    discordChannelId: "",
    discordVoiceChannelId: "",
    discordRoleId: "",
    discordInviteUrl: "",
    checkInEnabled: false,
    checkInStart: "",
  });

  useEffect(() => {
    if (tournament) {
      setEditForm({
        name: tournament.name || "",
        gameType: tournament.gameType || "5v5",
        prizePool: tournament.prizePool || "",
        maxTeams: tournament.maxTeams || 8,
        location: tournament.location || "Online",
        date: formatToLocalISO(tournament.date),
        firstPrize: tournament.firstPrize || "",
        secondPrize: tournament.secondPrize || "",
        additionalPrizes: tournament.additionalPrizes
          ? typeof tournament.additionalPrizes === "string"
            ? JSON.parse(tournament.additionalPrizes)
            : tournament.additionalPrizes
          : [],
        description: tournament.description || "",
        entryFee: tournament.entryFee || "",
        status: tournament.status || "scheduled",
        discordChannelId: tournament.discordChannelId || "",
        discordVoiceChannelId: tournament.discordVoiceChannelId || "",
        discordRoleId: tournament.discordRoleId || "",
        discordInviteUrl: tournament.discordInviteUrl || "",
        checkInEnabled: tournament.checkInEnabled || false,
        checkInStart: formatToLocalISO(tournament.checkInStart),
      });
    }
  }, [tournament]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(editForm);
  };

  const handleSendCheckInAlert = async () => {
    if (!tournament.discordChannelId) {
      alert("No Discord channel linked to this tournament.");
      return;
    }

    if (
      !confirm(
        "Send Check-in live alert to Discord? This will ping everyone with the tournament role.",
      )
    )
      return;

    try {
      setLocalUpdating(true);
      await sendTournamentMessageAction(
        tournament.discordChannelId,
        `🚨 **CHECK-IN IS NOW LIVE!**\nRegistered players for **${tournament.name}** can now check-in on the website.\n\n🔗 **Check-in Here:** <${window.location.origin}/tournaments/${tournament.$id}>\n\n*Note: Failure to check-in may result in disqualification!*`,
        tournament.discordRoleId,
      );

      // Update DB so automation doesn't send it again
      await updateTournament(tournament.$id, { checkInAlertSent: true });
      setTournament((prev) => ({ ...prev, checkInAlertSent: true }));

      alert("Check-in alert sent successfully!");
    } catch (err) {
      alert("Failed to send alert: " + (err.message || "Unknown error"));
    } finally {
      setLocalUpdating(false);
    }
  };

  const isWorking = updating || localUpdating;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Edit Form */}
      <div className="rounded-3xl border border-white/5 bg-slate-950/30 p-8 backdrop-blur-sm lg:col-span-2">
        <div className="mb-8 flex items-center gap-3 border-b border-white/5 pb-8">
          <div className="rounded-xl bg-slate-900 p-3 text-slate-500">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white uppercase">
              Tournament Settings
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Update general information and configuration
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Tournament Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all outline-none focus:border-rose-500"
              />
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={editForm.date}
                onChange={(e) =>
                  setEditForm({ ...editForm, date: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white [color-scheme:dark] transition-all outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Game Type
              </label>
              <select
                value={editForm.gameType}
                onChange={(e) =>
                  setEditForm({ ...editForm, gameType: e.target.value })
                }
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm font-bold text-slate-500 outline-none"
              >
                <option value="5v5">5v5 Tournament</option>
                <option value="Deathmatch">Deathmatch (FFA)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Max {editForm.gameType === "5v5" ? "Teams" : "Players"}
              </label>
              <input
                type="number"
                value={editForm.maxTeams}
                onChange={(e) =>
                  setEditForm({ ...editForm, maxTeams: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Prize Pool Display
              </label>
              <input
                type="text"
                value={editForm.prizePool}
                onChange={(e) =>
                  setEditForm({ ...editForm, prizePool: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Entry Fee
              </label>
              <input
                type="text"
                value={editForm.entryFee}
                onChange={(e) =>
                  setEditForm({ ...editForm, entryFee: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Location
              </label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
              Description / Rules
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all outline-none focus:border-rose-500"
            />
          </div>

          <div className="border-t border-white/5 pt-8">
            <h4 className="mb-4 text-xs font-black tracking-widest text-rose-500 uppercase">
              Discord Configuration
            </h4>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Channel ID
                </label>
                <input
                  type="text"
                  value={editForm.discordChannelId}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      discordChannelId: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 font-mono text-sm font-bold text-white transition-all outline-none focus:border-rose-500"
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Role ID
                </label>
                <input
                  type="text"
                  value={editForm.discordRoleId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, discordRoleId: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 font-mono text-sm font-bold text-white transition-all outline-none focus:border-rose-500"
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Voice Channel ID
                </label>
                <input
                  type="text"
                  value={editForm.discordVoiceChannelId}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      discordVoiceChannelId: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 font-mono text-sm font-bold text-white transition-all outline-none focus:border-rose-500"
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Invite URL
                </label>
                <input
                  type="text"
                  value={editForm.discordInviteUrl}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      discordInviteUrl: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Manual Discord Delete */}
            <div className="mt-6 flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/30 p-4">
              <div>
                <h5 className="text-xs font-bold text-white">
                  Manage Discord Channels
                </h5>
                <p className="text-[10px] text-slate-500">
                  Manually delete linked channels if auto-delete failed
                </p>
              </div>
              <button
                type="button"
                onClick={onDiscordDelete}
                disabled={isWorking}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-[10px] font-black text-rose-500 uppercase hover:bg-rose-500/10"
              >
                {discordDeleteStep === 2 ? (
                  <LoaderIcon className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                {discordDeleteStep === 0 ? "Purge Channels" : "Confirm Purge?"}
              </button>
            </div>
            {discordDeleteError && (
              <p className="mt-2 text-[10px] text-rose-500">
                {discordDeleteError}
              </p>
            )}
          </div>

          <div className="border-t border-white/5 pt-8">
            <h4 className="mb-4 text-xs font-black tracking-widest text-emerald-500 uppercase">
              Check-In System
            </h4>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Enable Check-In?
                </label>
                <select
                  value={editForm.checkInEnabled}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      checkInEnabled: e.target.value === "true",
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500"
                >
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Check-In Start Time
                </label>
                <input
                  type="datetime-local"
                  value={editForm.checkInStart}
                  onChange={(e) =>
                    setEditForm({ ...editForm, checkInStart: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white [color-scheme:dark] transition-all outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendCheckInAlert}
              disabled={isWorking || !tournament.discordChannelId}
              className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-[10px] font-black text-white uppercase shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {tournament.checkInAlertSent
                ? "Re-send Alert"
                : "Send Live Alert"}
            </button>
          </div>

          <div className="flex items-center gap-4 border-t border-white/5 pt-8">
            <button
              type="submit"
              disabled={isWorking}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 disabled:opacity-50"
            >
              {isWorking ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isWorking}
              className={`flex h-14 w-14 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 transition-all ${
                deleteStep === 1
                  ? "animate-pulse border-rose-500 bg-rose-500 text-white"
                  : "hover:bg-rose-500 hover:text-white"
              }`}
            >
              {deleteStep === 2 ? (
                <LoaderIcon className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>
          </div>
          {deleteError && (
            <p className="text-center text-xs font-bold text-rose-500 uppercase">
              {deleteError}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
