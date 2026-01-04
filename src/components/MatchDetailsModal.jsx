"use client";
import React from "react";
import { X, Trophy, Target, Shield, Zap } from "lucide-react";

export default function MatchDetailsModal({ match, isOpen, onClose, puuid }) {
  if (!isOpen || !match) return null;

  const metadata = match.metadata || {};
  const players = match.players || {};
  const teams = match.teams || {};
  const allPlayers = players.all_players || [];
  
  // Sort players by score/combat effectiveness (usually ACS or score)
  const sortedPlayers = [...allPlayers].sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0));

  const formatTeamName = (team) => team.charAt(0).toUpperCase() + team.slice(1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6 bg-slate-900/50">
          <div className="flex items-center gap-6">
            <div className="text-left">
              <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">{metadata.map}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="uppercase">{metadata.mode}</span>
                <span>•</span>
                <span>{new Date(metadata.game_start * 1000).toLocaleString(undefined, { 
                  month: 'numeric', 
                  day: 'numeric', 
                  year: 'numeric', 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 px-6 py-2 rounded-xl bg-slate-950/50 border border-white/5">
                <div className="text-center">
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest leading-none mb-1">Red</p>
                    <p className={`text-2xl font-anton ${teams.red?.has_won ? "text-rose-500" : "text-white"}`}>
                        {teams.red?.rounds_won || 0}
                    </p>
                </div>
                <div className="text-slate-700 font-bold text-xl">:</div>
                <div className="text-center">
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest leading-none mb-1">Blue</p>
                    <p className={`text-2xl font-anton ${teams.blue?.has_won ? "text-rose-500" : "text-white"}`}>
                        {teams.blue?.rounds_won || 0}
                    </p>
                </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Scoreboard */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-rose-500" />
                    Scoreboard
                </h3>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/10">
                                <th className="pb-3 font-bold">Player</th>
                                <th className="pb-3 font-bold text-center">Rank</th>
                                <th className="pb-3 font-bold text-center">ACS</th>
                                <th className="pb-3 font-bold text-center">K</th>
                                <th className="pb-3 font-bold text-center">D</th>
                                <th className="pb-3 font-bold text-center">A</th>
                                <th className="pb-3 font-bold text-center">K/D</th>
                                <th className="pb-3 font-bold text-center">HS%</th>
                                <th className="pb-3 font-bold text-center">ADR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedPlayers.map((player) => {
                                const isMe = player.puuid === puuid;
                                const stats = player.stats || {};
                                const kd = ((stats.kills || 0) / Math.max(1, stats.deaths || 0)).toFixed(1);
                                const hs = (((stats.headshots || 0) / Math.max(1, (stats.headshots || 0) + (stats.bodyshots || 0) + (stats.legshots || 0))) * 100).toFixed(0);
                                const roundsPlayed = metadata.rounds_played || 1;
                                const adr = ((player.stats.damage?.made || 0) / roundsPlayed).toFixed(0);
                                const acs = ((player.stats.score || 0) / roundsPlayed).toFixed(0);

                                return (
                                    <tr 
                                        key={player.puuid} 
                                        className={`group hover:bg-white/5 transition-colors ${isMe ? "bg-rose-500/5" : ""}`}
                                    >
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                     <img 
                                                        src={player.assets.agent.small} 
                                                        alt={player.character} 
                                                        className={`h-10 w-10 rounded bg-slate-800 border-l-2 ${player.team === "Red" ? "border-rose-500" : "border-blue-500"}`}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-white text-sm">{player.name}</span>
                                                        <span className="text-[10px] text-slate-500">#{player.tag}</span>
                                                    </div>
                                                    <span className="text-[10px] uppercase text-slate-500">{player.character}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-center">
                                            <div className="flex items-center justify-center">
                                                {player.currenttier > 2 ? (
                                                    <img 
                                                        src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${player.currenttier}/largeicon.png`}
                                                        alt={player.currenttier_patched}
                                                        title={player.currenttier_patched}
                                                        className="h-10 w-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                                                        onError={(e) => {
                                                            // If large icon fails, try small icon from the same set
                                                            e.target.src = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${player.currenttier}/smallicon.png`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-800 border border-white/5">
                                                        <span className="text-[10px] text-slate-500 font-bold">UN</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 text-center font-mono text-white text-sm">{acs}</td>
                                        <td className="py-3 text-center font-mono text-white text-sm font-bold">{stats.kills || 0}</td>
                                        <td className="py-3 text-center font-mono text-slate-400 text-sm">{stats.deaths || 0}</td>
                                        <td className="py-3 text-center font-mono text-slate-400 text-sm">{stats.assists || 0}</td>
                                        <td className={`py-3 text-center font-mono text-sm ${kd >= 1.5 ? "text-emerald-400" : kd < 1 ? "text-rose-400" : "text-white"}`}>
                                            {kd}
                                        </td>
                                        <td className="py-3 text-center font-mono text-slate-400 text-sm">{hs}%</td>
                                        <td className="py-3 text-center font-mono text-slate-400 text-sm">{adr}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Additional info grid */}
            <div className="grid gap-6">
                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4 space-y-4">
                     <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Game Stats</h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs text-slate-500">Server</span>
                            <p className="text-sm font-medium text-white">{metadata.cluster || "Unknown"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-slate-500">Duration</span>
                            <p className="text-sm font-medium text-white">{((metadata.game_length || 0) / 60).toFixed(0)} min</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-slate-500">Region</span>
                            <p className="text-sm font-medium text-white uppercase">{metadata.region || "Unknown"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-slate-500">Match ID</span>
                            <p className="text-[10px] font-mono text-slate-500 break-all">{metadata.matchid}</p>
                        </div>
                     </div>
                </div>
            </div>

            {/* Personal Performance Stats */}
            {(() => {
                const me = sortedPlayers.find(p => p.puuid === puuid);
                if (!me) return null;

                const stats = me.stats || {};
                const totalShots = (stats.headshots || 0) + (stats.bodyshots || 0) + (stats.legshots || 0);
                const hsPct = totalShots > 0 ? ((stats.headshots / totalShots) * 100).toFixed(0) : 0;
                const bsPct = totalShots > 0 ? ((stats.bodyshots / totalShots) * 100).toFixed(0) : 0;
                const lsPct = totalShots > 0 ? ((stats.legshots / totalShots) * 100).toFixed(0) : 0;

                // Calculate Weapon Kills from match.kills (if available)
                const kills = match.kills || [];
                const weaponCounts = {};
                
                kills.forEach(kill => {
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
                         <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Target className="h-4 w-4 text-rose-500" />
                            Personal Performance
                        </h3>
                        
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
                            {/* Card Background Gradient */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-sky-500 to-emerald-500" />
                            
                            <div className="p-8 space-y-8">
                                {/* Header */}
                                <div className="flex flex-wrap items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="relative">
                                            <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-900 opacity-50 blur-sm" />
                                            <img 
                                                src={me.assets.agent.small} 
                                                alt={me.character} 
                                                className="relative h-20 w-20 rounded-xl bg-slate-800 border-2 border-slate-700 object-cover" 
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                                {me.name} <span className="text-slate-600 font-normal not-italic text-sm">#{me.tag}</span>
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm font-bold text-rose-500 uppercase tracking-widest">{me.character}</span>
                                                <span className="text-slate-700">•</span>
                                                <span className="text-sm text-slate-400 font-mono">{((stats.score || 0) / (metadata.rounds_played || 1)).toFixed(0)} ACS</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Accuracy Visualization */}
                                <div className="relative overflow-hidden rounded-3xl bg-slate-950/20 border border-white/5 p-8">
                                    {/* Scanline/Grid Effect Background */}
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                    
                                    <div className="relative flex flex-col lg:flex-row items-center justify-center gap-16">
                                        {/* TACTICAL SILHOUETTE */}
                                        <div className="relative shrink-0">
                                            {/* Aura Glow */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 bg-rose-500/10 rounded-full blur-[60px]" />
                                            
                                            <svg width="180" height="240" viewBox="0 0 100 140" className="relative drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                                {/* HEAD HITBOX */}
                                                <g className="transition-all duration-500 hover:brightness-125 cursor-help">
                                                    <rect 
                                                        x="38" y="5" width="24" height="28" rx="6" 
                                                        fill={hsPct > 0 ? "url(#headGrad)" : "#1e293b"} 
                                                        className="stroke-[1] stroke-white/20"
                                                    />
                                                    <defs>
                                                        <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#f43f5e" />
                                                            <stop offset="100%" stopColor="#9f1239" />
                                                        </linearGradient>
                                                    </defs>
                                                </g>

                                                {/* BODY/TORSO HITBOX (with Arms/Hands) */}
                                                <g className="transition-all duration-500 hover:brightness-125 cursor-help">
                                                    {/* Torso */}
                                                    <path 
                                                        d="M30 38 C30 36 35 34 50 34 C65 34 70 36 70 38 L75 85 L25 85 Z" 
                                                        fill={bsPct > 0 ? "url(#bodyGrad)" : "#1e293b"}
                                                        className="stroke-[1] stroke-white/20"
                                                    />
                                                    {/* Left Arm & Hand */}
                                                    <path 
                                                        d="M25 42 L12 80 C11 83 18 85 20 80 L28 45 Z" 
                                                        fill={bsPct > 0 ? "url(#bodyGrad)" : "#1e293b"}
                                                        className="stroke-[1] stroke-white/20"
                                                    />
                                                    {/* Right Arm & Hand */}
                                                    <path 
                                                        d="M75 42 L88 80 C89 83 82 85 80 80 L72 45 Z" 
                                                        fill={bsPct > 0 ? "url(#bodyGrad)" : "#1e293b"}
                                                        className="stroke-[1] stroke-white/20"
                                                    />
                                                    <defs>
                                                        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#38bdf8" />
                                                            <stop offset="100%" stopColor="#0369a1" />
                                                        </linearGradient>
                                                    </defs>
                                                </g>

                                                {/* LEGS/LOWER HITBOX */}
                                                <g className="transition-all duration-500 hover:brightness-125 cursor-help">
                                                    <path 
                                                        d="M32 95 L24 135 C23 138 32 140 34 135 L44 95 Z M68 95 L76 135 C77 138 68 140 66 135 L56 95 Z" 
                                                        fill={lsPct > 0 ? "url(#legGrad)" : "#1e293b"}
                                                        className="stroke-[1] stroke-white/20"
                                                    />
                                                    <defs>
                                                        <linearGradient id="legGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#10b981" />
                                                            <stop offset="100%" stopColor="#047857" />
                                                        </linearGradient>
                                                    </defs>
                                                </g>
                                            </svg>
                                        </div>

                                        {/* DATA READOUT */}
                                        <div className="flex-1 w-full max-w-md space-y-8">
                                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                                <div>
                                                    <h5 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">Accuracy Analytics</h5>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Combat Shot Distribution</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Hits</p>
                                                    <p className="text-xl font-black text-white italic leading-none">{totalShots}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {/* HEAD STAT */}
                                                <div className="relative group flex items-end justify-between p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-rose-500/30 transition-all overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/50" />
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Head Target</p>
                                                        <p className="text-xs font-bold text-slate-400 capitalize">{stats.headshots || 0} Critical Strikes</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-baseline justify-end gap-1">
                                                            <span className="text-3xl font-black text-white italic tracking-tighter">{hsPct}</span>
                                                            <span className="text-sm font-bold text-rose-500">%</span>
                                                        </div>
                                                        <div className="mt-2 h-1 w-32 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-rose-500 to-rose-700 rounded-full transition-all duration-1000" style={{ width: `${hsPct}%` }} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* BODY STAT */}
                                                <div className="relative group flex items-end justify-between p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-sky-500/30 transition-all overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-sky-500/50" />
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Torso Target</p>
                                                        <p className="text-xs font-bold text-slate-400 capitalize">{stats.bodyshots || 0} Core Impacts</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-baseline justify-end gap-1">
                                                            <span className="text-3xl font-black text-white italic tracking-tighter">{bsPct}</span>
                                                            <span className="text-sm font-bold text-sky-500">%</span>
                                                        </div>
                                                        <div className="mt-2 h-1 w-32 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-sky-500 to-sky-700 rounded-full transition-all duration-1000" style={{ width: `${bsPct}%` }} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* LEGS STAT */}
                                                <div className="relative group flex items-end justify-between p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-emerald-500/30 transition-all overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50" />
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Lower Target</p>
                                                        <p className="text-xs font-bold text-slate-400 capitalize">{stats.legshots || 0} Limb Contacts</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-baseline justify-end gap-1">
                                                            <span className="text-3xl font-black text-white italic tracking-tighter">{lsPct}</span>
                                                            <span className="text-sm font-bold text-emerald-500">%</span>
                                                        </div>
                                                        <div className="mt-2 h-1 w-32 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full transition-all duration-1000" style={{ width: `${lsPct}%` }} />
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
        <div className="border-t border-white/10 p-4 bg-slate-950/50 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Valolant Match Intelligence</p>
        </div>
      </div>
    </div>
  );
}
