"use client";
import { useEffect, useState, use } from "react";
import { getTournament, registerForTournament, getRegistrations, deleteTournament, checkInForTournament } from "@/lib/tournaments";
import { getMatches } from "@/lib/brackets";
import TournamentBracket from "@/components/TournamentBracket";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile } from "@/lib/users";
import { getAccount } from "@/lib/valorant";
import { useRouter } from "next/navigation";
import { Calendar, Trophy, Users, AlertCircle, CheckCircle, Trash2, UserCheck, UserX, ShieldCheck, ChevronLeft, ExternalLink } from "lucide-react";
import Loader from "@/components/Loader";
import DeathmatchStandings from "@/components/DeathmatchStandings";
import { updateTournament } from "@/lib/tournaments";

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
    const parseMetadata = (metadata) => {
        try {
            return typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
        } catch (e) {
            return null;
        }
    };

    const participantMap = registrations ? registrations.reduce((acc, r) => {
        acc[r.$id] = r.teamName ? { name: r.teamName } : (
            r.metadata ? { name: parseMetadata(r.metadata)?.playerName || "Unknown" } : { name: "Player" }
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
     return <Loader />;
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
    <div className="min-h-screen bg-slate-950">
      {/* Hero Header */}
      <section className="relative h-[45vh] min-h-[400px] w-full overflow-hidden border-b border-white/5 pt-16">
        <div className="absolute inset-0 z-0">
           <img 
            src="/hero-bg.png" 
            alt="Hero Background" 
            className="h-full w-full object-cover opacity-40 scale-105 transition-transform duration-700 hover:scale-100"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
           <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />
        </div>
        
        <div className="container relative z-20 mx-auto flex h-full flex-col justify-end px-6 pb-12 sm:pb-16">
            <div className="max-w-4xl space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md ${
                        (tournament.status || 'open') === 'open' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                        tournament.status === 'ongoing' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse shadow-amber-500/20' :
                        tournament.status === 'completed' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${
                             (tournament.status || 'open') === 'open' ? 'bg-emerald-400' :
                             tournament.status === 'ongoing' ? 'bg-amber-400' :
                             tournament.status === 'completed' ? 'bg-rose-400' : 'bg-slate-400'
                        }`} />
                        {tournament.status || 'open'}
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-rose-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 border border-rose-500/30 shadow-lg backdrop-blur-md">
                        <Trophy className="h-3 w-3" />
                        {tournament.gameType}
                    </div>

                    {tournament.bracketGenerated && (
                        <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 border border-emerald-500/30 shadow-lg backdrop-blur-md">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Bracket Live
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-rose-500/80 pl-1">Tournament Entry</p>
                    <h1 className="special-font text-6xl md:text-8xl lg:text-9xl font-black uppercase text-white leading-[0.85] tracking-tighter filter drop-shadow-2xl">
                        {tournament.name}
                    </h1>
                </div>
            </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12 relative -mt-10 z-30">
        <button 
          onClick={() => router.back()}
          className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-all group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Tournaments
        </button>
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur-xl">
                <div className="mb-8 flex gap-4 border-b border-white/10">
                    <button 
                        onClick={() => setActiveTab("overview")}
                        className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === "overview" ? "border-b-2 border-rose-500 text-white" : "text-slate-500 hover:text-white"}`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab("brackets")}
                        className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === "brackets" ? "border-b-2 border-rose-500 text-white" : "text-slate-500 hover:text-white"}`}
                    >
                        {tournament.gameType === 'Deathmatch' ? 'Standings' : 'Brackets'}
                    </button>
                    <button 
                        onClick={() => setActiveTab("participants")}
                        className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === "participants" ? "border-b-2 border-rose-500 text-white" : "text-slate-500 hover:text-white"}`}
                    >
                        Participants
                    </button>
                </div>

                {activeTab === "overview" && (
                    <div className="space-y-12 text-slate-300">
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-rose-500" />
                                Tournament Brief
                            </h2>
                            <p className="leading-relaxed text-sm opacity-80">
                                {tournament.description || "Compete against the best teams in this exciting tournament. Prove your skills and climb the rankings."}
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-8 border-t border-white/5 pt-8">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Event Format</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-sm opacity-70 hover:opacity-100 transition-opacity">
                                        <div className="h-1 w-1 rounded-full bg-rose-500" />
                                        {tournament.gameType === 'Deathmatch' ? 'Free-for-all (FFA)' : 'Single Elimination'}
                                    </li>
                                    <li className="flex items-center gap-3 text-sm opacity-70 hover:opacity-100 transition-opacity">
                                        <div className="h-1 w-1 rounded-full bg-rose-500" />
                                        {tournament.gameType === 'Deathmatch' ? 'Score limit: 40 kills' : 'Initial rounds: BO1'}
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Quick Rules</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-sm opacity-70 hover:opacity-100 transition-opacity">
                                        <div className="h-1 w-1 rounded-full bg-rose-500" />
                                        Be present 15m before start
                                    </li>
                                    <li className="flex items-center gap-3 text-sm opacity-70 hover:opacity-100 transition-opacity">
                                        <div className="h-1 w-1 rounded-full bg-rose-500" />
                                        Good sportsmanship is required
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "brackets" && (
                    <div className="animate-in fade-in duration-500">
                        {tournament.bracketGenerated ? (
                            tournament.gameType === 'Deathmatch' ? (
                                <DeathmatchStandings 
                                    registrations={registrations} 
                                    tournament={tournament} 
                                    isAdmin={isAdmin} 
                                    matches={matches}
                                />
                            ) : (
                                <TournamentBracket matches={matches} participants={participantMap} />
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="p-4 rounded-full bg-slate-950 border border-white/5 mb-4">
                                    <Trophy className="h-10 w-10 text-slate-800" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest">
                                    {tournament.gameType === 'Deathmatch' ? 'Standings Not Live' : 'Bracket Not Generated'}
                                </h3>
                                <p className="text-sm text-slate-600 mt-2">
                                    {tournament.gameType === 'Deathmatch' ? 'The leaderboard will appear here once the match starts.' : 'The tournament matches will be visible here once the bracket is created.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "participants" && (
                    <div className="animate-in fade-in duration-500 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {registrations.length > 0 ? registrations.map((reg) => (
                                <div key={reg.$id} className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 hover:border-rose-500/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/10 rounded-lg">
                                            <Users className="h-4 w-4 text-rose-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase tracking-tight">{reg.teamName || (parseMetadata(reg.metadata)?.playerName || "Unknown")}</p>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.1em]">Registered {new Date(reg.$createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 py-12 text-center text-slate-600 uppercase text-[10px] font-black tracking-widest">
                                    No participants yet
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
          </div>

          {/* Sidebar Info & Registration */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <div className="flex flex-col gap-3 w-full">
                             <div className="p-6 rounded-2xl bg-[#11141a] border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/60 mb-2">Prize Pool</p>
                                <p className="text-4xl font-black text-white italic tracking-tighter leading-none">{tournament.prizePool}</p>
                             </div>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 text-rose-500 shadow-lg shadow-rose-500/5">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">Schedule</p>
                                <p className="text-sm font-bold text-white uppercase tracking-tight" suppressHydrationWarning>
                                    {new Date(tournament.date).toLocaleDateString()} @ {new Date(tournament.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 text-rose-500 shadow-lg shadow-rose-500/5">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">Participants</p>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-bold text-white">{registrations.length} / {tournament.maxTeams}</p>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                        (tournament.maxTeams - registrations.length) <= 2 ? "text-rose-500" : "text-emerald-500"
                                    }`}>
                                        ({tournament.maxTeams - registrations.length} LEFT)
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 text-rose-500 shadow-lg shadow-rose-500/5">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">Location</p>
                                <p className="text-sm font-bold text-white uppercase tracking-tight">{tournament.location || "Online"}</p>
                            </div>
                        </div>
                    </div>
                </div>


            </div>

            {/* Registration Card */}
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-6 backdrop-blur-xl">
                <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-rose-500" />
                    Entry Details
                </h3>
                {tournament.checkInEnabled && (
                    <div className="mb-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                        <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" />
                            Pre-Match Check-in Required
                        </p>
                        <p className="text-xs font-bold text-white">
                            {tournament.checkInStart ? new Date(tournament.checkInStart).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "Check-in time TBD"}
                        </p>
                    </div>
                )}
                {!user ? (
                    <div className="text-center py-4">
                        <p className="mb-4 text-slate-400 text-sm">Please sign in to register for this tournament.</p>
                        <button 
                            onClick={() => router.push("/login")}
                            className="w-full rounded-xl bg-white px-6 py-3 text-xs font-black uppercase text-slate-950 hover:bg-slate-200 transition-all font-anton tracking-widest"
                        >
                            Log In
                        </button>
                    </div>
                ) : isRegistered ? (
                    <div className="flex flex-col gap-4">
                        <div className={`flex items-center gap-2 rounded-xl p-4 border ${isCheckedIn ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                            {isCheckedIn ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            <span className="text-xs font-bold uppercase tracking-wide">{isCheckedIn ? "Checked In!" : "Registered"}</span>
                        </div>
                        
                        {!isCheckedIn && (
                            <button 
                                onClick={handleCheckIn}
                                disabled={checkingIn}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                            >
                                {checkingIn ? <Loader fullScreen={false} /> : "Check In Now"}
                            </button>
                        )}
                    </div>
                ) : isFull ? (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 p-4 border border-rose-500/20 text-rose-500">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Entry Limit Reached</span>
                    </div>
                ) : (tournament.status || 'open') !== 'open' ? (
                    <div className="flex items-center gap-2 rounded-xl bg-slate-900 p-4 border border-white/5 text-slate-500">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Closed</span>
                    </div>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-6">
                        {success ? (
                            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-4 text-emerald-500 font-bold border border-emerald-500/20">
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Success!</span>
                            </div>
                        ) : (
                            <>
                                {tournament.gameType === "5v5" ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Team Name</label>
                                            <input 
                                                type="text" 
                                                value={teamName}
                                                onChange={(e) => setTeamName(e.target.value)}
                                                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white focus:border-rose-500 focus:outline-none transition-all"
                                                placeholder="Enter team name"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Roster (5)</label>
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
                                                        className="flex-1 rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none placeholder:text-slate-800"
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
                                                        className="w-16 rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none placeholder:text-slate-800 text-center"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => verifyMember(index)}
                                                        disabled={member.loading || !member.name || !member.tag}
                                                        className={`flex items-center justify-center rounded-lg px-2 py-2 transition-all ${
                                                            member.verified 
                                                            ? "bg-emerald-500/20 text-emerald-500" 
                                                            : "bg-slate-900 border border-white/5 text-slate-600 hover:text-white"
                                                        }`}
                                                    >
                                                        {member.loading ? (
                                                            <Loader fullScreen={false} size="sm" />
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
                                    <div className="rounded-xl bg-slate-950/50 border border-white/5 p-4 text-center space-y-3">
                                        <p className="text-xs text-slate-500">Solo registration for:</p>
                                        {userProfile ? (
                                            <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-1.5 border border-rose-500/20">
                                                <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                <span className="text-xs font-bold text-white">{userProfile.ingameName} <span className="text-slate-500">#{userProfile.tag}</span></span>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest">Link account in profile</p>
                                        )}
                                    </div>
                                )}
                                {error && <p className="text-[10px] text-rose-500 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{error}</p>}
                                <button 
                                    type="submit" 
                                    disabled={registering || (tournament.gameType === "5v5" && members.some(m => !m.verified))}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-rose-900/20 hover:bg-rose-700 transition-all disabled:opacity-50"
                                >
                                    {registering ? <Loader fullScreen={false} size="sm" /> : "Confirm Entry"}
                                </button>
                            </>
                        )}
                    </form>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
