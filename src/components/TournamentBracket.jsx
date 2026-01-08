import React from 'react';
import { Trophy, Clock } from 'lucide-react';
import Link from 'next/link';

const MatchCard = ({ match, teamA, teamB, isFinal }) => {
    const getStatusColor = (s) => {
        if (s === 'completed') return 'border-emerald-500/30 bg-emerald-500/5';
        if (s === 'ongoing') return 'border-amber-500/50 bg-amber-500/10 animate-pulse';
        return 'border-white/10 bg-slate-900/40';
    };

    const isWinnerA = match.winner && match.winner === match.teamA;
    const isWinnerB = match.winner && match.winner === match.teamB;

    const time = match.scheduledTime;
    let displayTime = time;
    if (!time && match.round && match.matchIndex !== undefined && match.tournamentDate) {
        const startDate = new Date(match.tournamentDate);
        const offset = (match.round - 1) * 4 + match.matchIndex;
        startDate.setHours(startDate.getHours() + offset);
        displayTime = startDate.toISOString();
    }

    const formattedTime = displayTime ? new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

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

            {formattedTime && match.status !== 'completed' && (
                <div 
                    className="flex items-center gap-1.5 mt-1 pt-2 border-t border-white/5 opacity-50 group-hover:opacity-100 transition-opacity"
                    suppressHydrationWarning
                >
                    <Clock className="w-3 h-3 text-rose-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Scheduled: {formattedTime}</span>
                </div>
            )}
            
            {isFinal && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black p-2 rounded-bl-xl shadow-lg shadow-yellow-500/20 z-20">
                    <Trophy className="w-4 h-4" />
                </div>
            )}
        </Link>
    );
};

export default function TournamentBracket({ matches = [], participants = {}, tournament = {} }) {
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

    // Compact heights for Tab view
    const BASE_SLOT_HEIGHT = 160;

    return (
        <div className="w-full overflow-x-auto pb-10 custom-scrollbar scroll-smooth">
            <div className="flex gap-12 min-w-max">
                {roundKeys.map((round, rIndex) => {
                    const roundMatches = [...rounds[round]].sort((a, b) => a.matchIndex - b.matchIndex);
                    const slotHeight = BASE_SLOT_HEIGHT * Math.pow(2, rIndex);
                    
                    return (
                        <div key={round} className="flex flex-col relative w-60">
                            {/* Round Header */}
                            <div className="mb-8 text-center">
                                <span className="text-[9px] font-black text-rose-500/60 uppercase tracking-[0.3em] italic whitespace-nowrap">
                                    {rIndex === roundKeys.length - 1 ? 'Finals' : 
                                     rIndex === roundKeys.length - 2 ? 'Semi' : 
                                     rIndex === roundKeys.length - 3 ? 'Quarter' :
                                     `Round ${round}`}
                                </span>
                            </div>

                            {/* Matches */}
                            {roundMatches.map((match, mIndex) => {
                                const connectorHeight = slotHeight / 2;
                                
                                return (
                                    <div 
                                        key={match.$id} 
                                        className="relative flex items-center justify-center"
                                        style={{ height: `${slotHeight}px` }}
                                    >
                                        <div className="relative z-10 scale-90 origin-center">
                                            <MatchCard 
                                                match={{ ...match, tournamentId: tournament.$id, tournamentDate: tournament?.date }} 
                                                teamA={getTeam(match.teamA)} 
                                                teamB={getTeam(match.teamB)}
                                                isFinal={rIndex === roundKeys.length - 1} 
                                            />
                                        </div>

                                        {/* Connector Lines */}
                                        {rIndex < roundKeys.length - 1 && (
                                            <div className="absolute -right-12 top-1/2 w-12 pointer-events-none z-0">
                                                <div className="absolute left-0 top-0 w-6 h-px bg-white/10" />
                                                <div 
                                                    className="absolute left-6 w-px bg-white/10" 
                                                    style={{ 
                                                        height: `${connectorHeight}px`,
                                                        top: mIndex % 2 === 0 ? '0' : `-${connectorHeight}px`
                                                    }}
                                                />
                                                {mIndex % 2 === 0 && (
                                                    <div className="absolute left-6 w-6 h-px bg-white/10" style={{ top: `${connectorHeight}px` }} />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225, 29, 72, 0.4); border: 2px solid transparent; background-clip: content-box; }
            `}</style>
        </div>
    );
}
