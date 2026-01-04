import React from 'react';
import { Trophy } from 'lucide-react';
import Link from 'next/link';

const MatchCard = ({ match, teamA, teamB, isFinal }) => {
    // Determine status colors
    const getStatusColor = (s) => {
        if (s === 'completed') return 'border-emerald-500/50 bg-emerald-950/20';
        if (s === 'ongoing') return 'border-rose-500/50 bg-rose-950/20 animate-pulse';
        return 'border-white/10 bg-slate-900/50';
    };

    const isWinnerA = match.winner && match.winner === match.teamA;
    const isWinnerB = match.winner && match.winner === match.teamB;

    return (
        <Link href={`/tournaments/${match.tournamentId}/match/${match.$id}`} className={`
            relative w-64 rounded-xl border backdrop-blur-sm p-3 flex flex-col gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer
            ${getStatusColor(match.status)}
            ${isFinal ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : ''}
        `}>
            {/* Connector Lines (Pseudo logic, handled by parent usually, but we can try simple ones) */}
            
            {/* Team A */}
            <div className={`flex justify-between items-center rounded px-2 py-1 ${isWinnerA ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-black/20 text-slate-400'}`}>
                <span className="truncate text-sm max-w-[140px]">{teamA?.teamName || teamA?.name || 'TBD'}</span>
                <span className="text-xs font-mono">{match.scoreA !== null ? match.scoreA : '-'}</span>
            </div>

            {/* VS Divider */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none opacity-10">
                <span className="text-[10px] font-black uppercase text-white">VS</span>
            </div>

            {/* Team B */}
            <div className={`flex justify-between items-center rounded px-2 py-1 ${isWinnerB ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-black/20 text-slate-400'}`}>
                <span className="truncate text-sm max-w-[140px]">{teamB?.teamName || teamB?.name || 'TBD'}</span>
                <span className="text-xs font-mono">{match.scoreB !== null ? match.scoreB : '-'}</span>
            </div>
            
            {isFinal && (
                <div className="absolute -top-3 -right-3 bg-yellow-500 text-black p-1.5 rounded-full shadow-lg shadow-yellow-500/20">
                    <Trophy className="w-3 h-3" />
                </div>
            )}
        </Link>
    );
};

export default function TournamentBracket({ matches = [], participants = {} }) {
    if (!matches.length) return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 border border-dashed border-white/10 rounded-2xl">
            <Trophy className="w-8 h-8 mb-3 opacity-20" />
            <p>Bracket not generated yet.</p>
        </div>
    );

    // Group matches by round
    const rounds = matches.reduce((acc, match) => {
        const r = match.round;
        if (!acc[r]) acc[r] = [];
        acc[r].push(match);
        return acc;
    }, {});

    const roundKeys = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));

    const getTeam = (id) => {
        if (!id) return null;
        return participants[id] || { name: 'Unknown' };
    };

    return (
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-16 min-w-max px-4 pt-4">
                {roundKeys.map((round, rIndex) => (
                    <div key={round} className="flex flex-col justify-around gap-8 relative">
                        {/* Round Header */}
                        <div className="text-center mb-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                {rIndex === roundKeys.length - 1 ? 'Grand Final' : 
                                 rIndex === roundKeys.length - 2 ? 'Semi Finals' : 
                                 `Round ${round}`}
                            </span>
                        </div>

                        {/* Matches for this round */}
                        {rounds[round].sort((a, b) => a.matchIndex - b.matchIndex).map((match, mIndex) => (
                            <div key={match.$id || `${match.round}-${match.matchIndex}`} className="relative flex items-center">
                                {/* Connector: Line to PREVIOUS round */}
                                {rIndex > 0 && (
                                    <div className="absolute -left-8 top-1/2 w-8 h-px bg-white/10"></div>
                                )}
                                
                                <MatchCard 
                                    match={match} 
                                    teamA={getTeam(match.teamA)} 
                                    teamB={getTeam(match.teamB)}
                                    isFinal={rIndex === roundKeys.length - 1} 
                                />

                                {/* Connector: Line to NEXT round (Optional, usually hard to draw purely with CSS in this flex layout, 
                                    but standard brackets align by height. For now we skip complex connectors to avoid mess).
                                */}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* Add this to index.css or app.css if needed for scrollbar:
.custom-scrollbar::-webkit-scrollbar { height: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
*/
