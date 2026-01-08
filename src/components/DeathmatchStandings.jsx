import React, { useState } from 'react';
import { Trophy, Users, Shield, Target, Medal, Edit2, Check, X } from 'lucide-react';
import { updateParticipantScore } from '@/lib/brackets';

export default function DeathmatchStandings({ registrations, tournament, isAdmin, matches = [] }) {
    const [editingId, setEditingId] = useState(null);
    const [editValues, setEditValues] = useState({ kills: 0, deaths: 0 });
    const [updating, setUpdating] = useState(false);

    // Find the DM Lobby match status
    const lobbyMatch = matches.find(m => m.teamA === 'LOBBY');
    const isCompleted = lobbyMatch?.status === 'completed';

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
        const metaA = a.metadata ? JSON.parse(a.metadata) : {};
        const metaB = b.metadata ? JSON.parse(b.metadata) : {};
        return (metaB.kills || 0) - (metaA.kills || 0);
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-rose-500" />
                        Live Standings
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Official Leaderboard</p>
                        {lobbyMatch && (
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                lobbyMatch.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                lobbyMatch.status === 'ongoing' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' :
                                'bg-slate-500/10 text-slate-500 border-white/5'
                            }`}>
                                {lobbyMatch.status}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-white/5 rounded-xl">
                    <Users className="h-4 w-4 text-rose-500" />
                    <span className="text-xs font-bold text-white uppercase">{registrations.length} Players</span>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/50 backdrop-blur-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-slate-950/80 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
                            <th className="px-4 py-4 w-12 text-center">#</th>
                            <th className="px-4 py-4">Player</th>
                            <th className="px-4 py-4 text-center w-20">Kills</th>
                            <th className="px-4 py-4 text-center w-20">Deaths</th>
                            <th className="px-4 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedParticipants.map((reg, index) => {
                            const metadata = reg.metadata ? JSON.parse(reg.metadata) : {};
                            const isTop3 = index < 3;
                            
                            return (
                                <tr key={reg.$id} className={`group hover:bg-white/[0.02] transition-colors ${index === 0 ? 'bg-rose-500/[0.02]' : ''}`}>
                                    <td className="px-4 py-4">
                                        <div className={`flex h-7 w-7 items-center justify-center mx-auto rounded-lg font-black italic shadow-lg text-xs ${
                                            index === 0 ? 'bg-rose-500 text-white shadow-rose-500/20' : 
                                            index === 1 ? 'bg-slate-400 text-slate-950' : 
                                            index === 2 ? 'bg-amber-700 text-white' : 
                                            'bg-slate-900 border border-white/5 text-slate-500'
                                        }`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="shrink-0 p-1.5 bg-slate-950 rounded-lg border border-white/5 group-hover:border-rose-500/20 transition-all">
                                                <Target className={`h-3.5 w-3.5 ${isTop3 ? 'text-rose-500' : 'text-slate-600'}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-white group-hover:text-rose-500 transition-colors uppercase tracking-tight truncate text-sm">
                                                    {metadata.playerName || reg.teamName || "Anonymous Player"}
                                                </p>
                                                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest whitespace-nowrap">
                                                    {reg.checkedIn ? <span className="text-emerald-500">Checked In</span> : "Awaiting"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {(editingId === reg.$id && !isCompleted) ? (
                                            <input 
                                                type="number"
                                                className="w-12 bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-white text-center text-sm focus:border-rose-500 outline-none"
                                                value={editValues.kills}
                                                onChange={(e) => setEditValues({...editValues, kills: parseInt(e.target.value) || 0})}
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="text-base font-black text-white italic">{metadata.kills || 0}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-center text-slate-600 font-mono text-xs">
                                        {(editingId === reg.$id && !isCompleted) ? (
                                            <input 
                                                type="number"
                                                className="w-12 bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-white text-center text-sm focus:border-rose-500 outline-none"
                                                value={editValues.deaths}
                                                onChange={(e) => setEditValues({...editValues, deaths: parseInt(e.target.value) || 0})}
                                            />
                                        ) : (
                                            metadata.deaths || 0
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {(isAdmin && !isCompleted) && (
                                                editingId === reg.$id ? (
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button 
                                                            onClick={() => handleUpdate(reg.$id)}
                                                            disabled={updating}
                                                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditingId(null)}
                                                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => {
                                                            setEditingId(reg.$id);
                                                            setEditValues({ kills: metadata.kills || 0, deaths: metadata.deaths || 0 });
                                                        }}
                                                        className="p-1.5 rounded-lg bg-slate-900 border border-white/5 text-slate-500 hover:text-white hover:border-white/20 transition-all sm:opacity-0 group-hover:opacity-100 shrink-0"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </button>
                                                )
                                            )}

                                            <div className="shrink-0 h-6">
                                                {(index === 0 && isCompleted) ? (
                                                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase tracking-widest border border-rose-500/20 whitespace-nowrap">
                                                        <Medal className="h-2.5 w-2.5" /> Winner
                                                    </div>
                                                ) : index < (tournament.maxTeams / 2) ? (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 whitespace-nowrap">Qualified</span>
                                                ) : (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 whitespace-nowrap">Active</span>
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
                <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-950/30 rounded-2xl border border-dashed border-white/5">
                    <Users className="h-12 w-12 text-slate-800 mb-4" />
                    <h3 className="text-white font-bold">No Players Yet</h3>
                    <p className="text-sm text-slate-500">Standings will appear once players join.</p>
                </div>
            )}
        </div>
    );
}
