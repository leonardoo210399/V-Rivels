"use client";
import React from "react";
import {
  X,
  Trophy,
  Target,
  Shield,
  Zap,
  Globe,
  Clock,
  MapPin,
} from "lucide-react";
import { rankIcons } from "@/assets/images/ranks";
import { agentIcons } from "@/assets/images/agents";

export default function MatchDetailsModal({ match, isOpen, onClose, puuid }) {
  if (!isOpen || !match) return null;

  const metadata = match.metadata || {};
  const players = match.players || {};
  const teams = match.teams || {};
  const allPlayers = players.all_players || [];

  // Sort players by score/combat effectiveness (usually ACS or score)
  const sortedPlayers = [...allPlayers].sort(
    (a, b) => (b.stats?.score || 0) - (a.stats?.score || 0),
  );

  const formatTeamName = (team) => team.charAt(0).toUpperCase() + team.slice(1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content - Full screen on mobile */}
      <div className="relative flex h-full w-full flex-col overflow-hidden border-0 border-white/10 bg-slate-900 shadow-2xl md:h-auto md:max-h-[90vh] md:max-w-5xl md:rounded-2xl md:border">
        {/* Header - Responsive */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/50 p-4 md:p-6">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <div className="text-left">
              <h2 className="text-xl font-bold tracking-tighter text-white uppercase md:text-2xl">
                {metadata.map}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 md:text-sm">
                <span className="uppercase">{metadata.mode}</span>
                <span>•</span>
                <span>
                  {new Date(metadata.game_start * 1000).toLocaleString(
                    undefined,
                    {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    },
                  )}
                </span>
              </div>
            </div>

            <div className="flex w-fit items-center gap-4 rounded-xl border border-white/5 bg-slate-950/50 px-4 py-2 md:px-6">
              <div className="text-center">
                <p className="mb-1 text-[10px] leading-none font-bold tracking-widest text-slate-500 uppercase">
                  Red
                </p>
                <p
                  className={`font-anton text-xl md:text-2xl ${teams.red?.has_won ? "text-rose-500" : "text-white"}`}
                >
                  {teams.red?.rounds_won || 0}
                </p>
              </div>
              <div className="text-xl font-bold text-slate-700">:</div>
              <div className="text-center">
                <p className="mb-1 text-[10px] leading-none font-bold tracking-widest text-slate-500 uppercase">
                  Blue
                </p>
                <p
                  className={`font-anton text-xl md:text-2xl ${teams.blue?.has_won ? "text-rose-500" : "text-white"}`}
                >
                  {teams.blue?.rounds_won || 0}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white md:relative md:top-auto md:right-auto"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-4 md:space-y-8 md:p-6">
          {/* Scoreboard */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-bold tracking-widest text-slate-500 uppercase">
              <Trophy className="h-4 w-4 text-rose-500" />
              Scoreboard
            </h3>

            {/* Desktop Table - Hidden on Mobile */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] tracking-wider text-slate-500 uppercase">
                    <th className="pb-3 font-bold">Player</th>
                    <th className="pb-3 text-center font-bold">Rank</th>
                    <th className="pb-3 text-center font-bold">ACS</th>
                    <th className="pb-3 text-center font-bold">K</th>
                    <th className="pb-3 text-center font-bold">D</th>
                    <th className="pb-3 text-center font-bold">A</th>
                    <th className="pb-3 text-center font-bold">K/D</th>
                    <th className="pb-3 text-center font-bold">HS%</th>
                    <th className="pb-3 text-center font-bold">ADR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedPlayers.map((player) => {
                    const isMe = player.puuid === puuid;
                    const stats = player.stats || {};
                    const kd = (
                      (stats.kills || 0) / Math.max(1, stats.deaths || 0)
                    ).toFixed(1);
                    const hs = (
                      ((stats.headshots || 0) /
                        Math.max(
                          1,
                          (stats.headshots || 0) +
                            (stats.bodyshots || 0) +
                            (stats.legshots || 0),
                        )) *
                      100
                    ).toFixed(0);
                    const roundsPlayed = metadata.rounds_played || 1;
                    const adr = (
                      (player.stats.damage?.made || 0) / roundsPlayed
                    ).toFixed(0);
                    const acs = (
                      (player.stats.score || 0) / roundsPlayed
                    ).toFixed(0);

                    return (
                      <tr
                        key={player.puuid}
                        className={`group transition-colors hover:bg-white/5 ${isMe ? "bg-rose-500/5" : ""}`}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={
                                  typeof agentIcons[player.character] ===
                                  "object"
                                    ? agentIcons[player.character]?.src
                                    : agentIcons[player.character] ||
                                      player.assets.agent.small
                                }
                                alt={player.character}
                                className={`h-10 w-10 rounded border-l-2 bg-slate-800 ${player.team === "Red" ? "border-rose-500" : "border-blue-500"}`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-white">
                                  {player.name}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  #{player.tag}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 uppercase">
                                {player.character}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center">
                            {player.currenttier > 2 ? (
                              <img
                                src={
                                  typeof rankIcons[player.currenttier] ===
                                  "object"
                                    ? rankIcons[player.currenttier]?.src
                                    : rankIcons[player.currenttier]
                                }
                                alt={player.currenttier_patched}
                                title={player.currenttier_patched}
                                className="h-10 w-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-slate-800">
                                <span className="text-[10px] font-bold text-slate-500">
                                  UN
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-center font-mono text-sm text-white">
                          {acs}
                        </td>
                        <td className="py-3 text-center font-mono text-sm font-bold text-white">
                          {stats.kills || 0}
                        </td>
                        <td className="py-3 text-center font-mono text-sm text-slate-400">
                          {stats.deaths || 0}
                        </td>
                        <td className="py-3 text-center font-mono text-sm text-slate-400">
                          {stats.assists || 0}
                        </td>
                        <td
                          className={`py-3 text-center font-mono text-sm ${kd >= 1.5 ? "text-emerald-400" : kd < 1 ? "text-rose-400" : "text-white"}`}
                        >
                          {kd}
                        </td>
                        <td className="py-3 text-center font-mono text-sm text-slate-400">
                          {hs}%
                        </td>
                        <td className="py-3 text-center font-mono text-sm text-slate-400">
                          {adr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout - Visible on Mobile Only */}
            <div className="space-y-2 md:hidden">
              {sortedPlayers.map((player) => {
                const isMe = player.puuid === puuid;
                const stats = player.stats || {};
                const kd = (
                  (stats.kills || 0) / Math.max(1, stats.deaths || 0)
                ).toFixed(2);
                const hs = (
                  ((stats.headshots || 0) /
                    Math.max(
                      1,
                      (stats.headshots || 0) +
                        (stats.bodyshots || 0) +
                        (stats.legshots || 0),
                    )) *
                  100
                ).toFixed(0);
                const roundsPlayed = metadata.rounds_played || 1;
                const adr = (
                  (player.stats.damage?.made || 0) / roundsPlayed
                ).toFixed(0);
                const acs = ((player.stats.score || 0) / roundsPlayed).toFixed(
                  0,
                );

                return (
                  <div
                    key={player.puuid}
                    className={`rounded-xl border border-white/5 p-3 transition-colors ${isMe ? "border-rose-500/20 bg-rose-500/10" : "bg-slate-800/50"}`}
                  >
                    {/* Player Info Row */}
                    <div className="mb-3 flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={
                            typeof agentIcons[player.character] === "object"
                              ? agentIcons[player.character]?.src
                              : agentIcons[player.character] ||
                                player.assets.agent.small
                          }
                          alt={player.character}
                          className={`h-12 w-12 rounded-lg border-l-2 bg-slate-800 ${player.team === "Red" ? "border-rose-500" : "border-blue-500"}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-bold text-white">
                            {player.name}
                          </span>
                          <span className="shrink-0 text-[10px] text-slate-500">
                            #{player.tag}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase">
                          {player.character}
                        </span>
                      </div>
                      {/* Rank Icon */}
                      <div className="shrink-0">
                        {player.currenttier > 2 ? (
                          <img
                            src={
                              typeof rankIcons[player.currenttier] === "object"
                                ? rankIcons[player.currenttier]?.src
                                : rankIcons[player.currenttier]
                            }
                            alt={player.currenttier_patched}
                            title={player.currenttier_patched}
                            className="h-8 w-8 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/5 bg-slate-800">
                            <span className="text-[8px] font-bold text-slate-500">
                              UN
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-5 gap-1 text-center">
                      <div className="rounded-lg bg-slate-900/50 px-1 py-1.5">
                        <p className="mb-0.5 text-[8px] font-bold text-slate-500 uppercase">
                          ACS
                        </p>
                        <p className="font-mono text-sm font-bold text-white">
                          {acs}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-900/50 px-1 py-1.5">
                        <p className="mb-0.5 text-[8px] font-bold text-slate-500 uppercase">
                          K/D/A
                        </p>
                        <p className="font-mono text-xs font-bold text-white">
                          <span className="text-emerald-400">
                            {stats.kills || 0}
                          </span>
                          <span className="text-slate-600">/</span>
                          <span className="text-rose-400">
                            {stats.deaths || 0}
                          </span>
                          <span className="text-slate-600">/</span>
                          <span className="text-slate-400">
                            {stats.assists || 0}
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-900/50 px-1 py-1.5">
                        <p className="mb-0.5 text-[8px] font-bold text-slate-500 uppercase">
                          K/D
                        </p>
                        <p
                          className={`font-mono text-sm font-bold ${parseFloat(kd) >= 1.5 ? "text-emerald-400" : parseFloat(kd) < 1 ? "text-rose-400" : "text-white"}`}
                        >
                          {kd}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-900/50 px-1 py-1.5">
                        <p className="mb-0.5 text-[8px] font-bold text-slate-500 uppercase">
                          HS%
                        </p>
                        <p className="font-mono text-sm font-bold text-white">
                          {hs}%
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-900/50 px-1 py-1.5">
                        <p className="mb-0.5 text-[8px] font-bold text-slate-500 uppercase">
                          ADR
                        </p>
                        <p className="font-mono text-sm font-bold text-white">
                          {adr}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Redesigned Game Stats Section */}
          <div className="grid gap-6">
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/40 p-1">
              {/* Background ambient glow */}
              <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-rose-500/5 blur-[80px]" />

              <div className="relative z-10 grid grid-cols-1 gap-1 md:grid-cols-3">
                {/* Server info */}
                <div className="flex items-center gap-4 rounded-xl bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 shadow-inner">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                      Server
                    </p>
                    <p className="text-sm font-bold tracking-tight text-white">
                      {metadata.cluster || "Unknown"}
                    </p>
                  </div>
                </div>

                {/* Duration info */}
                <div className="flex items-center gap-4 rounded-xl bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 shadow-inner">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                      Duration
                    </p>
                    <p className="text-sm font-bold tracking-tight text-white">
                      {((metadata.game_length || 0) / 60).toFixed(0)} min
                    </p>
                  </div>
                </div>

                {/* Region info */}
                <div className="flex items-center gap-4 rounded-xl bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shadow-inner">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                      Region
                    </p>
                    <p className="text-sm font-bold tracking-tight text-white uppercase">
                      {metadata.region || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Performance Stats */}
          {(() => {
            const me = sortedPlayers.find((p) => p.puuid === puuid);
            if (!me) return null;

            const stats = me.stats || {};
            const totalShots =
              (stats.headshots || 0) +
              (stats.bodyshots || 0) +
              (stats.legshots || 0);
            const hsPct =
              totalShots > 0
                ? ((stats.headshots / totalShots) * 100).toFixed(0)
                : 0;
            const bsPct =
              totalShots > 0
                ? ((stats.bodyshots / totalShots) * 100).toFixed(0)
                : 0;
            const lsPct =
              totalShots > 0
                ? ((stats.legshots / totalShots) * 100).toFixed(0)
                : 0;

            // Calculate Weapon Kills from match.kills (if available)
            const kills = match.kills || [];
            const weaponCounts = {};

            kills.forEach((kill) => {
              if (kill.killer_puuid === puuid) {
                const weapon = kill.damage_weapon_name || "Unknown";
                weaponCounts[weapon] = (weaponCounts[weapon] || 0) + 1;
              }
            });

            const sortedWeapons = Object.entries(weaponCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3); // Top 3 weapons

            return (
              <div className="space-y-6 pt-4">
                <h3 className="flex items-center gap-2 text-sm font-bold tracking-widest text-slate-500 uppercase">
                  <Target className="h-4 w-4 text-rose-500" />
                  Personal Performance
                </h3>

                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
                  {/* Card Background Gradient */}
                  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-rose-500 via-sky-500 to-emerald-500" />

                  <div className="space-y-6 p-4 md:space-y-8 md:p-8">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6">
                      <div className="flex items-center gap-3 md:gap-5">
                        <div className="relative">
                          <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-900 opacity-50 blur-sm" />
                          <img
                            src={
                              typeof agentIcons[me.character] === "object"
                                ? agentIcons[me.character]?.src
                                : agentIcons[me.character] ||
                                  me.assets.agent.small
                            }
                            alt={me.character}
                            className="relative h-14 w-14 rounded-xl border-2 border-slate-700 bg-slate-800 object-cover md:h-20 md:w-20"
                          />
                        </div>
                        <div>
                          <h4 className="text-lg font-black tracking-tighter text-white uppercase italic md:text-2xl">
                            {me.name}{" "}
                            <span className="text-xs font-normal text-slate-600 not-italic md:text-sm">
                              #{me.tag}
                            </span>
                          </h4>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs font-bold tracking-widest text-rose-500 uppercase md:text-sm">
                              {me.character}
                            </span>
                            <span className="text-slate-700">•</span>
                            <span className="font-mono text-xs text-slate-400 md:text-sm">
                              {(
                                (stats.score || 0) /
                                (metadata.rounds_played || 1)
                              ).toFixed(0)}{" "}
                              ACS
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Accuracy Visualization */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/20 p-4 md:rounded-3xl md:p-8">
                      {/* Scanline/Grid Effect Background */}
                      <div
                        className="pointer-events-none absolute inset-0 opacity-[0.03]"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle, #fff 1px, transparent 1px)",
                          backgroundSize: "24px 24px",
                        }}
                      />

                      <div className="relative flex flex-col items-center justify-center gap-8 md:gap-16 lg:flex-row">
                        {/* TACTICAL SILHOUETTE */}
                        <div className="relative shrink-0">
                          {/* Aura Glow */}
                          <div className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/10 blur-[60px] md:h-48 md:w-48" />

                          <svg
                            width="120"
                            height="160"
                            viewBox="0 0 100 140"
                            className="relative drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] md:h-[240px] md:w-[180px]"
                          >
                            {/* HEAD HITBOX */}
                            <g className="cursor-help transition-all duration-500 hover:brightness-125">
                              <rect
                                x="38"
                                y="5"
                                width="24"
                                height="28"
                                rx="6"
                                fill={hsPct > 0 ? "url(#headGrad)" : "#1e293b"}
                                className="stroke-white/20 stroke-[1]"
                              />
                              <defs>
                                <linearGradient
                                  id="headGrad"
                                  x1="0%"
                                  y1="0%"
                                  x2="100%"
                                  y2="100%"
                                >
                                  <stop offset="0%" stopColor="#f43f5e" />
                                  <stop offset="100%" stopColor="#9f1239" />
                                </linearGradient>
                              </defs>
                            </g>

                            {/* BODY/TORSO HITBOX (with Arms/Hands) */}
                            <g className="cursor-help transition-all duration-500 hover:brightness-125">
                              {/* Torso */}
                              <path
                                d="M30 38 C30 36 35 34 50 34 C65 34 70 36 70 38 L75 85 L25 85 Z"
                                fill={bsPct > 0 ? "url(#bodyGrad)" : "#1e293b"}
                                className="stroke-white/20 stroke-[1]"
                              />
                              {/* Left Arm & Hand */}
                              <path
                                d="M25 42 L12 80 C11 83 18 85 20 80 L28 45 Z"
                                fill={bsPct > 0 ? "url(#bodyGrad)" : "#1e293b"}
                                className="stroke-white/20 stroke-[1]"
                              />
                              {/* Right Arm & Hand */}
                              <path
                                d="M75 42 L88 80 C89 83 82 85 80 80 L72 45 Z"
                                fill={bsPct > 0 ? "url(#bodyGrad)" : "#1e293b"}
                                className="stroke-white/20 stroke-[1]"
                              />
                              <defs>
                                <linearGradient
                                  id="bodyGrad"
                                  x1="0%"
                                  y1="0%"
                                  x2="100%"
                                  y2="100%"
                                >
                                  <stop offset="0%" stopColor="#38bdf8" />
                                  <stop offset="100%" stopColor="#0369a1" />
                                </linearGradient>
                              </defs>
                            </g>

                            {/* LEGS/LOWER HITBOX */}
                            <g className="cursor-help transition-all duration-500 hover:brightness-125">
                              <path
                                d="M32 95 L24 135 C23 138 32 140 34 135 L44 95 Z M68 95 L76 135 C77 138 68 140 66 135 L56 95 Z"
                                fill={lsPct > 0 ? "url(#legGrad)" : "#1e293b"}
                                className="stroke-white/20 stroke-[1]"
                              />
                              <defs>
                                <linearGradient
                                  id="legGrad"
                                  x1="0%"
                                  y1="0%"
                                  x2="100%"
                                  y2="100%"
                                >
                                  <stop offset="0%" stopColor="#10b981" />
                                  <stop offset="100%" stopColor="#047857" />
                                </linearGradient>
                              </defs>
                            </g>
                          </svg>
                        </div>

                        {/* DATA READOUT */}
                        <div className="w-full max-w-md flex-1 space-y-6 md:space-y-8">
                          <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                              <h5 className="text-base leading-none font-black tracking-tighter text-white uppercase italic md:text-lg">
                                Accuracy Analytics
                              </h5>
                              <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                Combat Shot Distribution
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                Total Hits
                              </p>
                              <p className="text-lg leading-none font-black text-white italic md:text-xl">
                                {totalShots}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4 md:space-y-6">
                            {/* HEAD STAT */}
                            <div className="group relative flex items-end justify-between overflow-hidden rounded-xl border border-white/5 bg-slate-900/40 p-3 transition-all hover:border-rose-500/30 md:p-4">
                              <div className="absolute top-0 left-0 h-full w-1 bg-rose-500/50" />
                              <div className="space-y-0.5 md:space-y-1">
                                <p className="text-[10px] font-black tracking-widest text-rose-500 uppercase">
                                  Head Target
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 capitalize md:text-xs">
                                  {stats.headshots || 0} Critical Strikes
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-baseline justify-end gap-1">
                                  <span className="text-2xl font-black tracking-tighter text-white italic md:text-3xl">
                                    {hsPct}
                                  </span>
                                  <span className="text-sm font-bold text-rose-500">
                                    %
                                  </span>
                                </div>
                                <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-slate-800 md:mt-2 md:w-32">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-700 transition-all duration-1000"
                                    style={{ width: `${hsPct}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* BODY STAT */}
                            <div className="group relative flex items-end justify-between overflow-hidden rounded-xl border border-white/5 bg-slate-900/40 p-3 transition-all hover:border-sky-500/30 md:p-4">
                              <div className="absolute top-0 left-0 h-full w-1 bg-sky-500/50" />
                              <div className="space-y-0.5 md:space-y-1">
                                <p className="text-[10px] font-black tracking-widest text-sky-500 uppercase">
                                  Torso Target
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 capitalize md:text-xs">
                                  {stats.bodyshots || 0} Core Impacts
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-baseline justify-end gap-1">
                                  <span className="text-2xl font-black tracking-tighter text-white italic md:text-3xl">
                                    {bsPct}
                                  </span>
                                  <span className="text-sm font-bold text-sky-500">
                                    %
                                  </span>
                                </div>
                                <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-slate-800 md:mt-2 md:w-32">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-700 transition-all duration-1000"
                                    style={{ width: `${bsPct}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* LEGS STAT */}
                            <div className="group relative flex items-end justify-between overflow-hidden rounded-xl border border-white/5 bg-slate-900/40 p-3 transition-all hover:border-emerald-500/30 md:p-4">
                              <div className="absolute top-0 left-0 h-full w-1 bg-emerald-500/50" />
                              <div className="space-y-0.5 md:space-y-1">
                                <p className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">
                                  Lower Target
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 capitalize md:text-xs">
                                  {stats.legshots || 0} Limb Contacts
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-baseline justify-end gap-1">
                                  <span className="text-2xl font-black tracking-tighter text-white italic md:text-3xl">
                                    {lsPct}
                                  </span>
                                  <span className="text-sm font-bold text-emerald-500">
                                    %
                                  </span>
                                </div>
                                <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-slate-800 md:mt-2 md:w-32">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-all duration-1000"
                                    style={{ width: `${lsPct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-slate-950/50 p-3 text-center md:p-4">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase">
            VRivals Arena Match Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
