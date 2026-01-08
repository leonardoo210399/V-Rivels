import React from 'react';
import { Trophy } from 'lucide-react';
import Link from 'next/link';

const MatchCard = ({ match, teamA, teamB, isFinal }) => {
    const getStatusColor = (s) => {
        if (s === 'completed') return 'border-emerald-500/30 bg-emerald-500/5';
        if (s === 'ongoing') return 'border-amber-500/50 bg-amber-500/10 animate-pulse';
        return 'border-white/10 bg-slate-900/40';
    };

    const isWinnerA = match.winner && match.winner === match.teamA;
    const isWinnerB = match.winner && match.winner === match.teamB;

    return (
        <Link href={`/tournaments/${match.tournamentId}/match/${match.$id}`} className={`
            relative w-64 rounded-xl border backdrop-blur-md p-4 flex flex-col gap-3 transition-all hover:translate-x-1 hover:border-rose-500/30 group cursor-pointer overflow-hidden
            ${getStatusColor(match.status)}
            ${isFinal ? 'border-yellow-500/40 ring-1 ring-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.05)]' : ''}
        `}>
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-rose-500/10 transition-colors" />
            
            {/* Team A */}
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 max-w-[170px]">
                    <div className={`w-1 h-6 rounded-full transition-colors duration-500 ${isWinnerA ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-800'}`} />
                    <span className={`truncate text-sm font-bold uppercase tracking-tight transition-colors ${isWinnerA ? 'text-white' : 'text-slate-400'}`}>
                        {teamA?.teamName || teamA?.name || 'TBD'}
                    </span>
                </div>
                <span className={`text-sm font-black italic ${isWinnerA ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {match.scoreA !== null ? match.scoreA : '-'}
                </span>
            </div>

            {/* VS Divider */}
            <div className="h-px w-full bg-white/5 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#0a0c10] px-2 text-[8px] font-black uppercase text-slate-700 tracking-widest italic">VS</div>
            </div>

            {/* Team B */}
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 max-w-[170px]">
                    <div className={`w-1 h-6 rounded-full transition-colors duration-500 ${isWinnerB ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-800'}`} />
                    <span className={`truncate text-sm font-bold uppercase tracking-tight transition-colors ${isWinnerB ? 'text-white' : 'text-slate-400'}`}>
                        {teamB?.teamName || teamB?.name || 'TBD'}
                    </span>
                </div>
                <span className={`text-sm font-black italic ${isWinnerB ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {match.scoreB !== null ? match.scoreB : '-'}
                </span>
            </div>
            
            {isFinal && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black p-2 rounded-bl-xl shadow-lg shadow-yellow-500/20 z-20">
                    <Trophy className="w-4 h-4" />
                </div>
            )}
        </Link>
    );
};

export default function TournamentBracket({ matches = [], participants = {} }) {
    if (!matches.length) return (
        <div className="flex flex-col items-center justify-center p-20 text-slate-600 bg-slate-950/20 border border-dashed border-white/5 rounded-3xl">
            <Trophy className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-xs font-black uppercase tracking-[0.3em]">Bracket not generated yet</p>
        </div>
    );

    // Group matches by round
    const rounds = matches.reduce((acc, m) => {
        if (!acc[m.round]) acc[m.round] = [];
        acc[m.round].push(m);
        return acc;
    }, {});

    const roundKeys = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));

    const getTeam = (id) => participants[id] || { name: 'TBD' };

    return (
        <div className="w-full overflow-x-auto pb-10 custom-scrollbar">
            <div className="flex gap-24 min-w-max px-8 pt-16">
                {roundKeys.map((round, rIndex) => (
                    <div key={round} className="flex flex-col justify-around gap-16 relative py-4">
                        {/* Round Header */}
                        <div className="absolute -top-10 left-0 right-0 text-center">
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] italic opacity-80 whitespace-nowrap">
                                {rIndex === roundKeys.length - 1 ? 'Championship' : 
                                 rIndex === roundKeys.length - 2 ? 'Semi Finals' : 
                                 rIndex === roundKeys.length - 3 ? 'Quarter Finals' :
                                 `Round ${round}`}
                            </span>
                        </div>

                        {/* Matches for this round */}
                        {rounds[round].sort((a, b) => a.matchIndex - b.matchIndex).map((match, mIndex) => (
                            <div key={match.$id} className="relative flex items-center">
                                {/* Connector Lines to NEXT round */}
                                {rIndex < roundKeys.length - 1 && (
                                    <div className="absolute -right-24 top-1/2 w-24 h-px pointer-events-none z-0">
                                        {/* Horizontal branch from current card to midpoint */}
                                        <div className="absolute left-0 top-0 w-12 h-px bg-white/10 shadow-[0_0_8px_rgba(255,255,255,0.05)]" />
                                        
                                        {/* Vertical fork line */}
                                        <div className={`absolute left-12 w-px bg-white/10 shadow-[0_0_8px_rgba(255,255,255,0.05)] ${
                                            mIndex % 2 === 0 
                                            ? 'top-0 h-[84px]' // Top match connects down
                                            : 'bottom-0 h-[84px]' // Bottom match connects up
                                        }`} />

                                        {/* Final horizontal connector to the actual match in NEXT round */}
                                        {/* Only show this from the top match of each pair */}
                                        {mIndex % 2 === 0 && (
                                            <div className="absolute left-12 top-[84px] w-12 h-px bg-white/10 shadow-[0_0_8px_rgba(255,255,255,0.05)]" />
                                        )}
                                    </div>
                                )}
                                
                                <div className="relative z-10">
                                    <MatchCard 
                                        match={match} 
                                        teamA={getTeam(match.teamA)} 
                                        teamB={getTeam(match.teamB)}
                                        isFinal={rIndex === roundKeys.length - 1} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225, 29, 72, 0.2); }
            `}</style>
        </div>
    );
}
