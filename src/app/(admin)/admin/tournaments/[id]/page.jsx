"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { 
    getTournament, 
    updateTournament, 
    deleteTournament, 
    getRegistrations, 
    updateRegistrationPaymentStatus 
} from "@/lib/tournaments";
import { 
    getMatches,
    updateMatchStatus, 
    updateParticipantScore,
    deleteMatches,
    createBracket,
    finalizeMatch
} from "@/lib/brackets";
import { 
    Trophy, 
    Users, 
    Swords, 
    Settings, 
    ChevronLeft, 
    Calendar, 
    ShieldCheck, 
    User, 
    Info, 
    Check, 
    X,
    Edit2,
    Trash2,
    ExternalLink,
    Loader as LoaderIcon,
    RotateCcw
} from "lucide-react";
import Loader from "@/components/Loader";
import Link from "next/link";

export default function TournamentControlPage({ params }) {
    const unwrappedParams = use(params);
    const { id } = unwrappedParams;
    const router = useRouter();

    const [tournament, setTournament] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState("participants");

    const [editingTournamentId, setEditingTournamentId] = useState(null);
    const [bulkEditValues, setBulkEditValues] = useState({});
    const [resetStep, setResetStep] = useState(0); 
    const [resetError, setResetError] = useState(null);
    const [startStep, setStartStep] = useState(0); 
    const [startError, setStartError] = useState(null);
    const [matchScores, setMatchScores] = useState({}); // { [matchId]: { scoreA: 0, scoreB: 0 } }

    // Edit Form State
    const [editForm, setEditForm] = useState({
        name: "",
        gameType: "5v5",
        prizePool: "",
        maxTeams: 8,
        location: "Online",
        date: ""
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [tData, regsRes, matchesRes] = await Promise.all([
                getTournament(id),
                getRegistrations(id),
                getMatches(id)
            ]);
            setTournament(tData);
            setRegistrations(regsRes.documents);
            setMatches(matchesRes);
            
            // Sync edit form with loaded data
            setEditForm({
                name: tData.name || "",
                gameType: tData.gameType || "5v5",
                prizePool: tData.prizePool || "",
                maxTeams: tData.maxTeams || 8,
                location: tData.location || "Online",
                date: tData.date ? new Date(tData.date).toISOString().split('T')[0] : ""
            });
        } catch (error) {
            console.error("Failed to load tournament data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const handleTogglePayment = async (regId, currentStatus) => {
        try {
            setUpdating(true);
            await updateRegistrationPaymentStatus(regId, !currentStatus);
            setRegistrations(prev => prev.map(reg => 
                reg.$id === regId ? { ...reg, paymentStatus: !currentStatus } : reg
            ));
        } catch (e) {
            alert("Failed to update payment: " + e.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveMatchScore = async (matchId) => {
        const scores = matchScores[matchId];
        if (!scores) {
            alert("Please enter scores first.");
            return;
        }
        
        setUpdating(true);
        try {
            await finalizeMatch(matchId, parseInt(scores.scoreA || 0), parseInt(scores.scoreB || 0));
            await loadData(); // Refresh everything
            alert("Match result saved and winner advanced!");
        } catch (e) {
            alert("Failed to save score: " + e.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateMatchStatus = async (matchId, status) => {
        setUpdating(true);
        try {
            await updateMatchStatus(matchId, status);
            
            const updatedMatches = matches.map(m => m.$id === matchId ? { ...m, status } : m);
            const allCompleted = updatedMatches.length > 0 && updatedMatches.every(m => m.status === 'completed');

            if (allCompleted) {
                await updateTournament(id, { status: 'completed' });
                setTournament(prev => ({ ...prev, status: 'completed' }));
            } else if (status === 'ongoing') {
                await updateTournament(id, { status: 'ongoing' });
                setTournament(prev => ({ ...prev, status: 'ongoing' }));
            } else if (status === 'scheduled') {
                const anyOngoing = updatedMatches.some(m => m.status === 'ongoing');
                const anyCompleted = updatedMatches.some(m => m.status === 'completed');
                const newStatus = anyOngoing || anyCompleted ? 'ongoing' : 'open';
                await updateTournament(id, { status: newStatus });
                setTournament(prev => ({ ...prev, status: newStatus }));
            }

            setMatches(updatedMatches);
        } catch (e) {
            alert("Failed to update status: " + e.message);
        } finally {
            setUpdating(false);
        }
    };

    const parseMetadata = (metadata) => {
        try {
            return typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
        } catch (e) {
            return null;
        }
    };

    const startBulkEdit = () => {
        const initialValues = {};
        registrations.forEach(reg => {
            const meta = parseMetadata(reg.metadata);
            initialValues[reg.$id] = {
                kills: meta?.kills || 0,
                deaths: meta?.deaths || 0
            };
        });
        setBulkEditValues(initialValues);
        setEditingTournamentId(id);
    };

    const handleBulkUpdateScores = async () => {
        setUpdating(true);
        try {
            await Promise.all(
                Object.entries(bulkEditValues).map(([regId, values]) => 
                    updateParticipantScore(regId, values.kills, values.deaths)
                )
            );
            
            setRegistrations(prev => prev.map(reg => {
                const newValues = bulkEditValues[reg.$id];
                if (!newValues) return reg;
                
                const meta = parseMetadata(reg.metadata) || {};
                return {
                    ...reg,
                    metadata: JSON.stringify({ ...meta, kills: newValues.kills, deaths: newValues.deaths })
                };
            }));

            setEditingTournamentId(null);
            setBulkEditValues({});
        } catch (e) {
            alert("Failed to update scores: " + e.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveSettings = async (e) => {
        if (e) e.preventDefault();
        setUpdating(true);
        try {
            await updateTournament(id, editForm);
            setTournament(prev => ({ ...prev, ...editForm }));
            alert("Tournament updated successfully!");
        } catch (e) {
            alert("Failed to update tournament: " + e.message);
        } finally {
            setUpdating(false);
        }
    };

    const [deleteStep, setDeleteStep] = useState(0); 
    const [deleteError, setDeleteError] = useState(null);

    const handleDelete = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (deleteStep === 0) {
            setDeleteStep(1);
            setTimeout(() => setDeleteStep(0), 3000);
            return;
        }
        
        setDeleteStep(2);
        setDeleteError(null);
        setUpdating(true);

        try {
            await deleteTournament(id);
            router.replace("/admin/tournaments");
        } catch (error) {
            setDeleteError(error.message);
            setDeleteStep(0);
            setUpdating(false);
        }
    };

    const handleStartTournament = async () => {
        if (tournament.bracketGenerated || matches.length > 0) {
            alert("Bracket already exists. Reset it first if you want to regenerate.");
            return;
        }

        if (startStep === 0) {
            setStartStep(1);
            setTimeout(() => setStartStep(0), 3000);
            return;
        }

        setStartStep(2);
        setStartError(null);
        setUpdating(true);
        
        try {
            await createBracket(id, registrations, tournament.gameType);
            await updateTournament(id, { bracketGenerated: true, status: 'ongoing' });
            
            // Reload data to show matches
            await loadData();
            setStartStep(0);
        } catch (e) {
            console.error("Start failed", e);
            setStartError(e.message);
            setStartStep(0);
        } finally {
            setUpdating(false);
        }
    };

    const handleResetBracket = async () => {
        if (resetStep === 0) {
            setResetStep(1);
            setTimeout(() => setResetStep(0), 3000); // Reset confirmation state after 3 seconds
            return;
        }

        setResetStep(2); // Loading state
        setResetError(null);
        setUpdating(true);
        
        try {
            await deleteMatches(id);
            await updateTournament(id, { bracketGenerated: false, status: 'open' });
            await loadData();
            setResetStep(0);
        } catch (e) {
            console.error("Reset failed", e);
            setResetError(e.message);
            setResetStep(0);
        } finally {
            setUpdating(false);
        }
    };

    const participantMap = registrations?.reduce((acc, r) => {
        acc[r.$id] = r.teamName ? { name: r.teamName } : (
            r.metadata ? { name: parseMetadata(r.metadata)?.playerName || "Unknown" } : { name: "Player" }
        );
        return acc;
    }, {}) || {};

    if (loading) return <Loader />;
    if (!tournament) return <div className="p-8 text-center text-white">Tournament not found</div>;

    const is5v5 = tournament.gameType === "5v5";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col gap-6">
                <button 
                    onClick={() => router.push("/admin/tournaments")}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all group w-fit"
                >
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to All Tournaments
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-rose-600 rounded-2xl shadow-lg shadow-rose-900/20">
                            <Trophy className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black uppercase text-white tracking-tight">{tournament.name}</h1>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                    (tournament.status || 'open') === 'open' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                                    tournament.status === 'ongoing' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse' :
                                    'bg-slate-800 text-slate-400 border border-white/5'
                                }`}>
                                    {tournament.status || 'open'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-black">
                                    <Swords className="h-3.5 w-3.5 text-rose-500" />
                                    {tournament.gameType}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-800" />
                                <span className="flex items-center gap-1.5" suppressHydrationWarning>
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(tournament.date).toLocaleDateString()}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-800" />
                                <span className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    {registrations.length} / {tournament.maxTeams} Entries
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                         <Link 
                            href={`/tournaments/${id}`}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View Public Page
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="space-y-6">
                <div className="flex items-center gap-1 p-1 bg-slate-900/50 border border-white/5 w-fit rounded-2xl backdrop-blur-sm">
                    {[
                        { id: "participants", label: "Participants", icon: Users },
                        { id: "matches", label: "Match Control", icon: Swords },
                        { id: "settings", label: "Settings", icon: Settings },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id 
                                ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20" 
                                : "text-slate-500 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="animate-in fade-in duration-300">
                    {activeTab === "participants" && (
                        <div className="grid gap-4">
                            {registrations.length === 0 ? (
                                <div className="bg-slate-950/30 border border-white/5 border-dashed rounded-3xl p-12 text-center">
                                    <div className="p-4 bg-slate-900 rounded-full w-fit mx-auto mb-4">
                                        <Users className="h-8 w-8 text-slate-700" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-500 uppercase tracking-widest">No Registrations Yet</h3>
                                    <p className="text-sm text-slate-600 mt-2">When players sign up, they will appear here.</p>
                                </div>
                            ) : (
                                registrations.map((reg) => {
                                    const meta = parseMetadata(reg.metadata);
                                    return (
                                        <div key={reg.$id} className="bg-slate-950/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm group hover:border-rose-500/20 transition-all">
                                            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 text-rose-500">
                                                        {is5v5 ? <Users className="h-6 w-6" /> : <User className="h-6 w-6" />}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white tracking-tight mb-1">
                                                            {is5v5 ? reg.teamName : (meta?.playerName || reg.teamName)}
                                                        </h3>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-2" suppressHydrationWarning>
                                                            <Calendar className="h-3 w-3" />
                                                            Registered {new Date(reg.registeredAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    {!is5v5 && (
                                                        <div className="flex items-center gap-6 mr-6 border-r border-white/5 pr-6">
                                                            <div className="text-center">
                                                                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Kills</p>
                                                                <p className="text-xl font-black text-white italic">{meta?.kills || 0}</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Deaths</p>
                                                                <p className="text-xl font-black text-slate-600 italic">{meta?.deaths || 0}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <button 
                                                        onClick={() => handleTogglePayment(reg.$id, reg.paymentStatus)}
                                                        disabled={updating}
                                                        className={`px-6 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                                                            reg.paymentStatus 
                                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20' 
                                                                : 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
                                                        }`}
                                                    >
                                                        {reg.paymentStatus ? 'Entry Paid' : 'Entry Pending'}
                                                    </button>
                                                </div>
                                            </div>

                                            {is5v5 && (
                                                <div className="bg-slate-950/30 border-t border-white/5 p-6 pb-8">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Verified Roster</h4>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                                        {meta?.members?.map((m, i) => (
                                                            <div key={i} className="flex flex-col p-3 bg-slate-900/50 rounded-xl border border-white/5 transition-all hover:border-rose-500/30">
                                                                <span className="text-[10px] text-slate-600 font-bold uppercase mb-1">Member {i+1}</span>
                                                                <span className="text-xs font-bold text-white truncate">{m.name}</span>
                                                                <span className="text-[10px] text-rose-500 font-mono italic">#{m.tag}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}

                    {activeTab === "matches" && (
                        <div className="space-y-6">
                            <div className="bg-slate-950/30 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
                                            <Swords className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Match Control Overview</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Manage statuses and player performances</p>
                                        </div>
                                    </div>

                                    {!is5v5 && matches.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            {editingTournamentId === id ? (
                                                <>
                                                    <button 
                                                        onClick={handleBulkUpdateScores}
                                                        disabled={updating}
                                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                                                    >
                                                        {updating ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                        Save Scores
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingTournamentId(null)}
                                                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-all"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={startBulkEdit}
                                                    disabled={updating}
                                                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-600/20"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                    Bulk Edit Scores
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {matches.length > 0 && (
                                        <div className="flex flex-col items-end gap-1">
                                            <button 
                                                onClick={handleResetBracket}
                                                disabled={updating || resetStep === 2}
                                                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl shadow-lg ${
                                                    resetStep === 1 
                                                        ? 'bg-amber-500 text-slate-950 animate-pulse' 
                                                        : resetStep === 2
                                                        ? 'bg-slate-900 text-slate-600'
                                                        : 'text-slate-500 hover:text-rose-500 hover:bg-rose-500/5 bg-slate-950 border border-white/5'
                                                }`}
                                                title="Reset Bracket"
                                            >
                                                {resetStep === 0 && <><RotateCcw className="h-4 w-4" /> Reset Matches</>}
                                                {resetStep === 1 && <><Info className="h-4 w-4" /> Click to Confirm Reset</>}
                                                {resetStep === 2 && <LoaderIcon className="h-4 w-4 animate-spin" />}
                                            </button>
                                            {resetError && <p className="text-[8px] text-rose-500 font-bold uppercase">{resetError}</p>}
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-6">
                                    {matches.length === 0 ? (
                                        <div className="py-20 text-center bg-slate-900/20 border border-dashed border-white/5 rounded-3xl">
                                            <div className="p-6 bg-slate-900 rounded-full w-fit mx-auto mb-6 border border-white/5">
                                                <Trophy className="h-10 w-10 text-slate-700" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2">No active matches found</h3>
                                            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8">
                                                To begin management, you first need to generate the bracket or standings for this tournament.
                                            </p>
                                            
                                            <button 
                                                onClick={handleStartTournament}
                                                disabled={updating || registrations.length < 2 || startStep === 2}
                                                className={`flex items-center gap-3 px-8 py-4 text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl mx-auto ${
                                                    startStep === 1 
                                                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                                                        : startStep === 2
                                                        ? 'bg-slate-900 text-slate-600'
                                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
                                                } disabled:opacity-30`}
                                            >
                                                {startStep === 2 ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
                                                {startStep === 0 && (tournament.gameType === 'Deathmatch' ? 'Start Standings' : 'Generate Bracket')}
                                                {startStep === 1 && 'Click to Confirm Start'}
                                            </button>
                                            
                                            {startError && <p className="mt-4 text-[10px] text-rose-500 font-bold uppercase tracking-widest">{startError}</p>}

                                            {registrations.length < 2 && (
                                                <p className="mt-4 text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                                                    Need at least 2 participants to start
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 border-b border-white/5 pb-2">Active Matches</h4>
                                            <div className="grid gap-3">
                                                {matches.map(match => (
                                                    <div key={match.$id} className="flex flex-col p-4 bg-slate-900/50 border border-white/5 rounded-2xl group hover:border-rose-500/10 transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center text-rose-500 font-black text-xs italic border border-white/5">
                                                                    {match.teamA === 'LOBBY' ? 'L' : `R${match.round}`}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-white uppercase tracking-tight">
                                                                        {match.teamA === 'LOBBY' ? 'Main Lobby Match' : (
                                                                            <span className="flex items-center gap-2">
                                                                                <span className="text-rose-500">{participantMap[match.teamA]?.name || 'TBD'}</span>
                                                                                <span className="text-slate-600 opacity-40">VS</span>
                                                                                <span className="text-rose-500">{participantMap[match.teamB]?.name || 'TBD'}</span>
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-600 font-black uppercase">
                                                                        ID: {match.$id.substring(0, 8)}...
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-4">
                                                                <div className="flex flex-col items-end gap-1 mr-4">
                                                                    <p className="text-[8px] font-black text-slate-700 uppercase tracking-tighter">Current Status</p>
                                                                    <div className={`text-[10px] font-bold uppercase tracking-widest ${
                                                                        match.status === 'completed' ? 'text-emerald-500' : 
                                                                        match.status === 'ongoing' ? 'text-amber-500 animate-pulse' : 'text-slate-500'
                                                                    }`}>
                                                                        {match.status}
                                                                    </div>
                                                                </div>
                                                                <select 
                                                                    value={match.status}
                                                                    onChange={(e) => handleUpdateMatchStatus(match.$id, e.target.value)}
                                                                    disabled={updating}
                                                                    className="bg-slate-950 text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-rose-500 cursor-pointer hover:bg-slate-900 transition-colors shadow-xl"
                                                                >
                                                                    <option value="scheduled">Scheduled</option>
                                                                    <option value="ongoing">Ongoing (Live)</option>
                                                                    <option value="completed">Completed</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* Score Entry Row for 5v5 Bracket Matches */}
                                                        {is5v5 && match.teamA !== 'LOBBY' && match.status !== 'completed' && (
                                                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-4 flex-1">
                                                                    <div className="flex flex-col gap-1 flex-1">
                                                                        <label className="text-[8px] font-black uppercase text-slate-500 ml-1">
                                                                            {participantMap[match.teamA]?.name || 'TBD'} Score
                                                                        </label>
                                                                        <input 
                                                                            type="number"
                                                                            placeholder="0"
                                                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white font-bold text-xs focus:border-rose-500 outline-none transition-all"
                                                                            value={matchScores[match.$id]?.scoreA ?? match.scoreA ?? 0}
                                                                            onChange={(e) => setMatchScores({
                                                                                ...matchScores,
                                                                                [match.$id]: { ...matchScores[match.$id], scoreA: e.target.value, scoreB: matchScores[match.$id]?.scoreB ?? match.scoreB ?? 0 }
                                                                            })}
                                                                        />
                                                                    </div>
                                                                    <div className="text-slate-700 font-black text-xs mt-4">VS</div>
                                                                    <div className="flex flex-col gap-1 flex-1">
                                                                        <label className="text-[8px] font-black uppercase text-slate-500 ml-1">
                                                                            {participantMap[match.teamB]?.name || 'TBD'} Score
                                                                        </label>
                                                                        <input 
                                                                            type="number"
                                                                            placeholder="0"
                                                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white font-bold text-xs focus:border-rose-500 outline-none transition-all"
                                                                            value={matchScores[match.$id]?.scoreB ?? match.scoreB ?? 0}
                                                                            onChange={(e) => setMatchScores({
                                                                                ...matchScores,
                                                                                [match.$id]: { ...matchScores[match.$id], scoreB: e.target.value, scoreA: matchScores[match.$id]?.scoreA ?? match.scoreA ?? 0 }
                                                                            })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button 
                                                                    onClick={() => handleSaveMatchScore(match.$id)}
                                                                    disabled={updating || !match.teamA || !match.teamB}
                                                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-30"
                                                                >
                                                                    Save Result
                                                                </button>
                                                            </div>
                                                        )}

                                                        {match.status === 'completed' && match.teamA !== 'LOBBY' && (
                                                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-12 text-slate-400">
                                                                <div className="flex flex-col items-center">
                                                                    <span className="text-[8px] font-black uppercase opacity-40">Final Score</span>
                                                                    <span className="text-xl font-black italic">
                                                                        <span className={match.winner === match.teamA ? 'text-emerald-500' : ''}>{match.scoreA}</span>
                                                                        <span className="mx-3 opacity-20">-</span>
                                                                        <span className={match.winner === match.teamB ? 'text-emerald-500' : ''}>{match.scoreB}</span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!is5v5 && editingTournamentId === id && (
                                        <div className="mt-8 border-t border-white/5 pt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {registrations.map(reg => (
                                                <div key={reg.$id} className="p-4 bg-slate-950 rounded-2xl border border-rose-500/20 shadow-lg shadow-rose-900/10">
                                                    <p className="text-xs font-bold text-white mb-4 truncate">{(parseMetadata(reg.metadata)?.playerName || reg.teamName)}</p>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase text-slate-500">Kills</label>
                                                            <input 
                                                                type="number"
                                                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white font-bold focus:border-rose-500 outline-none transition-all"
                                                                value={bulkEditValues[reg.$id]?.kills || 0}
                                                                onChange={(e) => setBulkEditValues({
                                                                    ...bulkEditValues,
                                                                    [reg.$id]: { ...bulkEditValues[reg.$id], kills: parseInt(e.target.value) || 0 }
                                                                })}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase text-slate-500">Deaths</label>
                                                            <input 
                                                                type="number"
                                                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white font-bold focus:border-rose-500 outline-none transition-all"
                                                                value={bulkEditValues[reg.$id]?.deaths || 0}
                                                                onChange={(e) => setBulkEditValues({
                                                                    ...bulkEditValues,
                                                                    [reg.$id]: { ...bulkEditValues[reg.$id], deaths: parseInt(e.target.value) || 0 }
                                                                })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "settings" && (
                        <div className="space-y-6">
                            <div className="bg-slate-950/30 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
                                        <Edit2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Edit Tournament Details</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Modify the core information of your event</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Event Name</label>
                                            <input 
                                                type="text"
                                                required
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:border-rose-500 outline-none transition-all placeholder:text-slate-700"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Game Mode</label>
                                            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900/50 border border-white/5 rounded-2xl">
                                                {['5v5', 'Deathmatch'].map(mode => (
                                                    <button
                                                        key={mode}
                                                        type="button"
                                                        onClick={() => setEditForm({...editForm, gameType: mode})}
                                                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                            editForm.gameType === mode 
                                                            ? 'bg-rose-600 text-white shadow-lg' 
                                                            : 'text-slate-500 hover:text-white'
                                                        }`}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Prize Pool</label>
                                                <input 
                                                    type="text"
                                                    value={editForm.prizePool}
                                                    onChange={(e) => setEditForm({...editForm, prizePool: e.target.value})}
                                                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3 text-white font-bold focus:border-rose-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Max Entries</label>
                                                <input 
                                                    type="number"
                                                    value={editForm.maxTeams}
                                                    onChange={(e) => setEditForm({...editForm, maxTeams: parseInt(e.target.value)})}
                                                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3 text-white font-bold focus:border-rose-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Location</label>
                                            <input 
                                                type="text"
                                                value={editForm.location}
                                                onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:border-rose-500 outline-none transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Event Date</label>
                                            <input 
                                                type="date"
                                                value={editForm.date}
                                                onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:border-rose-500 outline-none transition-all [color-scheme:dark]"
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <button 
                                                type="submit"
                                                disabled={updating}
                                                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] py-5 rounded-2xl transition-all shadow-xl disabled:opacity-50"
                                            >
                                                {updating ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Save Tournament Settings</>}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="bg-slate-950/30 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                                    <h3 className="text-lg font-black uppercase tracking-tight text-white mb-6">Danger Zone</h3>
                                    <div className="space-y-6">
                                        <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                                            <h4 className="text-sm font-bold text-rose-500 mb-2">Delete Tournament</h4>
                                            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                                                Permanent deletion of this tournament, including all registrations, matches, and metadata. This action cannot be undone.
                                            </p>
                                            <div className="space-y-4">
                                                <button 
                                                    onClick={handleDelete}
                                                    type="button"
                                                    disabled={deleteStep === 2}
                                                    className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg min-w-[200px] ${
                                                        deleteStep === 1 
                                                        ? 'bg-amber-500 text-slate-950 shadow-amber-900/20 animate-pulse' 
                                                        : deleteStep === 2
                                                        ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-white/5'
                                                        : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-900/20'
                                                    }`}
                                                >
                                                    {deleteStep === 0 && <><Trash2 className="h-4 w-4" /> Delete Event</>}
                                                    {deleteStep === 1 && <><Info className="h-4 w-4" /> Click Again to Confirm</>}
                                                    {deleteStep === 2 && <LoaderIcon className="h-4 w-4 animate-spin" />}
                                                </button>

                                                {deleteError && (
                                                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-bold flex items-center gap-2">
                                                        <X className="h-4 w-4" />
                                                        {deleteError}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950/30 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                                    <h3 className="text-lg font-black uppercase tracking-tight text-white mb-6">Global Info</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Database ID</p>
                                            <div className="p-3 bg-slate-900 rounded-xl border border-white/5 text-xs text-slate-400 font-mono">
                                                {id}
                                            </div>
                                        </div>
                                        <div className="space-y-2 pt-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Quick Stats</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                                                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Prize Pool</p>
                                                    <p className="text-xl font-black text-white italic">{tournament.prizePool}</p>
                                                </div>
                                                <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                                                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Location</p>
                                                    <p className="text-xl font-black text-white italic truncate">{tournament.location || "Online"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
