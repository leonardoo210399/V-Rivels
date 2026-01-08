import React from 'react';
import { Trophy, Clock, Maximize2 } from 'lucide-react';
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
                <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-white/5 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Clock className="w-3 h-3 text-rose-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Scheduled: {formattedTime}</span>
                </div>
            )}
        </Link>
    );
};

export default function CompleteBracket({ matches = [], participants = {}, tournament = {} }) {
    if (!matches.length) return null;

    const rounds = matches.reduce((acc, m) => {
        if (!acc[m.round]) acc[m.round] = [];
        acc[m.round].push(m);
        return acc;
    }, {});

    const roundKeys = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));
    const getTeam = (id) => participants[id] || { name: 'TBD' };

    const BASE_SLOT_HEIGHT = 180;

    return (
        <div className="w-full bg-[#0a0c10] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-rose-500/5 to-transparent">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Tournament Map</h3>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Official Bracket Progression</p>
                </div>
                <Trophy className="w-8 h-8 text-rose-500/20" />
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[800px] p-12 custom-scrollbar scroll-smooth">
                <div className="flex gap-24 min-w-max">
                    {roundKeys.map((round, rIndex) => {
                        const roundMatches = [...rounds[round]].sort((a, b) => a.matchIndex - b.matchIndex);
                        const slotHeight = BASE_SLOT_HEIGHT * Math.pow(2, rIndex);
                        
                        return (
                            <div key={round} className="flex flex-col relative w-64">
                                <div className="text-center mb-10">
                                    <span className="px-4 py-1.5 rounded-full bg-slate-900 border border-white/5 text-[9px] font-black text-rose-500 uppercase tracking-[0.3em] italic">
                                        {rIndex === roundKeys.length - 1 ? 'Championship' : 
                                         rIndex === roundKeys.length - 2 ? 'Semi Finals' : 
                                         rIndex === roundKeys.length - 3 ? 'Quarter Finals' :
                                         `Stage ${round}`}
                                    </span>
                                </div>

                                {roundMatches.map((match, mIndex) => {
                                    const connectorHeight = slotHeight / 2;
                                    return (
                                        <div 
                                            key={match.$id} 
                                            className="relative flex items-center justify-center"
                                            style={{ height: `${slotHeight}px` }}
                                        >
                                            <div className="relative z-10 transition-transform hover:scale-105 duration-300">
                                                <MatchCard 
                                                    match={{ ...match, tournamentId: tournament.$id, tournamentDate: tournament?.date }} 
                                                    teamA={getTeam(match.teamA)} 
                                                    teamB={getTeam(match.teamB)}
                                                    isFinal={rIndex === roundKeys.length - 1} 
                                                />
                                            </div>

                                            {rIndex < roundKeys.length - 1 && (
                                                <div className="absolute -right-24 top-1/2 w-24 pointer-events-none z-0">
                                                    <div className="absolute left-0 top-0 w-12 h-px bg-white/20" />
                                                    <div 
                                                        className="absolute left-12 w-px bg-white/20" 
                                                        style={{ 
                                                            height: `${connectorHeight}px`,
                                                            top: mIndex % 2 === 0 ? '0' : `-${connectorHeight}px`
                                                        }}
                                                    />
                                                    {mIndex % 2 === 0 && (
                                                        <div 
                                                            className="absolute left-12 w-12 h-px bg-white/20" 
                                                            style={{ top: `${connectorHeight}px` }}
                                                        />
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
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225, 29, 72, 0.2); }
            `}</style>
        </div>
    );
}
