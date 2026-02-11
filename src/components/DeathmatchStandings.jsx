import React, { useState } from "react";
import {
  Trophy,
  Users,
  Shield,
  Target,
  Medal,
  Edit2,
  Check,
  X,
  Clock,
} from "lucide-react";
import { updateParticipantScore } from "@/lib/brackets";

export default function DeathmatchStandings({
  registrations,
  tournament,
  isAdmin,
  matches = [],
}) {
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ kills: 0, deaths: 0 });
  const [updating, setUpdating] = useState(false);

  // Find the DM Lobby match status
  const lobbyMatch = matches.find((m) => m.teamA === "LOBBY");
  const isCompleted = lobbyMatch?.status === "completed";

  const handleUpdate = async (regId) => {
    setUpdating(true);
    try {
      await updateParticipantScore(regId, editValues.kills, editValues.deaths);
      setEditingId(null);
      window.location.reload(); // Refresh to show new standings
    } catch (e) {
      alert("Failed to update score: " + e.message);
    } finally {
      setUpdating(false);
    }
  };
  // Sort registrations by score if available (stored in metadata or a score field)
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

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-bold text-white">
            <Trophy className="h-5 w-5 text-rose-500" />
            Live Standings
          </h3>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-xs font-black tracking-widest text-slate-500 uppercase">
              Official Leaderboard
            </p>
            {lobbyMatch && (
              <span
                className={`rounded border px-2 py-0.5 text-[10px] font-black uppercase ${
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950 px-4 py-2">
            <Users className="h-4 w-4 text-rose-500" />
            <span className="text-xs font-bold text-white uppercase">
              {registrations.length} Players
            </span>
          </div>
          {(lobbyMatch?.scheduledTime || tournament?.date) && (
            <div
              className="flex items-center gap-2 self-end rounded-xl border border-white/5 bg-slate-950 px-4 py-2"
              suppressHydrationWarning
            >
              <Clock className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">
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

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/50 backdrop-blur-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-slate-950/80 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
              <th className="w-12 px-4 py-4 text-center">#</th>
              <th className="px-4 py-4">Player</th>
              <th className="w-20 px-4 py-4 text-center">Kills</th>
              <th className="w-20 px-4 py-4 text-center">Deaths</th>
              <th className="px-4 py-4 text-right">Status</th>
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
                  className={`group transition-colors hover:bg-white/[0.02] ${index === 0 ? "bg-rose-500/[0.02]" : ""}`}
                >
                  <td className="px-4 py-4">
                    <div
                      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black italic shadow-lg ${
                        index === 0
                          ? "bg-rose-500 text-white shadow-rose-500/20"
                          : index === 1
                            ? "bg-slate-400 text-slate-950"
                            : index === 2
                              ? "bg-amber-700 text-white"
                              : "border border-white/5 bg-slate-900 text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-slate-950 transition-all group-hover:border-rose-500/20">
                        {metadata.playerCard ? (
                          <img
                            src={`https://media.valorant-api.com/playercards/${metadata.playerCard}/displayicon.png`}
                            alt="Card"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <Target
                            className={`h-3.5 w-3.5 ${isTop3 ? "text-rose-500" : "text-slate-600"}`}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold tracking-tight text-white uppercase transition-colors group-hover:text-rose-500">
                          {metadata.playerName ||
                            reg.teamName ||
                            "Anonymous Player"}
                        </p>
                        <p className="text-[9px] font-black tracking-widest whitespace-nowrap text-slate-600 uppercase">
                          {reg.checkedIn ? (
                            <span className="text-emerald-500">Checked In</span>
                          ) : (
                            "Awaiting"
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {editingId === reg.$id && !isCompleted ? (
                      <input
                        type="number"
                        className="w-12 rounded border border-white/10 bg-slate-900 px-1.5 py-1 text-center text-sm text-white outline-none focus:border-rose-500"
                        value={editValues.kills}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            kills: parseInt(e.target.value) || 0,
                          })
                        }
                        autoFocus
                      />
                    ) : (
                      <span className="text-base font-black text-white italic">
                        {metadata.kills || 0}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center font-mono text-xs text-slate-600">
                    {editingId === reg.$id && !isCompleted ? (
                      <input
                        type="number"
                        className="w-12 rounded border border-white/10 bg-slate-900 px-1.5 py-1 text-center text-sm text-white outline-none focus:border-rose-500"
                        value={editValues.deaths}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            deaths: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    ) : (
                      metadata.deaths || 0
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isAdmin &&
                        !isCompleted &&
                        (editingId === reg.$id ? (
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              onClick={() => handleUpdate(reg.$id)}
                              disabled={updating}
                              className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-500 transition-all hover:bg-emerald-500 hover:text-white"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-lg bg-rose-500/10 p-1.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(reg.$id);
                              setEditValues({
                                kills: metadata.kills || 0,
                                deaths: metadata.deaths || 0,
                              });
                            }}
                            className="shrink-0 rounded-lg border border-white/5 bg-slate-900 p-1.5 text-slate-500 transition-all group-hover:opacity-100 hover:border-white/20 hover:text-white sm:opacity-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        ))}

                      <div className="h-6 shrink-0">
                        {index === 0 && isCompleted ? (
                          <div className="inline-flex items-center gap-1 rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-black tracking-widest whitespace-nowrap text-rose-500 uppercase">
                            <Medal className="h-2.5 w-2.5" /> Winner
                          </div>
                        ) : index === 1 && isCompleted ? (
                          <span className="text-[9px] font-black tracking-widest whitespace-nowrap text-emerald-500 uppercase">
                            Runner Up
                          </span>
                        ) : (
                          <span className="text-[9px] font-black tracking-widest whitespace-nowrap text-slate-600 uppercase">
                            Contender
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {registrations.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 bg-slate-950/30 py-16 text-center">
          <Users className="mb-4 h-12 w-12 text-slate-800" />
          <h3 className="font-bold text-white">No Players Yet</h3>
          <p className="text-sm text-slate-500">
            Standings will appear once players join.
          </p>
        </div>
      )}
    </div>
  );
}
