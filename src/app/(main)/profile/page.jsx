"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAccount, getMMR, getMMRByName, getMatches, getAccountByPuuid, getPlayerCard, getAgents } from "@/lib/valorant";
import { saveUserProfile, getUserProfile } from "@/lib/users";
import { User, Trophy, Activity, TrendingUp, TrendingDown, UserPlus, Sword, Shield, Crosshair, Zap, Brain, RefreshCw, ChevronDown, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import MatchDetailsModal from "@/components/MatchDetailsModal";
import { createFreeAgentPost, deleteFreeAgentPost, getUserFreeAgentPost, updateFreeAgentPost } from "@/lib/players";
import { Trash2, DollarSign, Crown, Swords, ArrowRight, Medal } from "lucide-react";
import Link from "next/link";
import Loader from "@/components/Loader";
import ProfileSkeleton from "@/components/ProfileSkeleton";
import { rankIcons } from "@/assets/images/ranks";
import { agentIcons } from "@/assets/images/agents";

// Fallback icon for Controller
const Cloud = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3-1.3-3-3s1.3-3 3-3 1 1.4 1 3h2c0-2.8-2.2-5-5-5S1.5 6.2 1.5 9c0 .4.1.8.2 1.1C.6 15 4.8 19 10 19h7.5c2.5 0 4.5-2 4.5-4.5S20 10 17.5 10c-.3 0-.6.1-.8.2.3-1.4 0-2.8-1.2-3.8" /></svg>;

const ROLE_ICONS = {
    "Duelist": Sword,
    "Controller": Cloud, 
    "Sentinel": Shield,
    "Initiator": Zap,
    "Flex": Brain
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // State for Valorant Data
  const [valProfile, setValProfile] = useState(null);
  const [platformProfile, setPlatformProfile] = useState(null);
  const [mmrData, setMmrData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mmrLoading, setMmrLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State for linking account
  const [riotId, setRiotId] = useState("");
  const [riotTag, setRiotTag] = useState("");
  const [region, setRegion] = useState("ap");

  // Modal State
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  // Team Finder State
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [formData, setFormData] = useState({
      role: "Duelist",
      description: "",
      mainAgent: "",
      secondaryAgents: []
  });
  const [userPost, setUserPost] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);
  
  // Custom Notification State
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const notify = (message, type = "success") => {
      setNotification({ show: true, message, type });
      setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
        // Load existing linked profile if available
        const loadProfile = async () => {
            setLoading(true);
            try {
                const profile = await getUserProfile(user.$id);
                if (profile) {
                    setPlatformProfile(profile);
                    setRiotId(profile.ingameName);
                    setRiotTag(profile.tag);
                    setRegion(profile.region || 'ap');
                    
                    // We know the user has a linked account, so we can stop showing the "Link Account" form
                    // and show the skeleton while we fetch the rest
                    // (LATER: we could even set a "placeholder" valProfile here if we wanted)

                    // Prioritize fetching by PUUID if it exists
                    const accountDataPromise = profile.puuid 
                        ? getAccountByPuuid(profile.puuid)
                        : getAccount(profile.ingameName, profile.tag);
                        
                    const accountData = await accountDataPromise;
                        
                    if (accountData.data) {
                        setValProfile(accountData.data);
                        
                        // 1. Fetch Card Data (independent)
                        if (accountData.data.card) {
                            getPlayerCard(accountData.data.card)
                                .then(cardRes => setCardData(cardRes?.data))
                                .catch(e => console.error("Card fetch failed:", e));
                        }

                        // 2. Fetch Stats (MMR/Matches)
                        const region = profile.region || accountData.data.region || 'ap';
                        const puuid = accountData.data.puuid;

                        setMmrLoading(true);
                        getMMR(puuid, region)
                            .then(res => setMmrData(res.data))
                            .catch(async () => {
                                console.error("MMR fetch by PUUID failed for profile, trying Name/Tag fallback...");
                                const fallbackRes = await getMMRByName(region, accountData.data.name, accountData.data.tag).catch(() => null);
                                if (fallbackRes) setMmrData(fallbackRes.data);
                            })
                            .finally(() => setMmrLoading(false));

                        setMatchesLoading(true);
                        getMatches(puuid, region)
                            .then(res => setMatches(res.data))
                            .catch(() => setMatches([]))
                            .finally(() => setMatchesLoading(false));

                        // 3. Fetch Team Finder Post
                        getUserFreeAgentPost(user.$id)
                            .then(post => {
                                setUserPost(post);
                                if (post) {
                                    setFormData({
                                        role: post.role || "Duelist",
                                        description: post.description || "",
                                        mainAgent: post.mainAgent || "",
                                        secondaryAgents: post.secondaryAgents || []
                                    });
                                }
                            })
                            .catch(() => setUserPost(null));
                    } else {
                        // Handle case where linked account is no longer found
                        setValProfile(null);
                    }
                }
            } catch (err) {
                console.error("Failed to load existing profile", err);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();

        // Load Agents
        getAgents().then(res => setAvailableAgents(res.data)).catch(console.error);
    }
  }, [user, authLoading, router]);

  const handleLinkAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
        const accountData = await getAccount(riotId, riotTag);
        if (accountData.data) {
            setValProfile(accountData.data);

            // 1. Fetch Card Data
            if (accountData.data.card) {
                getPlayerCard(accountData.data.card)
                    .then(cardRes => setCardData(cardRes?.data))
                    .catch(e => console.error("Card fetch failed:", e));
            }
            
            // 2. Fetch extra stats
            // We use the USER SELECTED region here
            const puuid = accountData.data.puuid;
            
            getMMR(puuid, region)
                .then(res => setMmrData(res.data))
                .catch(async () => {
                    console.error("MMR fetch by PUUID failed for linked account, trying Name/Tag fallback...");
                    const fallbackRes = await getMMRByName(region, accountData.data.name, accountData.data.tag).catch(() => null);
                    if (fallbackRes) setMmrData(fallbackRes.data);
                });

            getMatches(puuid, region)
                .then(res => setMatches(res.data))
                .catch(() => setMatches([]));
            
            // 3. Save to Appwrite
            const profileData = {
                puuid: accountData.data.puuid,
                email: user.email,
                ingameName: accountData.data.name,
                tag: accountData.data.tag,
                region: region, // Save the manually selected region
                card: accountData.data.card, // Save card ID for leaderboard
                level: accountData.data.account_level, // Save level for leaderboard
                createdTimestamp: new Date().toISOString(),
                totalEarnings: 0,
                tournamentsWon: 0,
                matchesWon: 0,
                runnerUp: 0
            };
            await saveUserProfile(user.$id, profileData);
            setPlatformProfile(profileData);
        }
        
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!user) return notify("Please login first", "error");
    setPosting(true);

    try {
        const profile = await getUserProfile(user.$id);
        if (!profile || !profile.ingameName) {
            notify("Please link your Riot Account in your Profile first.", "error");
            setPosting(false);
            return;
        }

        if (!formData.mainAgent) {
            notify("Please select a Main Agent.", "error");
            setPosting(false);
            return;
        }

        if (formData.secondaryAgents.length === 0) {
            notify("Please select at least one Secondary Agent.", "error");
            setPosting(false);
            return;
        }

        const postData = {
            userId: user.$id,
            ingameName: profile.ingameName,
            tag: profile.tag,
            role: formData.role,
            region: profile.region || "ap",
            description: formData.description,
            mainAgent: formData.mainAgent,
            secondaryAgents: formData.secondaryAgents
        };

        let post;
        if (userPost) {
            // Update existing
            post = await updateFreeAgentPost(userPost.$id, postData);
            notify("Scouting Report updated successfully!");
        } else {
            // Create new
            post = await createFreeAgentPost(postData);
            notify("Scouting Report is now live!");
        }

        setShowForm(false);
        setFormData({ role: "Duelist", description: "", mainAgent: "", secondaryAgents: [] });
        setUserPost(post);
    } catch (error) {
        notify("Failed to post: " + error.message, "error");
    } finally {
        setPosting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!userPost) return;
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
        await deleteFreeAgentPost(userPost.$id);
        setUserPost(null);
        setShowConfirmModal(false);
        notify("Ad removed successfully.");
    } catch (error) {
        notify("Failed to remove ad: " + error.message, "error");
    }
  };

  if (authLoading || !user) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                 {/* Placeholder Avatar */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white">
                    {user.name.charAt(0).toUpperCase()}
                </div>
                {valProfile && (!userPost || showForm) && (
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${showForm ? 'bg-slate-800 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'}`}
                    >
                        {showForm ? 'Cancel' : (
                            <>
                                <UserPlus className="h-4 w-4" />
                                <span>Post Ad</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </header>



        {/* Team Finder Form Integration */}
        {showForm && valProfile && (
            <div className="mb-12 bg-slate-900 border border-white/10 rounded-2xl p-8 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 shadow-2xl">
                <div className="flex flex-col items-center text-center gap-3 mb-10">
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-lg shadow-rose-500/5">
                        <UserPlus className="h-8 w-8 text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                            {userPost ? 'Update Scouting Report' : 'List on Team Finder'}
                        </h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.3em]">
                            {userPost ? 'Keep your profile fresh and active' : 'Find teams or recruit players'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handlePost} className="space-y-12 max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">Preferred Role</label>
                            <div className="relative group">
                                <select 
                                    value={formData.role}
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 pr-10 text-white font-black uppercase tracking-wider focus:border-rose-500 outline-none transition-all appearance-none cursor-pointer group-hover:bg-slate-900"
                                >
                                    {Object.keys(ROLE_ICONS).map(r => <option key={r} value={r} className="bg-slate-950">{r}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none group-hover:text-white transition-colors" />
                            </div>
                        </div>
                        
                        <div className="flex items-end">
                            <div className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 flex items-center gap-4 opacity-60">
                                {mmrData?.current_data?.images?.small && (
                                    <img src={typeof rankIcons[mmrData.current_data.currenttier] === 'object' ? rankIcons[mmrData.current_data.currenttier]?.src : (rankIcons[mmrData.current_data.currenttier] || mmrData.current_data.images.small)} alt="" className="h-8 w-8 object-contain" />
                                )}
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Auto-Synced Rank</p>
                                    <p className="text-sm font-bold text-white uppercase">{mmrData?.current_data?.currenttierpatched || "Unranked"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Agent Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="flex flex-col items-center">
                            <label className="w-full block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-[0.2em] flex items-center justify-between border-b border-white/5 pb-2">
                                Main Agent
                                <span className="text-[9px] text-rose-400 normal-case font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">Your star pick</span>
                            </label>
                            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 justify-center">
                                {availableAgents.map(agent => (
                                    <button
                                        key={agent.uuid}
                                        type="button"
                                        onClick={() => {
                                            const updatedSecondary = formData.secondaryAgents.filter(a => a !== agent.displayName);
                                            setFormData({...formData, mainAgent: agent.displayName, secondaryAgents: updatedSecondary});
                                        }}
                                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${formData.mainAgent === agent.displayName ? 'border-rose-500 scale-110 shadow-2xl shadow-rose-500/40 z-10' : 'border-white/5 opacity-30 hover:opacity-100 hover:scale-105'}`}
                                        title={agent.displayName}
                                    >
                                        <img src={typeof agentIcons[agent.displayName] === 'object' ? agentIcons[agent.displayName]?.src : (agentIcons[agent.displayName] || agent.displayIcon)} alt={agent.displayName} className="w-full h-full object-cover" />
                                        {formData.mainAgent === agent.displayName && (
                                            <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center">
                                                <div className="bg-rose-500 text-[8px] font-black text-white px-1 rounded absolute bottom-0 w-full text-center py-0.5">MAIN</div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <label className="w-full block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-[0.2em] flex items-center justify-between border-b border-white/5 pb-2">
                                Secondary Agents
                                <span className="text-[9px] text-slate-400 normal-case font-bold bg-slate-800 px-2 py-0.5 rounded-full">Select multiple</span>
                            </label>
                            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 justify-center">
                                {availableAgents.map(agent => (
                                    <button
                                        key={agent.uuid}
                                        type="button"
                                        onClick={() => {
                                            if (agent.displayName === formData.mainAgent) return;
                                            const current = formData.secondaryAgents;
                                            if (current.includes(agent.displayName)) {
                                                setFormData({...formData, secondaryAgents: current.filter(a => a !== agent.displayName)});
                                            } else if (current.length < 5) {
                                                setFormData({...formData, secondaryAgents: [...current, agent.displayName]});
                                            }
                                        }}
                                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${formData.secondaryAgents.includes(agent.displayName) ? 'border-rose-400 scale-105 shadow-xl shadow-rose-400/20 z-10' : 'border-white/5 opacity-30 hover:opacity-100 hover:scale-105'}`}
                                        title={agent.displayName}
                                    >
                                        <img src={typeof agentIcons[agent.displayName] === 'object' ? agentIcons[agent.displayName]?.src : (agentIcons[agent.displayName] || agent.displayIcon)} alt={agent.displayName} className="w-full h-full object-cover" />
                                        {formData.secondaryAgents.includes(agent.displayName) && (
                                            <div className="absolute top-0 right-0 p-1">
                                                <div className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">Scouting Report / Description</label>
                        <textarea 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            placeholder="Tell teams about your playstyle, availability, and main agents..."
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:border-rose-500 outline-none h-32 transition-all placeholder:text-slate-700 text-sm"
                            required
                        />
                    </div>

                    <div className="flex flex-col items-center gap-6 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-4 w-full">
                            <button 
                                type="submit"
                                disabled={posting || !formData.mainAgent || formData.secondaryAgents.length === 0 || !formData.description.trim()}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-white/5 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-rose-600/20 active:shadow-none uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 active:scale-[0.98] border border-transparent"
                            >
                                {posting ? <Loader fullScreen={false} size="sm" /> : <UserPlus className="h-5 w-5" />}
                                {userPost ? 'Update Scouting Report' : 'Publish Scouting Report'}
                            </button>
                            <button 
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-8 bg-slate-800 hover:bg-rose-700 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-[0.2em] text-sm active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        )}

        {loading && !valProfile ? (
            <ProfileSkeleton />
        ) : !valProfile ? (
             <div className="rounded-xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-sm">
                <h2 className="mb-4 text-xl font-semibold text-white">Link Valorant Account</h2>
                <form onSubmit={handleLinkAccount} className="max-w-md space-y-4">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Riot ID (e.g. TenZ)" 
                            value={riotId}
                            onChange={(e) => setRiotId(e.target.value)}
                            className="w-full rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none text-white"
                            required
                        />
                         <input 
                            type="text" 
                            placeholder="#NA1" 
                            value={riotTag}
                            onChange={(e) => setRiotTag(e.target.value)}
                            className="w-24 rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Region</label>
                        <select 
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            className="w-full rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none text-white"
                            required
                        >
                            <option value="ap">Asia Pacific (AP)</option>
                            <option value="eu">Europe (EU)</option>
                            <option value="na">North America (NA)</option>
                            <option value="kr">Korea (KR)</option>
                            <option value="br">Brazil (BR)</option>
                            <option value="latam">Latin America (LATAM)</option>
                        </select>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-md bg-rose-600 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                        {loading ? <Loader fullScreen={false} size="sm" /> : "Link Account"}
                    </button>
                </form>
             </div>
        ) : (
            <div className="grid gap-6 md:grid-cols-3">
                 {/* Main Stats Card */}
                 <div className="col-span-2 space-y-6">
                     {/* Premium Profile Header */}
                    <div className="relative bg-slate-900/50 border border-white/10 rounded-2xl p-8 mb-8 overflow-hidden">
                        <div 
                            className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
                            style={{ backgroundImage: cardData?.wideArt ? `url(${cardData.wideArt})` : 'none' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
                        
                        <div className="relative flex flex-col md:flex-row items-center gap-8 z-10">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-2xl bg-slate-800 border-4 border-slate-900 shadow-xl flex items-center justify-center overflow-hidden">
                                    {cardData?.smallArt ? (
                                        <img src={cardData.smallArt} alt="Player Card" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="h-16 w-16 text-slate-500" />
                                    )}
                                </div>
                                {valProfile?.account_level && (
                                    <div className="absolute -bottom-3 -right-3 bg-slate-900 border border-white/10 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg tracking-tighter">
                                        LVL {valProfile.account_level}
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-center md:text-left">
                                <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3 justify-center md:justify-start">
                                    {valProfile.name}
                                    <span className="text-slate-600 font-bold text-2xl tracking-tighter">#{valProfile.tag}</span>
                                </h1>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className="flex items-center gap-2 text-slate-300 text-[10px] font-black uppercase tracking-wider bg-black/40 border border-white/5 px-3 py-1.5 rounded-full backdrop-blur-md">
                                        <Activity className="h-3 w-3 text-rose-500" />
                                        <span>{mmrData?.current_data?.currenttierpatched || "Unranked"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-300 text-[10px] font-black uppercase tracking-wider bg-black/40 border border-white/5 px-3 py-1.5 rounded-full backdrop-blur-md">
                                        <Trophy className="h-3 w-3 text-yellow-500" />
                                        <span>Peak: {mmrData?.highest_rank?.patched_tier || "N/A"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Match History */}
                    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                                <Activity className="h-5 w-5 text-rose-500" />
                                Recent Matches
                            </h3>
                            
                            <div className="flex rounded-lg bg-slate-950 p-1">
                                {["All", "Competitive", "Unrated"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${
                                            activeTab === tab 
                                            ? "bg-rose-600 text-white shadow-lg" 
                                            : "text-slate-500 hover:text-slate-300"
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {matchesLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-20 bg-slate-950 rounded-lg border border-white/5 animate-pulse" />
                                    ))}
                                </div>
                            ) : matches.length === 0 ? (
                                <div className="text-center py-12 bg-slate-950/50 rounded-lg border border-white/5">
                                    <p className="text-slate-500">No recent matches found</p>
                                </div>
                            ) : (
                                matches
                                    .filter(m => activeTab === "All" || m.metadata.mode === activeTab)
                                    .map((match) => {
                                    // Find the user in the players list
                                    const allPlayers = match.players?.all_players || [];
                                    const me = allPlayers.find(p => p.puuid === valProfile.puuid);
                                    if (!me) return null;

                                    // Determine if win or loss
                                    const myTeam = me.team?.toLowerCase();
                                    const teamData = match.teams?.[myTeam] || {};
                                    const hasWon = teamData.has_won || false;
                                    const roundsWon = teamData.rounds_won || 0;
                                    const roundsLost = teamData.rounds_lost || 0;

                                    return (
                                        <div 
                                            key={match.metadata.matchid} 
                                            onClick={() => {
                                                setSelectedMatch(match);
                                                setIsModalOpen(true);
                                            }}
                                            className={`flex items-center justify-between rounded-lg border-l-4 bg-slate-950 p-4 cursor-pointer transition-all hover:scale-[1.02] hover:bg-slate-900 border-white/5 shadow-sm ${hasWon ? "border-emerald-500" : "border-rose-500"}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Agent Icon */}
                                                <div className="relative">
                                                    <img src={typeof agentIcons[me.character] === 'object' ? agentIcons[me.character]?.src : (agentIcons[me.character] || me.assets.agent.small)} alt={me.character} className="h-12 w-12 rounded-md bg-slate-900" />
                                                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white border border-slate-700">
                                                        {me.level}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-white leading-none">{match.metadata.map}</p>
                                                        <span className="text-[10px] uppercase tracking-wider text-slate-500 px-1.5 py-0.5 rounded border border-white/5 bg-white/5">
                                                            {match.metadata.mode}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm text-slate-400">
                                                        {me.stats.kills} <span className="text-slate-600">/</span> {me.stats.deaths} <span className="text-slate-600">/</span> {me.stats.assists}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className={`text-xs font-bold tracking-widest ${hasWon ? "text-emerald-400" : "text-rose-400"}`}>
                                                    {hasWon ? "VICTORY" : "DEFEAT"}
                                                </p>
                                                <p className="text-lg font-bold text-white tabular-nums">
                                                    {roundsWon} <span className="text-slate-500 mx-0.5">:</span> {roundsLost}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                 </div>

                  {/* Sidebar Stats */}
                  <div className="space-y-6">
                        {/* Platform Achievements Card */}
                        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm overflow-hidden relative group">
                             <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-600/10 blur-[50px] rounded-full group-hover:bg-rose-600/20 transition-all" />
                             
                             <h3 className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                <Trophy className="h-4 w-4 text-rose-500" />
                                Statistics
                             </h3>
                             
                             <div className="grid grid-cols-1 gap-4">
                                 <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl hover:border-emerald-500/20 transition-colors">
                                     <div className="flex items-center justify-between mb-1">
                                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Earnings</span>
                                         <DollarSign className="h-3 w-3 text-emerald-500" />
                                     </div>
                                     <div className="text-2xl font-black text-white font-mono tracking-tighter">
                                         ₹{(platformProfile?.totalEarnings || 0).toLocaleString()}
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl hover:border-amber-500/20 transition-colors">
                                         <div className="flex items-center justify-between mb-1">
                                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Won</span>
                                             <Crown className="h-3 w-3 text-amber-500" />
                                         </div>
                                         <div className="text-xl font-black text-white">
                                             {platformProfile?.tournamentsWon || 0}
                                         </div>
                                     </div>
                                     <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl hover:border-slate-400/20 transition-colors">
                                         <div className="flex items-center justify-between mb-1">
                                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Runner Up</span>
                                             <Medal className="h-3 w-3 text-slate-400" />
                                         </div>
                                         <div className="text-xl font-black text-white">
                                             {platformProfile?.runnerUp || 0}
                                         </div>
                                     </div>
                                 </div>

                                 <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl hover:border-rose-500/20 transition-colors">
                                     <div className="flex items-center justify-between mb-1">
                                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Matches Won</span>
                                         <Swords className="h-3 w-3 text-rose-500" />
                                     </div>
                                     <div className="text-xl font-black text-white">
                                         {platformProfile?.matchesWon || 0}
                                     </div>
                                 </div>
                             </div>
                             
                             <Link href="/leaderboard" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-3 text-[10px] font-black text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                                View Leaderboard
                                <ArrowRight className="h-3 w-3" />
                             </Link>
                        </div>
                    <div className="relative group rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm overflow-hidden transition-all hover:bg-slate-900/80">
                         {/* Background Rank Glow */}
                         <div className={`absolute -right-20 -top-20 w-64 h-64 blur-[100px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-30 
                            ${mmrData?.current_data?.currenttierpatched?.includes('Platinum') ? 'bg-cyan-500' : 
                              mmrData?.current_data?.currenttierpatched?.includes('Diamond') ? 'bg-purple-500' :
                              mmrData?.current_data?.currenttierpatched?.includes('Ascendant') ? 'bg-emerald-500' :
                              mmrData?.current_data?.currenttierpatched?.includes('Immortal') ? 'bg-rose-500' :
                              mmrData?.current_data?.currenttierpatched?.includes('Radiant') ? 'bg-yellow-500' : 'bg-slate-500'}`} 
                         />

                         <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    Competitive
                                </h3>
                                {mmrData?.highest_rank?.patched_tier && (
                                     <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                                         <Trophy className="h-3 w-3 text-yellow-500" />
                                         <span className="text-[10px] font-black uppercase text-yellow-500">
                                             PEAK: {mmrData.highest_rank.patched_tier}
                                         </span>
                                     </div>
                                )}
                            </div>

                            {mmrData?.current_data?.currenttierpatched ? (
                                // ... existing rank display ...
                                // (I'll keep this as is but add the loading check)
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full" />
                                        <img 
                                            src={typeof rankIcons[mmrData.current_data.currenttier] === 'object' ? rankIcons[mmrData.current_data.currenttier]?.src : (rankIcons[mmrData.current_data.currenttier] || mmrData.current_data.images?.large || mmrData.current_data.images?.small)} 
                                            alt="Rank" 
                                            className="h-32 w-32 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform group-hover:scale-110 duration-500"
                                        />
                                        {mmrData.current_data.mmr_change_to_last_game !== undefined && (
                                            <div className={`absolute -bottom-2 translate-x-1/2 right-1/2 px-2 py-0.5 rounded text-[10px] font-black border z-20 shadow-lg
                                                ${mmrData.current_data.mmr_change_to_last_game >= 0 
                                                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                                                    : 'bg-rose-500/20 border-rose-500/30 text-rose-400'}`}>
                                                {mmrData.current_data.mmr_change_to_last_game >= 0 ? '+' : ''}{mmrData.current_data.mmr_change_to_last_game}
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full">
                                        <div className="mb-6">
                                            <p className="text-3xl font-black text-white tracking-tight mb-1">
                                                {mmrData.current_data.currenttierpatched}
                                            </p>
                                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                                    ELO: <span className="text-slate-300">{mmrData.current_data.elo}</span>
                                                </p>
                                                {(() => {
                                                    const seasons = Object.keys(mmrData.by_season || {});
                                                    const currentSeason = seasons[0];
                                                    const stats = mmrData.by_season[currentSeason];
                                                    if (stats && !stats.error && stats.number_of_games > 0) {
                                                        const wr = Math.round((stats.wins / stats.number_of_games) * 100);
                                                        return (
                                                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                                                Winrate: <span className={wr >= 50 ? 'text-emerald-400' : 'text-slate-300'}>{wr}%</span>
                                                            </p>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        </div>

                                        <div className="space-y-3 px-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase text-slate-400">Rating Progress</span>
                                                <span className="text-sm font-mono font-bold text-white">
                                                    {mmrData.current_data.ranking_in_tier}<span className="text-slate-500 ml-1">RR</span>
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.2)]
                                                        ${mmrData.current_data.currenttierpatched?.includes('Platinum') ? 'bg-cyan-400' : 
                                                          mmrData.current_data.currenttierpatched?.includes('Diamond') ? 'bg-purple-400' :
                                                          mmrData.current_data.currenttierpatched?.includes('Ascendant') ? 'bg-emerald-400' : 'bg-white'}`}
                                                    style={{ width: `${mmrData.current_data.ranking_in_tier}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : mmrLoading ? (
                                <div className="flex flex-col items-center py-10 animate-pulse">
                                    <div className="w-32 h-32 rounded-full bg-slate-800 mb-6" />
                                    <div className="h-8 w-48 bg-slate-800 rounded mb-4" />
                                    <div className="h-4 w-32 bg-slate-800 rounded" />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                     <img 
                                        src={typeof rankIcons[0] === 'object' ? rankIcons[0]?.src : rankIcons[0]} 
                                        alt="Unranked" 
                                        className="h-16 w-16 grayscale mb-4 opacity-20"
                                    />
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No Rank Data Found</p>
                                </div>
                            )}
                         </div>
                    </div>

                    {/* Active Team Finder Ad - Relocated below Rank */}
                    {!showForm && userPost && (
                        <div className="bg-rose-600/5 border border-rose-500/10 rounded-2xl p-5 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-rose-500/10">
                                    <UserPlus className="h-5 w-5 text-rose-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-white leading-none">Team Finder Ad</h3>
                                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-[8px] font-black uppercase tracking-widest text-white">LIVE</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Listed as {userPost.role}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => {
                                        if (userPost) {
                                            setFormData({ 
                                                role: userPost.role, 
                                                description: userPost.description,
                                                mainAgent: userPost.mainAgent || "",
                                                secondaryAgents: userPost.secondaryAgents || []
                                            });
                                        }
                                        setShowForm(true);
                                    }}
                                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={handleDeletePost}
                                    className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}
                 </div>
            </div>
        )}
      </div>

      <MatchDetailsModal 
        match={selectedMatch}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        puuid={valProfile?.puuid}
      />

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-950/60 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20">
                        <AlertCircle className="h-8 w-8 text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Are you sure?</h3>
                        <p className="text-sm text-slate-400">This will permanently remove your Team Finder listing. You can always create a new one later.</p>
                    </div>
                    <div className="flex gap-3 w-full mt-4">
                        <button 
                            onClick={confirmDelete}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl transition-all uppercase tracking-widest text-xs active:scale-95"
                        >
                            Remove
                        </button>
                        <button 
                            onClick={() => setShowConfirmModal(false)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-3 rounded-xl transition-all uppercase tracking-widest text-xs active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {notification.show && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-bottom-5 duration-500">
              <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
                  notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                  notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                  'bg-slate-800/80 border-white/10 text-white'
              }`}>
                  {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
                  {notification.type === 'error' && <XCircle className="h-5 w-5" />}
                  {notification.type === 'info' && <Info className="h-5 w-5" />}
                  <span className="text-sm font-black uppercase tracking-widest leading-none pt-0.5">{notification.message}</span>
              </div>
          </div>
      )}
    </div>
  );
}
