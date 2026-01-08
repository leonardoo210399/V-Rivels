"use client";
import { useEffect, useState, use } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { User, Trophy, Crosshair, MapPin, Gauge, Activity, Sword, Skull, Target } from "lucide-react";
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
                tournamentsPlayed: registrations.total
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
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="relative bg-slate-900/50 border border-white/10 rounded-2xl p-8 mb-8 overflow-hidden">
                    <div 
                        className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
                        style={{ backgroundImage: valorantStats?.card?.wideArt ? `url(${valorantStats.card.wideArt})` : 'none' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
                    
                    <div className="relative flex flex-col md:flex-row items-center gap-8 z-10">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-2xl bg-slate-800 border-4 border-slate-900 shadow-xl flex items-center justify-center overflow-hidden">
                                {valorantStats?.card?.smallArt ? (
                                    <img src={valorantStats.card.smallArt} alt="Player Card" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="h-16 w-16 text-slate-500" />
                                )}
                            </div>
                            {valorantStats?.account?.account_level && (
                                <div className="absolute -bottom-3 -right-3 bg-slate-900 border border-white/10 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                    Lvl {valorantStats.account.account_level}
                                </div>
                            )}
                        </div>
                        
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                {profile.ingameName}
                                <span className="text-slate-500 text-2xl">#{profile.tag}</span>
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <div className="flex items-center gap-2 text-slate-300 text-sm bg-black/40 border border-white/5 px-3 py-1.5 rounded-full backdrop-blur-md">
                                    <Trophy className="h-4 w-4 text-emerald-500" />
                                    <span>{dbStats?.tournamentsPlayed || 0} Tournaments</span>
                                </div>
                                {valorantStats?.mmr?.current_data?.currenttierpatched && (
                                    <div className="flex items-center gap-2 text-slate-300 text-sm bg-black/40 border border-white/5 px-3 py-1.5 rounded-full backdrop-blur-md">
                                        <Activity className="h-4 w-4 text-rose-500" />
                                        <span>{valorantStats.mmr.current_data.currenttierpatched}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Riot Details */}
                    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 h-full">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Crosshair className="h-5 w-5 text-rose-500" />
                            Riot Identity
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <span className="text-slate-400">Riot ID</span>
                                <span className="text-white font-mono">{profile.ingameName}#{profile.tag}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <span className="text-slate-400">Region</span>
                                <span className="text-white">{valorantStats?.account?.region?.toUpperCase() || "EU (Default)"}</span> 
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <span className="text-slate-400">Last Updated</span>
                                <span className="text-white text-sm">{valorantStats?.account?.last_update || "Unknown"}</span> 
                            </div>
                        </div>
                    </div>

                    {/* Competitive Stats */}
                     <div className="relative group bg-slate-900/50 border border-white/10 rounded-2xl p-6 h-full transition-all hover:bg-slate-900/80 overflow-hidden">
                        {/* Background Rank Glow */}
                        <div className={`absolute -right-20 -top-20 w-64 h-64 blur-[100px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-30 
                            ${valorantStats?.mmr?.current_data?.currenttierpatched?.includes('Platinum') ? 'bg-cyan-500' : 
                              valorantStats?.mmr?.current_data?.currenttierpatched?.includes('Diamond') ? 'bg-purple-500' :
                              valorantStats?.mmr?.current_data?.currenttierpatched?.includes('Ascendant') ? 'bg-emerald-500' :
                              valorantStats?.mmr?.current_data?.currenttierpatched?.includes('Immortal') ? 'bg-rose-500' :
                              valorantStats?.mmr?.current_data?.currenttierpatched?.includes('Radiant') ? 'bg-yellow-500' : 'bg-slate-500'}`} 
                        />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <Gauge className="h-4 w-4" />
                                    Competitive
                                </h2>
                                {valorantStats?.mmr?.highest_rank?.patched_tier && (
                                     <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                                         <Trophy className="h-3 w-3 text-yellow-500" />
                                         <span className="text-[10px] font-black uppercase text-yellow-500">
                                             PEAK: {valorantStats.mmr.highest_rank.patched_tier}
                                         </span>
                                     </div>
                                )}
                            </div>

                            {valorantStats?.mmr?.current_data?.currenttierpatched ? (
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                                    <div className="relative shrink-0 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full" />
                                        <img 
                                            src={valorantStats.mmr.current_data.images.large} 
                                            alt="Rank" 
                                            className="h-32 w-32 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform group-hover:scale-110 duration-500"
                                        />
                                        {valorantStats.mmr.current_data.mmr_change_to_last_game !== undefined && (
                                            <div className={`absolute -bottom-2 px-2 py-0.5 rounded text-[10px] font-black border z-20 shadow-lg
                                                ${valorantStats.mmr.current_data.mmr_change_to_last_game >= 0 
                                                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                                                    : 'bg-rose-500/20 border-rose-500/30 text-rose-400'}`}>
                                                {valorantStats.mmr.current_data.mmr_change_to_last_game >= 0 ? '+' : ''}{valorantStats.mmr.current_data.mmr_change_to_last_game}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 w-full flex flex-col justify-center text-center sm:text-left">
                                        <div className="mb-6">
                                            <p className="text-3xl font-black text-white tracking-tight mb-1">
                                                {valorantStats.mmr.current_data.currenttierpatched}
                                            </p>
                                            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1">
                                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                                    Global ELO: <span className="text-slate-300">{valorantStats.mmr.current_data.elo}</span>
                                                </p>
                                                {/* Calculate Winrate if we find current act stats */}
                                                {(() => {
                                                    // Find current act by looking at the most recent key in by_season that isn't an error
                                                    const seasons = Object.keys(valorantStats.mmr.by_season || {});
                                                    const currentSeason = seasons[0]; // Usually first choice
                                                    const stats = valorantStats.mmr.by_season[currentSeason];
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

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase text-slate-400">Rating Progress</span>
                                                <span className="text-sm font-mono font-bold text-white">
                                                    {valorantStats.mmr.current_data.ranking_in_tier}<span className="text-slate-500 ml-1">RR</span>
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.2)]
                                                        ${valorantStats.mmr.current_data.currenttierpatched?.includes('Platinum') ? 'bg-cyan-400' : 
                                                          valorantStats.mmr.current_data.currenttierpatched?.includes('Diamond') ? 'bg-purple-400' :
                                                          valorantStats.mmr.current_data.currenttierpatched?.includes('Ascendant') ? 'bg-emerald-400' : 'bg-white'}`}
                                                    style={{ width: `${valorantStats.mmr.current_data.ranking_in_tier}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <div className="h-24 w-24 rounded-full bg-slate-950 flex items-center justify-center border border-white/5 mb-4 group-hover:border-slate-500/20 transition-all">
                                        <img 
                                            src="https://media.valorant-api.com/competitivetiers/03621f13-43b2-ad59-3904-c3a77a961e97/0/largeicon.png" 
                                            alt="Unranked" 
                                            className="h-16 w-16 opacity-10 grayscale"
                                        />
                                    </div>
                                    <p className="text-white font-black uppercase tracking-widest text-sm">Unranked</p>
                                    <p className="text-slate-600 text-[10px] font-bold uppercase mt-2">Finish placements to see stats</p>
                                </div>
                            )}
                        </div>
                     </div>
                </div>

                {/* Match History */}
                <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Sword className="h-5 w-5 text-amber-500" />
                        Match History
                    </h2>

                    {Array.isArray(matches) && matches.length > 0 ? (
                        <div className="space-y-4">
                            {matches.filter(m => m && m.metadata).map((match) => {
                                // Find 'me' (the user being viewed) in this match
                                const me = match.players?.all_players?.find(p => p.puuid === valorantStats?.account?.puuid);
                                
                                // Reliable WIN/LOSS logic
                                const myTeamSide = me?.team?.toLowerCase(); // 'blue' or 'red'
                                const winningTeamSide = (match.teams?.blue?.has_won ? 'blue' : match.teams?.red?.has_won ? 'red' : null);
                                const actuallyWon = myTeamSide && winningTeamSide && myTeamSide === winningTeamSide;

                                return (
                                    <div key={match.metadata?.matchid || Math.random()} className={`flex items-center justify-between p-4 rounded-xl border border-white/5 ${actuallyWon ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : 'bg-rose-500/10 hover:bg-rose-500/20'} transition-all`}>
                                        <div className="flex items-center gap-4">
                                            {me?.assets?.agent?.small ? (
                                                <img src={me.assets.agent.small} alt="Agent" className="h-10 w-10 rounded-full bg-slate-800 border border-white/10" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] text-slate-500">Agent</div>
                                            )}
                                            <div>
                                                <p className="font-bold text-white leading-tight">{match.metadata?.map || "Unknown Map"}</p>
                                                <p className={`text-[10px] font-black uppercase tracking-wider ${actuallyWon ? 'text-emerald-500' : 'text-rose-500'}`}>{actuallyWon ? "Victory" : "Defeat"}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6 md:gap-12 text-sm z-10">
                                            <div className="text-center">
                                                <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">K/D/A</p>
                                                <p className="font-mono text-white text-base">
                                                    {me?.stats?.kills || 0}<span className="text-slate-600">/</span>{me?.stats?.deaths || 0}<span className="text-slate-600">/</span>{me?.stats?.assists || 0}
                                                </p>
                                            </div>
                                            <div className="text-center hidden sm:block">
                                                <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Combat</p>
                                                <p className="font-mono text-white">{me?.stats?.score || 0}</p>
                                            </div>
                                            <div className="text-center hidden md:block">
                                                <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">HS%</p>
                                                <p className="font-mono text-slate-300">
                                                     {me?.stats ? Math.round((me.stats.headshots / (me.stats.headshots + me.stats.bodyshots + me.stats.legshots || 1)) * 100) : 0}%
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                             <p className="text-[10px] text-slate-500 font-bold uppercase">{match.metadata?.mode || "Match"}</p>
                                             <p className="text-[10px] text-slate-600 mt-1">
                                                {match.metadata?.game_start_patched ? new Date(match.metadata.game_start_patched).toLocaleDateString() : ""}
                                             </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                             <p>No recent matches found.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
}
