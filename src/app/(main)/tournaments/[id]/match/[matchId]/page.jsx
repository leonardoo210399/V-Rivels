"use client";
import { useEffect, useState, use } from "react";
import { getMatch, updateMatchScore, updateMatchVeto } from "@/lib/brackets";
import { getTournament, getRegistration } from "@/lib/tournaments";
import { client } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { Trophy, Clock, Skull, Shield, Map as MapIcon } from "lucide-react";
import Loader from "@/components/Loader";

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
    const isAdmin = user?.labels?.includes('admin');
    
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

        // Subscribe to real-time updates for this match
        const unsubscribe = client.subscribe(
            `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.matches.documents.${matchId}`,
            (response) => {
                if (response.events.some(e => e.includes('update'))) {
                    const updatedMatch = response.payload;
                    setMatch(updatedMatch);
                    if (updatedMatch.vetoData) {
                        try {
                            setVetoState(JSON.parse(updatedMatch.vetoData));
                        } catch (e) {
                            console.error("Failed to parse veto data", e);
                        }
                    }
                }
            }
        );

        return () => unsubscribe();
    }, [matchId, id]);

    const loadData = async () => {
        try {
            // Fetch match details
            const matchData = await getMatch(matchId);
            setMatch(matchData);

            if (matchData.vetoData) {
                try {
                    setVetoState(JSON.parse(matchData.vetoData));
                } catch (e) {
                    console.error("Veto data parsing failed", e);
                }
            }

            // Fetch Tournament
            const tourneyData = await getTournament(matchData.tournamentId);
            setTournament(tourneyData);
            
            // Fetch Teams
            if (matchData.teamA && matchData.teamA !== "LOBBY") {
                getRegistration(matchData.teamA).then(setTeamA).catch(console.error);
            }
            if (matchData.teamB) {
                getRegistration(matchData.teamB).then(setTeamB).catch(console.error);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleBanMap = async (mapName) => {
        // Validation: Turn check
        if (!isAdmin) {
            const isTeamATurn = vetoState.currentTurn === "teamA";
            const userRegistrationId = isTeamATurn ? match.teamA : match.teamB;
            
            // Simple check: Is the user associated with the team whose turn it is?
            // This requires the registration to have the userId
            const currentReg = isTeamATurn ? teamA : teamB;
            if (currentReg?.userId !== user?.$id) {
                alert("It's not your turn to ban!");
                return;
            }
        }

        if (vetoState.selectedMap) return;
        
        const newBanned = [...vetoState.bannedMaps, mapName];
        const newTurn = vetoState.currentTurn === "teamA" ? "teamB" : "teamA";
        
        let selected = null;
        if (newBanned.length === MAP_POOL.length - 1) {
            selected = MAP_POOL.find(m => !newBanned.includes(m.name)).name;
        }

        const newState = {
            bannedMaps: newBanned,
            currentTurn: newTurn,
            selectedMap: selected
        };

        // Persist to DB
        try {
            await updateMatchVeto(matchId, newState);
            setVetoState(newState); // Optimistic update
        } catch (e) {
            alert("Failed to save veto: " + e.message);
        }
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

    if (loading) return <Loader />;
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
                        <h2 className="text-4xl font-black mb-2 uppercase italic">{teamA?.teamName || (match.teamA ? "Loading..." : "TBD")}</h2>
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
                         <h2 className="text-4xl font-black mb-2 uppercase italic">{teamB?.teamName || (match.teamB ? "Loading..." : "TBD")}</h2>
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
                    {isAdmin && !isCompleted && match.teamA && match.teamB && (
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
                                    {submitting ? <Loader fullScreen={false} size="sm" /> : "Submit Final Score"}
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
