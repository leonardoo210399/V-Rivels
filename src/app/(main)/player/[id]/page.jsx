"use client";
import { useEffect, useState, use } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { User, Trophy, Crosshair, MapPin, Gauge, Activity, Sword, Skull, Target, Medal, Crown, Swords, DollarSign, ArrowRight } from "lucide-react";
import Loader from "@/components/Loader";
import { getAccount, getMMR, getMMRByName, getMatches, getPlayerCard } from "@/lib/valorant";

// Assuming we have these from your config:
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users"; 
const REGISTRATIONS_COLLECTION_ID = "registrations"; 

export default function PublicProfilePage({ params }) {
    const { id } = use(params);
    const [profile, setProfile] = useState(null);
    const [valorantStats, setValorantStats] = useState(null);
    const [matches, setMatches] = useState([]);
    const [dbStats, setDbStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, [id]);

    const loadProfile = async () => {
        try {
            // 1. Fetch Appwrite User Document
            const userDoc = await databases.getDocument(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                id 
            );
            setProfile(userDoc);

            // 2. Fetch Appwrite Stats (Tournaments)
            const registrations = await databases.listDocuments(
                DATABASE_ID,
                REGISTRATIONS_COLLECTION_ID,
                [Query.equal("userId", id)]
            );
            setDbStats({
                tournamentsPlayed: registrations.total,
                totalEarnings: userDoc.totalEarnings || 0,
                tournamentsWon: userDoc.tournamentsWon || 0,
                matchesWon: userDoc.matchesWon || 0,
                runnerUp: userDoc.runnerUp || 0
            });

            // 3. Fetch Valorant Stats (if linked)
            if (userDoc.ingameName && userDoc.tag) {
                try {
                    const accountData = await getAccount(userDoc.ingameName, userDoc.tag);
                    
                        if (accountData.data) {
                            const region = userDoc.region || accountData.data.region || 'ap';
                            setValorantStats({
                                account: accountData.data,
                                mmr: null,
                                card: null
                            });

                            // 1. Fetch Card Data first
                            if (accountData.data.card) {
                                try {
                                    const cardRes = await getPlayerCard(accountData.data.card);
                                    if (cardRes?.data) {
                                        setValorantStats(prev => ({ ...prev, card: cardRes.data }));
                                    }
                                } catch (e) { console.error("Card fetch failed:", e); }
                            }

                            // 2. Fetch MMR and Matches
                            try {
                                const fetchedMMR = await getMMR(accountData.data.puuid, region)
                                    .catch(async (e) => {
                                        console.error("MMR fetch by PUUID failed for profile, trying Name/Tag fallback...", e);
                                        return await getMMRByName(region, userDoc.ingameName, userDoc.tag).catch(() => null);
                                    });

                                const fetchedMatches = await getMatches(accountData.data.puuid, region).catch(() => ({ data: [] }));

                                setValorantStats(prev => ({ 
                                    ...prev, 
                                    mmr: fetchedMMR?.data || null 
                                }));
                                setMatches(fetchedMatches?.data || []);
                            } catch (e) {
                                console.error("MMR/Matches fetch failed:", e);
                            }
                        }
                } catch (apiError) {
                    console.error("Valorant API Error:", apiError);
                }
            }

        } catch (e) {
            console.error(e);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;
    
    if (!profile) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white pt-24 px-4">
            <h1 className="text-4xl font-bold mb-4">User Not Found</h1>
            <p className="text-slate-400">The player you are looking for does not exist or has a private profile.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 selection:bg-rose-500/30">
            <div className="max-w-6xl mx-auto">
                {/* Page Title Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 px-2">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-1 w-8 bg-rose-500 rounded-full" />
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Public Record</h2>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Player <span className="text-rose-500 underline decoration-rose-500/30 underline-offset-8">Profile</span></h1>
                    </div>
                    <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-md">
                        <div className="relative">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white leading-none uppercase tracking-widest">Live Sync</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Verified Agent Data</span>
                        </div>
                    </div>
                </div>

                {/* Profile Header - Premium Style */}
                <div className="relative rounded-3xl border border-white/10 bg-slate-900/50 p-8 mb-8 overflow-hidden group">
                     {/* Dynamic Background Banner */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                        style={{ backgroundImage: valorantStats?.card?.wideArt ? `url(${valorantStats.card.wideArt})` : 'none' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
                    
                    <div className="relative flex flex-col md:flex-row items-center gap-10 z-10">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-2xl bg-slate-800 border-4 border-slate-950 shadow-2xl flex items-center justify-center overflow-hidden">
                                {valorantStats?.card?.smallArt ? (
                                    <img src={valorantStats.card.smallArt} alt="Player Card" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="h-16 w-16 text-slate-700" />
                                )}
                            </div>
                            {valorantStats?.account?.account_level && (
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg whitespace-nowrap uppercase tracking-widest">
                                    lvl {valorantStats.account.account_level}
                                </div>
                            )}
                        </div>
                        
                        <div className="text-center md:text-left">
                            <h1 className="text-5xl font-black text-white mb-4 tracking-tighter flex items-center gap-4 justify-center md:justify-start">
                                {profile.ingameName}
                                <span className="text-slate-600 font-bold text-3xl">#{profile.tag}</span>
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                                    <Trophy className="h-4 w-4 text-emerald-500" />
                                    <span>{dbStats?.tournamentsPlayed || 0} Tourneys</span>
                                </div>
                                {valorantStats?.mmr?.current_data?.currenttierpatched && (
                                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                                        <Activity className="h-4 w-4 text-rose-500" />
                                        <span>{valorantStats.mmr.current_data.currenttierpatched}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left Column - Stats & Identity */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Statistics Card */}
                        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm overflow-hidden relative group">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-600/10 blur-[50px] rounded-full group-hover:bg-rose-600/20 transition-all" />
                            
                            <h3 className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                <Trophy className="h-4 w-4 text-rose-500" />
                                Statistics
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-slate-950/50 border border-white/10 p-4 rounded-xl hover:border-emerald-500/20 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Earnings</span>
                                        <DollarSign className="h-3 w-3 text-emerald-500" />
                                    </div>
                                    <div className="text-3xl font-black text-white font-mono tracking-tighter">
                                        ₹{(dbStats?.totalEarnings || 0).toLocaleString()}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-950/50 border border-white/10 p-4 rounded-xl hover:border-amber-500/20 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Won</span>
                                            <Crown className="h-3 w-3 text-amber-500" />
                                        </div>
                                        <div className="text-xl font-black text-white">
                                            {dbStats?.tournamentsWon || 0}
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/50 border border-white/10 p-4 rounded-xl hover:border-slate-400/20 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Runner Up</span>
                                            <Medal className="h-3 w-3 text-slate-400" />
                                        </div>
                                        <div className="text-xl font-black text-white">
                                            {dbStats?.runnerUp || 0}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 border border-white/10 p-4 rounded-xl hover:border-rose-500/20 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Matches Won</span>
                                        <Swords className="h-3 w-3 text-rose-500" />
                                    </div>
                                    <div className="text-xl font-black text-white">
                                        {dbStats?.matchesWon || 0}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Riot Identity */}
                        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                                <Crosshair className="h-4 w-4 text-rose-500" />
                                Identity
                            </h2>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center py-2.5 px-3 bg-white/[0.02] rounded-lg">
                                    <span className="text-[10px] font-black uppercase text-slate-500">Region</span>
                                    <span className="text-xs font-black text-white uppercase">{valorantStats?.account?.region || profile.region || "AP"}</span> 
                                </div>
                                <div className="flex justify-between items-center py-2.5 px-3 bg-white/[0.02] rounded-lg">
                                    <span className="text-[10px] font-black uppercase text-slate-500">Last Synced</span>
                                    <span className="text-xs font-bold text-slate-400">{valorantStats?.account?.last_update ? new Date(valorantStats.account.last_update).toLocaleDateString() : "Never"}</span> 
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Stats & History */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Competitive Card */}
                        <div className="relative group bg-slate-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm transition-all hover:bg-slate-900/80 overflow-hidden min-h-[300px] flex flex-col justify-center">
                            {/* Background Rank Glow */}
                            <div className={`absolute -right-20 -top-20 w-80 h-80 blur-[120px] opacity-10 pointer-events-none transition-all duration-700 group-hover:opacity-20 
                                ${valorantStats?.mmr?.current_data?.currenttierpatched?.includes('Platinum') ? 'bg-cyan-500' : 
                                  valorantStats?.mmr?.current_data?.currenttierpatched?.includes('Diamond') ? 'bg-purple-500' :
                                  valorantStats?.mmr?.current_data?.currenttierpatched?.includes('Ascendant') ? 'bg-emerald-500' :
                                  valorantStats?.mmr?.current_data?.currenttierpatched?.includes('Immortal') ? 'bg-rose-500' :
                                  valorantStats?.mmr?.current_data?.currenttierpatched?.includes('Radiant') ? 'bg-yellow-500' : 'bg-rose-500'}`} 
                            />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10">
                                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                        <Gauge className="h-4 w-4" />
                                        Competitive Rank
                                    </h2>
                                    {valorantStats?.mmr?.highest_rank?.patched_tier && (
                                         <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
                                             <Trophy className="h-3.5 w-3.5 text-amber-500" />
                                             <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">
                                                 Peak: {valorantStats.mmr.highest_rank.patched_tier}
                                             </span>
                                         </div>
                                    )}
                                </div>

                                {valorantStats?.mmr?.current_data?.currenttierpatched ? (
                                    <div className="flex flex-col sm:flex-row items-center gap-10">
                                        <div className="relative shrink-0 flex items-center justify-center">
                                            <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-150" />
                                            <img 
                                                src={valorantStats.mmr.current_data.images.large} 
                                                alt="Rank" 
                                                className="h-40 w-40 relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-transform group-hover:scale-110 duration-700 ease-out"
                                            />
                                            {valorantStats.mmr.current_data.mmr_change_to_last_game !== undefined && (
                                                <div className={`absolute -bottom-2 px-3 py-1 rounded-full text-[10px] font-black border z-20 shadow-2xl backdrop-blur-md
                                                    ${valorantStats.mmr.current_data.mmr_change_to_last_game >= 0 
                                                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                                                        : 'bg-rose-500/20 border-rose-500/30 text-rose-400'}`}>
                                                    {valorantStats.mmr.current_data.mmr_change_to_last_game >= 0 ? '+' : ''}{valorantStats.mmr.current_data.mmr_change_to_last_game}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 w-full text-center sm:text-left">
                                            <div className="mb-8">
                                                <p className="text-5xl font-black text-white tracking-tighter mb-2">
                                                    {valorantStats.mmr.current_data.currenttierpatched}
                                                </p>
                                                <div className="flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-2">
                                                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                                        ELO <span className="text-white bg-white/10 px-2 py-0.5 rounded">{valorantStats.mmr.current_data.elo}</span>
                                                    </div>
                                                    {(() => {
                                                        const seasons = Object.keys(valorantStats.mmr.by_season || {});
                                                        const currentSeason = seasons[0];
                                                        const stats = valorantStats.mmr.by_season[currentSeason];
                                                        if (stats && !stats.error && stats.number_of_games > 0) {
                                                            const wr = Math.round((stats.wins / stats.number_of_games) * 100);
                                                            return (
                                                                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                                                    Winrate <span className={`px-2 py-0.5 rounded ${wr >= 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white'}`}>{wr}%</span>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            </div>

                                            <div className="space-y-3 max-w-sm mx-auto sm:mx-0">
                                                <div className="flex justify-between items-end px-1">
                                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Rating Progress</span>
                                                    <span className="text-lg font-mono font-black text-white leading-none">
                                                        {valorantStats.mmr.current_data.ranking_in_tier}<span className="text-slate-600 ml-1 text-sm font-bold uppercase">rr</span>
                                                    </span>
                                                </div>
                                                <div className="h-2.5 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden shadow-inner p-0.5">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(255,255,255,0.2)]
                                                            ${valorantStats.mmr.current_data.currenttierpatched?.includes('Platinum') ? 'bg-cyan-400' : 
                                                              valorantStats.mmr.current_data.currenttierpatched?.includes('Diamond') ? 'bg-purple-400' :
                                                              valorantStats.mmr.current_data.currenttierpatched?.includes('Ascendant') ? 'bg-emerald-400' : 
                                                              valorantStats.mmr.current_data.currenttierpatched?.includes('Immortal') ? 'bg-rose-500' : 'bg-rose-500'}`}
                                                        style={{ width: `${Math.max(2, valorantStats.mmr.current_data.ranking_in_tier)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 scale-90">
                                        <div className="relative h-24 w-24 rounded-full bg-slate-950 flex items-center justify-center border border-white/5 mb-6 group-hover:scale-110 transition-transform duration-500">
                                            <div className="absolute inset-0 bg-white/5 blur-xl rounded-full" />
                                            <img 
                                                src="https://media.valorant-api.com/competitivetiers/03621f13-43b2-ad59-3904-c3a77a961e97/0/largeicon.png" 
                                                alt="Unranked" 
                                                className="h-16 w-16 opacity-30 grayscale relative z-10"
                                            />
                                        </div>
                                        <p className="text-white font-black uppercase tracking-[0.2em] text-sm">Unranked</p>
                                        <p className="text-slate-600 text-[10px] font-bold uppercase mt-2 tracking-widest">Season placements pending</p>
                                    </div>
                                )}
                            </div>
                         </div>

                        {/* Public Match History */}
                        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8 flex items-center gap-2">
                                <Sword className="h-4 w-4 text-rose-500" />
                                Recent Performance
                            </h2>

                            {Array.isArray(matches) && matches.length > 0 ? (
                                <div className="space-y-3">
                                    {matches.filter(m => m && m.metadata).map((match) => {
                                        const me = match.players?.all_players?.find(p => p.puuid === valorantStats?.account?.puuid);
                                        const myTeamSide = me?.team?.toLowerCase();
                                        const winningTeamSide = (match.teams?.blue?.has_won ? 'blue' : match.teams?.red?.has_won ? 'red' : null);
                                        const actuallyWon = myTeamSide && winningTeamSide && myTeamSide === winningTeamSide;

                                        return (
                                            <div 
                                                key={match.metadata?.matchid || Math.random()} 
                                                className={`group grid grid-cols-12 items-center p-5 rounded-2xl border-l-4 bg-slate-950/80 hover:bg-slate-900 border border-white/5 transition-all hover:translate-x-1
                                                    ${actuallyWon ? 'border-l-emerald-500 shadow-emerald-950/20' : 'border-l-rose-500 shadow-rose-950/20'} shadow-lg`}
                                            >
                                                {/* Map & Agent - col-span-4 */}
                                                <div className="col-span-4 flex items-center gap-5">
                                                    <div className="relative shrink-0">
                                                        <img 
                                                            src={me?.assets?.agent?.small || "https://media.valorant-api.com/agents/placeholder/displayicon.png"} 
                                                            alt="Agent" 
                                                            className="h-12 w-12 rounded-xl bg-slate-800 border border-white/5 group-hover:scale-105 transition-transform" 
                                                        />
                                                        <div className={`absolute -right-1.5 -bottom-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950
                                                            ${actuallyWon ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                                            {actuallyWon ? <Target className="h-2.5 w-2.5 text-white" /> : <Skull className="h-2.5 w-2.5 text-white" />}
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-lg text-white leading-none mb-1 uppercase tracking-tighter truncate">{match.metadata?.map || "Unknown Map"}</p>
                                                        <div className="flex flex-col items-start gap-1.5 mt-2">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded whitespace-nowrap
                                                                ${actuallyWon ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                                {actuallyWon ? "Victory" : "Defeat"}
                                                            </span>
                                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.15em] pl-0.5">
                                                                {match.metadata?.mode || "Standard"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* K/D/A - col-span-2 */}
                                                <div className="col-span-2 text-center">
                                                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1">K/D/A</p>
                                                    <p className="font-mono text-white text-base">
                                                        {me?.stats?.kills || 0}<span className="text-slate-600 mx-0.5">/</span>{me?.stats?.deaths || 0}<span className="text-slate-600 mx-0.5">/</span>{me?.stats?.assists || 0}
                                                    </p>
                                                </div>

                                                {/* Combat Score - col-span-2 */}
                                                <div className="col-span-2 text-center hidden sm:block">
                                                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Combat</p>
                                                    <p className="font-mono text-white">{me?.stats?.score || 0}</p>
                                                </div>

                                                {/* HS% - col-span-2 */}
                                                <div className="col-span-2 text-center hidden md:block">
                                                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1">HS%</p>
                                                    <p className="font-mono text-slate-300">
                                                        {me?.stats ? Math.round((me.stats.headshots / (me.stats.headshots + me.stats.bodyshots + me.stats.legshots || 1)) * 100) : 0}%
                                                    </p>
                                                </div>

                                                {/* Date & Indicator - col-span-2 */}
                                                <div className="col-span-4 md:col-span-2 text-right hidden sm:block">
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 tabular-nums">
                                                        {match.metadata?.game_start_patched ? new Date(match.metadata.game_start_patched).toLocaleDateString() : ""}
                                                    </p>
                                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden max-w-[80px] ml-auto">
                                                        <div className={`h-full ${actuallyWon ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} style={{ width: '40%' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                 <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl text-slate-500">
                                     <Sword className="h-10 w-10 mb-4 opacity-20" />
                                     <p className="text-xs font-black uppercase tracking-widest">No Recent Activity</p>
                                 </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
