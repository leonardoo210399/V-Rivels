import React from 'react';
import { Trophy, Users, Target, Medal, Clock } from 'lucide-react';

export default function CompleteStandings({ registrations, tournament, matches = [] }) {
    // Find the DM Lobby match status
    const lobbyMatch = matches.find(m => m.teamA === 'LOBBY');
    const isCompleted = lobbyMatch?.status === 'completed';

    // Sort registrations by score if available
    const sortedParticipants = [...registrations].sort((a, b) => {
        const parseMeta = (str) => {
            try { return str ? (typeof str === 'string' ? JSON.parse(str) : str) : {}; }
            catch (e) { return {}; }
        };
        const metaA = parseMeta(a.metadata);
        const metaB = parseMeta(b.metadata);
        return (metaB.kills || 0) - (metaA.kills || 0);
    });

    if (registrations.length === 0) return null;

    return (
        <section id="tournament-standings" className="mt-12 mx-auto max-w-6xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="rounded-[2.5rem] border border-white/5 bg-[#0a0c10]/80 p-6 md:p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -ml-48 -mb-48" />
                
                <div className="relative">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                                    <Trophy className="h-6 w-6" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
                                    Live Standings
                                </h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Official Tournament Leaderboard</p>
                                {lobbyMatch && (
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg ${
                                        lobbyMatch.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                        lobbyMatch.status === 'ongoing' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' :
                                        'bg-slate-500/10 text-slate-500 border-white/5'
                                    }`}>
                                        {lobbyMatch.status}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-6 py-3 bg-slate-900/50 border border-white/5 rounded-2xl backdrop-blur-md">
                                <Users className="h-4 w-4 text-rose-500" />
                                <span className="text-xs font-black uppercase tracking-widest text-white">{registrations.length} Players</span>
                            </div>
                            {(lobbyMatch?.scheduledTime || tournament?.date) && (
                                <div className="flex items-center gap-2 px-6 py-3 bg-slate-900/50 border border-white/5 rounded-2xl backdrop-blur-md" suppressHydrationWarning>
                                    <Clock className="h-4 w-4 text-rose-500" />
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                                        {new Date(lobbyMatch?.scheduledTime || tournament?.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-white/5 bg-slate-950/40 backdrop-blur-sm shadow-inner">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-slate-950/80 text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black">
                                    <th className="px-8 py-6 w-20 text-center">#</th>
                                    <th className="px-8 py-6">Player</th>
                                    <th className="px-8 py-6 text-center w-32">Kills</th>
                                    <th className="px-8 py-6 text-center w-32">Deaths</th>
                                    <th className="px-8 py-6 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {sortedParticipants.map((reg, index) => {
                                    let metadata = {};
                                    try {
                                        metadata = reg.metadata ? (typeof reg.metadata === 'string' ? JSON.parse(reg.metadata) : reg.metadata) : {};
                                    } catch (e) {
                                        metadata = {};
                                    }
                                    const isTop3 = index < 3;
                                    
                                    return (
                                        <tr key={reg.$id} className={`group hover:bg-white/[0.03] transition-all duration-300 ${index === 0 ? 'bg-rose-500/[0.03]' : ''}`}>
                                            <td className="px-8 py-6">
                                                <div className={`flex h-10 w-10 items-center justify-center mx-auto rounded-xl font-black italic shadow-2xl text-sm transform transition-transform group-hover:scale-110 ${
                                                    index === 0 ? 'bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-rose-500/20' : 
                                                    index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950' : 
                                                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' : 
                                                    'bg-slate-900 border border-white/5 text-slate-500'
                                                }`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="shrink-0 p-3 bg-slate-900 rounded-2xl border border-white/5 group-hover:border-rose-500/30 transition-all shadow-lg">
                                                        <Target className={`h-5 w-5 ${isTop3 ? 'text-rose-500' : 'text-slate-600'}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white group-hover:text-rose-500 transition-colors uppercase italic tracking-tighter text-lg">
                                                            {metadata.playerName || reg.teamName || "Anonymous Player"}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <div className={`h-1.5 w-1.5 rounded-full ${reg.checkedIn ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                                                                {reg.checkedIn ? <span className="text-emerald-500">Checked In</span> : "Awaiting"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-2xl font-black text-white italic tracking-tighter group-hover:scale-125 transition-transform block">
                                                    {metadata.kills || 0}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-lg font-black text-slate-600 italic tracking-tighter group-hover:text-slate-400 transition-colors">
                                                    {metadata.deaths || 0}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end">
                                                    {(index === 0 && isCompleted) ? (
                                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] border border-rose-500/20 shadow-lg shadow-rose-500/5">
                                                            <Medal className="h-3 w-3" /> Winner
                                                        </div>
                                                    ) : index < (tournament.maxTeams / 2) ? (
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Qualified</span>
                                                    ) : (
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">Active</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}
