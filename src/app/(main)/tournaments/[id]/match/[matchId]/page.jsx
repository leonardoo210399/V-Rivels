"use client";
import { useEffect, useState, use } from "react";
import { getMatch, updateMatchScore } from "@/lib/brackets";
import { getTournament } from "@/lib/tournaments";
import { getRegistration } from "@/lib/registrations"; // Need to implement this or fetch differently
import { useAuth } from "@/context/AuthContext";
import { Loader2, Trophy, Clock, Skull, Shield, Map as MapIcon } from "lucide-react";

// Mock Map Pool
const MAP_POOL = [
    { name: "Ascent", image: "/maps/ascent.jpg" },
    { name: "Bind", image: "/maps/bind.jpg" },
    { name: "Haven", image: "/maps/haven.jpg" },
    { name: "Split", image: "/maps/split.jpg" },
    { name: "Icebox", image: "/maps/icebox.jpg" },
    { name: "Breeze", image: "/maps/breeze.jpg" },
    { name: "Fracture", image: "/maps/fracture.jpg" }
];

export default function MatchLobbyPage({ params }) {
    const { id, matchId } = use(params);
    const { user } = useAuth();
    
    // Data State
    const [match, setMatch] = useState(null);
    const [teamA, setTeamA] = useState(null);
    const [teamB, setTeamB] = useState(null);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);

    // Veto State
    const [vetoState, setVetoState] = useState({
        bannedMaps: [],
        currentTurn: "teamA", // A starts
        selectedMap: null
    });

    // Score Reporting State
    const [scoreA, setScoreA] = useState(0);
    const [scoreB, setScoreB] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [matchId, id]);

    const loadData = async () => {
        try {
            // Fetch match details
            const matchData = await getMatch(matchId);
            setMatch(matchData);

            // Fetch Tournament
            const tourneyData = await getTournament(matchData.tournamentId);
            setTournament(tourneyData);

            // Fetch Teams (mock implementation for now inside the lib calls, assuming relations work or we fetch manually)
            // Ideally Appwrite returns expanded relations if configured, or we fetch manually using IDs.
            // Since we stored registration IDs in teamA/teamB:
            // Check if teamA is an object (expanded) or string (ID)
            
            // For now, let's assume valid ID strings and we need to fetch user names? 
            // Or maybe registrations collection has teamName.
            
            // TODO: Fetch Registration Details for Team A and B
            // const teamAData = await databases.getDocument(..., matchData.teamA)
            
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleBanMap = (mapName) => {
        // Simple client-side veto logic for demo
        if (vetoState.selectedMap) return;
        
        const newBanned = [...vetoState.bannedMaps, mapName];
        const newTurn = vetoState.currentTurn === "teamA" ? "teamB" : "teamA";
        
        let selected = null;
        if (newBanned.length === MAP_POOL.length - 1) {
            // One map left
            selected = MAP_POOL.find(m => !newBanned.includes(m.name)).name;
        }

        setVetoState({
            bannedMaps: newBanned,
            currentTurn: newTurn,
            selectedMap: selected
        });
    };

    const handleReportScore = async () => {
        if (!confirm(`Confirm Score: Team A ${scoreA} - ${scoreB} Team B?`)) return;
        
        setSubmitting(true);
        try {
            const winnerId = scoreA > scoreB ? match.teamA : match.teamB;
            await updateMatchScore(match.$id, Number(scoreA), Number(scoreB), winnerId);
            alert("Match reported!");
            loadData(); // Refresh
        } catch (e) {
            alert("Error reporting score: " + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-rose-500 h-10 w-10" /></div>;
    if (!match) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Match not found</div>;

    const isCompleted = match.status === 'completed';

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                     <div>
                        <h1 className="text-3xl font-bold mb-2">Match Lobby</h1>
                        <p className="text-slate-400">Round {match.round} • {tournament?.name}</p>
                     </div>
                     <div className={`px-4 py-2 rounded-full font-bold uppercase tracking-wider text-sm ${isCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {isCompleted ? "Completed" : "In Progress"}
                     </div>
                </div>

                {/* Scoreboard */}
                <div className="relative bg-slate-900/50 border border-white/10 rounded-2xl p-12 mb-12 flex items-center justify-between overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-transparent to-cyan-500/10 pointer-events-none" />

                    {/* Team A */}
                    <div className="text-center z-10 w-1/3">
                        <h2 className="text-4xl font-black mb-2">{match.teamA || "TBD"}</h2>
                        <span className="text-rose-500 font-mono">TEAM A</span>
                    </div>

                    {/* VS / Score */}
                    <div className="text-center z-10 w-1/3">
                        {isCompleted ? (
                             <div className="text-6xl font-black flex items-center justify-center gap-4">
                                <span className={match.scoreA > match.scoreB ? "text-rose-500" : "text-slate-500"}>{match.scoreA}</span>
                                <span className="text-2xl text-slate-600">-</span>
                                <span className={match.scoreB > match.scoreA ? "text-cyan-500" : "text-slate-500"}>{match.scoreB}</span>
                             </div>
                        ) : (
                            <div className="text-4xl font-black text-slate-600">VS</div>
                        )}
                    </div>

                    {/* Team B */}
                    <div className="text-center z-10 w-1/3">
                         <h2 className="text-4xl font-black mb-2">{match.teamB || "TBD"}</h2>
                         <span className="text-cyan-500 font-mono">TEAM B</span>
                    </div>
                </div>

                {/* Game Controls Grid */}
                <div className="grid lg:grid-cols-2 gap-8">
                    
                    {/* Map Veto Section */}
                    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <MapIcon className="h-6 w-6 text-rose-500" />
                            <h3 className="text-xl font-bold">Map Veto</h3>
                        </div>

                        {vetoState.selectedMap ? (
                            <div className="text-center py-8">
                                <p className="text-slate-400 mb-2">Map Selected</p>
                                <p className="text-4xl font-black text-white">{vetoState.selectedMap}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-center text-sm mb-4">
                                    Current Turn: <span className="text-rose-500 font-bold uppercase">{vetoState.currentTurn}</span> to ban.
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {MAP_POOL.map(map => {
                                        const isBanned = vetoState.bannedMaps.includes(map.name);
                                        return (
                                            <button
                                                key={map.name}
                                                onClick={() => handleBanMap(map.name)}
                                                disabled={isBanned || isCompleted}
                                                className={`p-3 rounded-lg border text-sm font-bold transition-all
                                                    ${isBanned 
                                                        ? 'border-transparent bg-slate-800/50 text-slate-600 line-through' 
                                                        : 'border-white/10 bg-slate-800 hover:border-rose-500 hover:bg-rose-500/10'}
                                                `}
                                            >
                                                {map.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Admin/Score Controls */}
                    {!isCompleted && match.teamA && match.teamB && (
                        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Shield className="h-6 w-6 text-emerald-500" />
                                <h3 className="text-xl font-bold">Report Score</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Team A Score</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={scoreA}
                                            onChange={e => setScoreA(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-center font-bold text-xl focus:border-rose-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Team B Score</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={scoreB}
                                            onChange={e => setScoreB(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-center font-bold text-xl focus:border-cyan-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleReportScore}
                                    disabled={submitting}
                                    className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="animate-spin" /> : "Submit Final Score"}
                                </button>
                                <p className="text-xs text-center text-slate-500">
                                    Submitting will end the match and advance the winner. Irreversible.
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
