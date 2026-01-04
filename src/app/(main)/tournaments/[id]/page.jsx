"use client";
import { useEffect, useState, use } from "react";
import { getTournament, registerForTournament, getRegistrations, deleteTournament, checkInForTournament } from "@/lib/tournaments";
import { getMatches } from "@/lib/brackets";
import TournamentBracket from "@/components/TournamentBracket";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile } from "@/lib/users";
import { getAccount } from "@/lib/valorant";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, Trophy, Users, AlertCircle, CheckCircle, Trash2, UserCheck, UserX, ShieldCheck } from "lucide-react";

export default function TournamentDetailPage({ params }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  
  const [tournament, setTournament] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState([
    { name: "", tag: "", verified: false, loading: false },
    { name: "", tag: "", verified: false, loading: false },
    { name: "", tag: "", verified: false, loading: false },
    { name: "", tag: "", verified: false, loading: false },
    { name: "", tag: "", verified: false, loading: false },
  ]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Helper to create a map of ID -> Participant Name
  const participantMap = registrations ? registrations.reduce((acc, r) => {
      acc[r.$id] = r.teamName ? { name: r.teamName } : (
          r.metadata ? { name: JSON.parse(r.metadata).playerName || "Unknown" } : { name: "Player" }
      );
      return acc;
  }, {}) : {};


  useEffect(() => {
    async function loadData() {
      try {
        const [tData, regs, matchData] = await Promise.all([
            getTournament(id),
            getRegistrations(id),
            getMatches(id)
        ]);
        setTournament(tData);
        setRegistrations(regs.documents);
        setMatches(matchData);

        if (user) {
            const profile = await getUserProfile(user.$id);
            setUserProfile(profile);
        }
      } catch (error) {
        console.error("Failed to load tournament", error);
         // Demo Fallback
        setTournament({
             $id: id,
             name: "Demo Tournament",
             date: new Date(Date.now() + 86400000).toISOString(),
             prizePool: "$1,000",
             maxTeams: 16,
             gameType: "5v5",
             status: "open",
             description: "This is a demo tournament description since we couldn't connect to the database."
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, user]);

  const verifyMember = async (index) => {
    const member = members[index];
    if (!member.name || !member.tag) return;
    
    const newMembers = [...members];
    newMembers[index].loading = true;
    setMembers(newMembers);
    
    try {
        // Tag needs to be handled without the # if the input includes it, or just pass it as is.
        // Usually its Name + Tag (e.g. TenZ #NA1)
        const cleanTag = member.tag.startsWith("#") ? member.tag.substring(1) : member.tag;
        await getAccount(member.name, cleanTag);
        newMembers[index].verified = true;
        newMembers[index].tag = cleanTag; // Normalize tag
    } catch (err) {
        alert(`Account ${member.name}#${member.tag} not found!`);
        newMembers[index].verified = false;
    } finally {
        newMembers[index].loading = false;
        setMembers([...newMembers]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (tournament.gameType === "5v5") {
        if (!teamName) {
            setError("Team name is required");
            return;
        }
        const unverified = members.find(m => !m.verified);
        if (unverified) {
            setError("Please verify all team members first");
            return;
        }

        // Check for duplicate players
        const uniqueTags = new Set(members.map(m => `${m.name.toLowerCase()}#${m.tag.toLowerCase()}`));
        if (uniqueTags.size !== members.length) {
            setError("All team members must be unique.");
            return;
        }
    } else if (!userProfile) {
        setError("Please link your Valorant account in your profile first to register for DM.");
        return;
    }

    setRegistering(true);
    setError(null);
    try {
        const metadata = {
            members: tournament.gameType === "5v5" ? members.map(m => ({ name: m.name, tag: m.tag })) : null,
            playerName: tournament.gameType !== "5v5" ? `${userProfile.ingameName}#${userProfile.tag}` : null
        };

        await registerForTournament(id, user.$id, tournament.gameType === "5v5" ? teamName : userProfile.ingameName, { metadata: JSON.stringify(metadata) });
        setSuccess(true);
        // Refresh registrations
        const regs = await getRegistrations(id);
        setRegistrations(regs.documents);
    } catch (err) {
        setError(err.message);
    } finally {
        setRegistering(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to delete this tournament? This action cannot be undone.")) return;
    
    setDeleting(true);
    try {
        await deleteTournament(id);
        router.push("/tournaments");
    } catch (err) {
        console.error("Failed to delete tournament", err);
        alert("Failed to delete tournament");
        setDeleting(false);
    }
  };

  if (loading) {
     return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!tournament) return <div className="p-8 text-center text-white">Tournament not found</div>;

  const userRegistration = registrations.find(r => r.userId === user?.$id);
  const isRegistered = !!userRegistration;
  const isCheckedIn = userRegistration?.checkedIn;
  const isFull = registrations.length >= tournament.maxTeams;

  const handleCheckIn = async () => {
      setCheckingIn(true);
      try {
          await checkInForTournament(userRegistration.$id);
          // Refresh data
          const regs = await getRegistrations(id);
          setRegistrations(regs.documents);
      } catch (e) {
          alert("Check-in failed: " + e.message);
      } finally {
          setCheckingIn(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${(tournament.status || 'open') === 'open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                            {tournament.status || 'open'}
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-white">{tournament.name}</h1>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                     <div className="flex items-center gap-2 text-amber-400">
                        <Trophy className="h-5 w-5" />
                        <span className="text-xl font-bold">{tournament.prizePool}</span>
                    </div>
                    {isAdmin && (
                        <div className="flex flex-col gap-2 mt-2">
                             {(matches.length === 0 && registrations.length >= 2) && (
                                <button 
                                    onClick={async () => {
                                        if (!confirm("Generate bracket and start tournament? usage: Ensure 'matches' collection exists.")) return;
                                        setLoading(true);
                                        try {
                                            const { createBracket } = await import("@/lib/brackets");
                                            await createBracket(id, registrations);
                                            alert("Tournament started! Bracket generated.");
                                            window.location.reload();
                                        } catch (e) {
                                            console.error(e);
                                            alert("Failed to start: " + e.message);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                                >
                                    <Trophy className="h-3 w-3" />
                                    Start Tournament
                                </button>
                             )}
                            <button 
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex items-center gap-2 rounded-md bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                            >
                                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                Delete Tournament
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-8 grid gap-4 rounded-xl bg-slate-950/50 p-6 md:grid-cols-3">
                 <div className="flex items-center gap-3 text-slate-300">
                    <Calendar className="h-5 w-5 text-rose-500" />
                    <div suppressHydrationWarning>
                        <p className="text-xs text-slate-500">Date</p>
                        <p className="font-medium">{new Date(tournament.date).toLocaleDateString()} {new Date(tournament.date).toLocaleTimeString()}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 text-slate-300">
                    <Users className="h-5 w-5 text-rose-500" />
                    <div>
                        <p className="text-xs text-slate-500">Teams</p>
                        <p className="font-medium">{registrations.length} / {tournament.maxTeams}</p>
                    </div>
                </div>
            </div>

            <div className="mb-6 flex gap-4 border-b border-white/10">
                <button 
                    onClick={() => setActiveTab("overview")}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === "overview" ? "border-b-2 border-rose-500 text-white" : "text-slate-500 hover:text-white"}`}
                >
                    Overview
                </button>
                <button 
                    onClick={() => setActiveTab("brackets")}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === "brackets" ? "border-b-2 border-rose-500 text-white" : "text-slate-500 hover:text-white"}`}
                >
                    Brackets
                </button>
            </div>

            {activeTab === "overview" && (
                <div className="mb-8 space-y-4 text-slate-300">
                    <h2 className="text-xl font-semibold text-white">About</h2>
                    <p>{tournament.description || "Compete against the best teams in this exciting tournament."}</p>
                </div>
            )}

            {activeTab === "brackets" && (
                <div className="mb-8">
                    <TournamentBracket matches={matches} participants={participantMap} />
                </div>
            )}


            <div className="border-t border-white/10 pt-8">
                <h2 className="mb-6 text-xl font-semibold text-white">Registration</h2>
                
                {!user ? (
                    <div className="text-center">
                        <p className="mb-4 text-slate-400">Please sign in to register for this tournament.</p>
                        {/* Link to login would go here */}
                    </div>
                ) : isRegistered ? (
                    <div className="flex flex-col gap-4">
                        <div className={`flex items-center gap-2 rounded-md p-4 border ${isCheckedIn ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                            {isCheckedIn ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            <span className="font-bold">{isCheckedIn ? "You are checked in and ready!" : "Registration confirmed. Please check in to play."}</span>
                        </div>
                        
                        {!isCheckedIn && (
                            <button 
                                onClick={handleCheckIn}
                                disabled={checkingIn}
                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                            >
                                {checkingIn ? <Loader2 className="h-5 w-5 animate-spin" /> : "Check In Now"}
                            </button>
                        )}
                    </div>
                ) : isFull ? (
                     <div className="flex items-center gap-2 rounded-md bg-rose-500/10 p-4 text-rose-500">
                        <AlertCircle className="h-5 w-5" />
                        <span>Registration is full.</span>
                    </div>
                ) : (tournament.status || 'open') !== 'open' ? (
                     <div className="flex items-center gap-2 rounded-md bg-slate-500/10 p-4 text-slate-500">
                        <AlertCircle className="h-5 w-5" />
                        <span>Registration is closed.</span>
                    </div>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-6">
                        {success ? (
                             <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-4 text-emerald-500 font-bold border border-emerald-500/20">
                                <CheckCircle className="h-5 w-5" />
                                <span>Registration successful! Good luck.</span>
                            </div>
                        ) : (
                            <>
                                {tournament.gameType === "5v5" ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-slate-400 uppercase tracking-wider">Team Name</label>
                                            <input 
                                                type="text" 
                                                value={teamName}
                                                onChange={(e) => setTeamName(e.target.value)}
                                                className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-rose-500 focus:outline-none transition-all"
                                                placeholder="Enter your team name"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Team Members (5)</label>
                                            {members.map((member, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Name" 
                                                        value={member.name}
                                                        onChange={(e) => {
                                                            const n = [...members];
                                                            n[index].name = e.target.value;
                                                            n[index].verified = false;
                                                            setMembers(n);
                                                        }}
                                                        className="flex-1 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
                                                        required
                                                    />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Tag" 
                                                        value={member.tag}
                                                        onChange={(e) => {
                                                            const n = [...members];
                                                            n[index].tag = e.target.value;
                                                            n[index].verified = false;
                                                            setMembers(n);
                                                        }}
                                                        className="w-20 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => verifyMember(index)}
                                                        disabled={member.loading || !member.name || !member.tag}
                                                        className={`flex items-center justify-center rounded-md px-3 py-2 transition-all ${
                                                            member.verified 
                                                            ? "bg-emerald-500/20 text-emerald-500 cursor-default" 
                                                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                                                        }`}
                                                    >
                                                        {member.loading ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : member.verified ? (
                                                            <ShieldCheck className="h-4 w-4" />
                                                        ) : (
                                                            <UserCheck className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl bg-slate-950/50 border border-white/5 p-6 text-center space-y-4">
                                        <p className="text-slate-400">You are registering as an individual for this <strong>{tournament.gameType}</strong> tournament.</p>
                                        {userProfile ? (
                                            <div className="inline-flex items-center gap-3 rounded-full bg-rose-500/10 px-6 py-2 border border-rose-500/20">
                                                <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                                <span className="font-bold text-white tracking-wide">{userProfile.ingameName} <span className="text-slate-500">#{userProfile.tag}</span></span>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-rose-400 font-bold uppercase tracking-widest">No Linked Account Found</p>
                                        )}
                                    </div>
                                )}
                                {error && <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md border border-red-500/20">{error}</p>}
                                <button 
                                    type="submit" 
                                    disabled={registering || (tournament.gameType === "5v5" && members.some(m => !m.verified))}
                                    className="flex w-full items-center justify-center rounded-lg bg-rose-600 py-4 font-bold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 hover:translate-y-[-2px] active:translate-y-[0] transition-all disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {registering ? <Loader2 className="h-6 w-6 animate-spin"/> : tournament.gameType === "5v5" ? "Register Team" : "Confirm Entry"}
                                </button>
                            </>
                        )}
                    </form>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
