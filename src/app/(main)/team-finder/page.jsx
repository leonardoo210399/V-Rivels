"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFreeAgents, deleteFreeAgentPost } from "@/lib/players";
import { getAccount, getMMR, getMMRByName, getPlayerCard, getAgents } from "@/lib/valorant";
import { Trash2, Sword, Shield, Crosshair, Zap, Brain, RefreshCw, UserPlus } from "lucide-react";
import Loader from "@/components/Loader";
import Link from "next/link";
import { rankIcons } from "@/assets/images/ranks";
import { agentIcons } from "@/assets/images/agents";

// Fallback icon
const Cloud = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3-1.3-3-3s1.3-3 3-3 1 1.4 1 3h2c0-2.8-2.2-5-5-5S1.5 6.2 1.5 9c0 .4.1.8.2 1.1C.6 15 4.8 19 10 19h7.5c2.5 0 4.5-2 4.5-4.5S20 10 17.5 10c-.3 0-.6.1-.8.2.3-1.4 0-2.8-1.2-3.8" /></svg>;

const ROLE_ICONS = {
    "Duelist": Sword,
    "Controller": Cloud, 
    "Sentinel": Shield,
    "Initiator": Zap,
    "Flex": Brain
};

// Global Memory Cache
const GLOBAL_CACHE = {
    valorantAgents: null,
    playerProfiles: new Map(), // key: name#tag
};


export default function TeamFinderPage() {
    const { user } = useAuth();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableAgents, setAvailableAgents] = useState([]);
    
    // Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("All Roles");
    const [regionFilter, setRegionFilter] = useState("All Regions");

    useEffect(() => {
        loadAgents();
        
        if (GLOBAL_CACHE.valorantAgents) {
            setAvailableAgents(GLOBAL_CACHE.valorantAgents);
        } else {
            getAgents().then(res => {
                GLOBAL_CACHE.valorantAgents = res.data;
                setAvailableAgents(res.data);
            }).catch(console.error);
        }
    }, []);

    const loadAgents = async () => {
        try {
            const data = await getFreeAgents();
            setAgents(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const RoleIcon = ({ role }) => {
        const Icon = ROLE_ICONS[role] || Crosshair;
        return <Icon className="h-4 w-4" />;
    };

    const filteredAgents = agents.filter(agent => {
        const matchesSearch = agent.ingameName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             agent.mainAgent?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "All Roles" || agent.role === roleFilter;
        const matchesRegion = regionFilter === "All Regions" || agent.region?.toLowerCase() === regionFilter.toLowerCase();
        
        return matchesSearch && matchesRole && matchesRegion;
    });

    return (
        <div className="min-h-screen bg-slate-950 pt-24 px-6 pb-12">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">Team Finder</h1>
                        <p className="text-slate-500 text-sm font-medium">Connect with players and teams looking for recruits.</p>
                    </div>
                    <Link 
                        href="/profile"
                        className="group flex items-center gap-3 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg shadow-rose-600/20 text-xs uppercase tracking-widest active:scale-95"
                    >
                        <UserPlus className="h-4 w-4" />
                        Post Your Listing
                    </Link>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <div className="md:col-span-2 relative">
                        <input 
                            type="text"
                            placeholder="Search by name or agent..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500 outline-none transition-all pl-10"
                        />
                        <Crosshair className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                        <select 
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500 outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option>All Roles</option>
                            {Object.keys(ROLE_ICONS).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select 
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500 outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option>All Regions</option>
                            <option value="ap">Asia Pacific</option>
                            <option value="eu">Europe</option>
                            <option value="na">North America</option>
                            <option value="kr">Korea</option>
                            <option value="latam">LATAM</option>
                            <option value="br">Brazil</option>
                        </select>
                    </div>
                </div>



                {/* Listings Grid */}
                {loading ? (
                    <Loader fullScreen={false} />
                ) : filteredAgents.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl">
                        <p className="text-slate-500 mb-2 font-bold uppercase tracking-widest text-xs">No Results Found</p>
                        <p className="text-slate-600 text-sm mb-6">Try adjusting your filters or search terms.</p>
                        <button 
                            onClick={() => {
                                setSearchQuery("");
                                setRoleFilter("All Roles");
                                setRegionFilter("All Regions");
                            }}
                            className="text-rose-500 hover:text-rose-400 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 mx-auto"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAgents.map(agent => (
                            <AgentCard 
                                key={agent.$id} 
                                agent={agent} 
                                currentUser={user} 
                                RoleIcon={RoleIcon}
                                availableAgents={availableAgents}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function AgentCard({ agent, currentUser, RoleIcon, availableAgents }) {
    const [valData, setValData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const executeFetch = async () => {
             const name = agent.tag ? agent.ingameName : agent.ingameName?.split('#')[0];
             const tag = agent.tag || agent.ingameName?.split('#')[1];
             const cacheKey = `${name}#${tag}`.toLowerCase();

             // 1. Check Memory Cache
             if (GLOBAL_CACHE.playerProfiles.has(cacheKey)) {
                setValData(GLOBAL_CACHE.playerProfiles.get(cacheKey));
                setLoading(false);
                return;
             }

             // 2. Fetch if not cached
             setLoading(true);
             try {
                if (!name || !tag) return;
                
                const accountRes = await getAccount(name, tag);
                if (accountRes.data) {
                    let cardData = null;
                    let mmrData = null;

                    // Fetch Card Assets
                    if (accountRes.data.card) {
                        try {
                            const cardRes = await getPlayerCard(accountRes.data.card);
                            cardData = cardRes.data;
                        } catch (e) {
                            console.warn("Card asset fetch failed:", e);
                        }
                    }

                    // Fetch MMR/Rank
                    try {
                        const region = agent.region || accountRes.data.region || 'ap';
                        const mmrRes = await getMMR(accountRes.data.puuid, region);
                        mmrData = mmrRes.data;
                    } catch (e) {
                        try {
                            const region = agent.region || accountRes.data.region || 'ap';
                            const mmrRes = await getMMRByName(region, name, tag);
                            mmrData = mmrRes.data;
                        } catch (e2) {
                            console.warn("MMR fallback failed:", e2);
                        }
                    }

                    const finalData = {
                        account: accountRes.data,
                        mmr: mmrData,
                        card: cardData
                    };
                    
                    // Update State & Cache
                    setValData(finalData);
                    GLOBAL_CACHE.playerProfiles.set(cacheKey, finalData);
                }
             } catch (e) {
                console.error("AgentCard profile fetch error:", e);
             } finally {
                setLoading(false);
             }
        };

        executeFetch();
    }, [agent.ingameName]);

    const rankDisplay = valData?.mmr?.current_data?.currenttierpatched || "Unranked";
    const currentTier = valData?.mmr?.current_data?.currenttier;
    const rankImage = typeof rankIcons[currentTier] === 'object' ? rankIcons[currentTier]?.src : (rankIcons[currentTier] || valData?.mmr?.current_data?.images?.large || valData?.mmr?.current_data?.images?.small);
    const wideCard = valData?.card?.wideArt;
    const playerCard = valData?.card?.smallArt;

    return (
        <div className="group relative bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:bg-slate-900/80 transition-all overflow-hidden border-b-4"
            style={{ borderBottomColor: 
                rankDisplay?.includes('Platinum') ? '#22d3ee' : 
                rankDisplay?.includes('Diamond') ? '#c084fc' :
                rankDisplay?.includes('Ascendant') ? '#10b981' :
                rankDisplay?.includes('Gold') ? '#facc15' : '#475569'
            }}
        >
            {/* Wide Card Background */}
            {wideCard && (
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-[0.10] pointer-events-none group-hover:opacity-[0.20] transition-opacity duration-500 scale-110 group-hover:scale-100"
                    style={{ backgroundImage: `url(${wideCard})` }}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
            
            {/* Large Decorative Rank Icon */}
            {!loading && rankImage && (
                <div className="absolute -right-2 -top-2 opacity-100 pointer-events-none group-hover:opacity-60 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
                    <img src={rankImage} alt="" className="h-32 w-32 object-contain" />
                </div>
            )}
            
            <div className="relative z-10 flex gap-4 mb-6">
                {/* Player Card Thumbnail */}
                <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-slate-950 overflow-hidden shadow-xl">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                <Loader fullScreen={false} size="sm" />
                            </div>
                        ) : playerCard ? (
                            <img src={playerCard} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900">
                                <Crosshair className="h-8 w-8" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <h3 className="font-black text-white text-lg tracking-tight truncate">
                        {agent.tag ? agent.ingameName : agent.ingameName?.split('#')[0]}
                        <span className="text-slate-500 text-sm ml-1 select-none">
                            #{agent.tag || agent.ingameName?.split('#')[1]}
                        </span>
                    </h3>
                    <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/5 backdrop-blur-md w-fit">
                            {!loading && rankImage && (
                                <img src={rankImage} alt="" className="h-4 w-4 object-contain" />
                            )}
                            <span className={`text-[9px] font-black uppercase tracking-widest
                                ${rankDisplay?.includes('Platinum') ? 'text-cyan-400' : 
                                rankDisplay?.includes('Diamond') ? 'text-purple-400' :
                                rankDisplay?.includes('Ascendant') ? 'text-emerald-400' :
                                rankDisplay?.includes('Gold') ? 'text-yellow-400' : 'text-slate-400'}
                            `}>
                                {rankDisplay}
                            </span>
                        </div>

                        {/* Preferred Role Badge */}
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border backdrop-blur-md w-fit
                            ${agent.role === 'Duelist' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                              agent.role === 'Controller' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                              agent.role === 'Sentinel' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 
                              agent.role === 'Initiator' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-slate-500/10 border-white/5 text-slate-400'}
                        `}>
                            <RoleIcon role={agent.role} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                                {agent.role}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agent Icons Display */}
            <div className="relative z-10 mb-6">
                <div className="flex flex-wrap items-center gap-6">
                    {/* Main Agent */}
                    {agent.mainAgent && (
                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-black uppercase text-rose-500 tracking-[0.2em] leading-none">Main</span>
                            <div className="relative group/main">
                                <div className="absolute -inset-1 bg-rose-500/20 rounded-xl blur opacity-30 group-hover/main:opacity-60 transition-opacity" />
                                <div className="relative w-14 h-14 rounded-xl border-2 border-rose-500 bg-slate-950 overflow-hidden shadow-xl shadow-rose-500/10">
                                    {availableAgents.find(a => a.displayName?.toLowerCase() === agent.mainAgent?.toLowerCase())?.displayIcon ? (
                                        <img 
                                            src={typeof agentIcons[availableAgents.find(a => a.displayName?.toLowerCase() === agent.mainAgent?.toLowerCase()).displayName] === 'object' ? agentIcons[availableAgents.find(a => a.displayName?.toLowerCase() === agent.mainAgent?.toLowerCase()).displayName]?.src : (agentIcons[availableAgents.find(a => a.displayName?.toLowerCase() === agent.mainAgent?.toLowerCase()).displayName] || availableAgents.find(a => a.displayName?.toLowerCase() === agent.mainAgent?.toLowerCase()).displayIcon)} 
                                            alt={agent.mainAgent} 
                                            className="w-full h-full object-cover scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-rose-500 uppercase">
                                            {agent.mainAgent?.substring(0, 2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Secondary Agents */}
                    {(agent.secondaryAgents && agent.secondaryAgents.length > 0) && (
                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] leading-none">Secondary Agents</span>
                            <div className="flex -space-x-3">
                                {agent.secondaryAgents.slice(0, 4).map((name, idx) => {
                                    const agentInfo = availableAgents.find(a => a.displayName?.toLowerCase() === name?.toLowerCase());
                                    const icon = typeof agentIcons[agentInfo?.displayName] === 'object' ? agentIcons[agentInfo?.displayName]?.src : (agentIcons[agentInfo?.displayName] || agentInfo?.displayIcon);
                                    return (
                                        <div key={idx} className="relative w-12 h-12 rounded-xl border-2 border-slate-950 bg-slate-900 overflow-hidden hover:z-10 hover:scale-110 transition-all cursor-help shadow-lg" title={name}>
                                            {icon ? (
                                                <img src={icon} alt={name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-500">{name?.substring(0, 1)}</div>
                                            )}
                                        </div>
                                    );
                                })}
                                {agent.secondaryAgents.length > 4 && (
                                    <div className="w-12 h-12 rounded-xl border-2 border-slate-950 bg-slate-950 flex items-center justify-center text-xs font-black text-rose-500 shadow-lg">
                                        +{agent.secondaryAgents.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 mt-4">
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-2">
                    <Brain className="h-3 w-3" />
                    Scouting Report
                </div>
                <p className="text-slate-300 text-sm mb-6 line-clamp-2 min-h-[40px] leading-relaxed italic border-l-2 border-rose-500/30 pl-3">
                    "{agent.description}"
                </p>

                <Link 
                    href={`/player/${agent.userId}`}
                    className="group/btn relative w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-950 border border-white/5 hover:bg-rose-600 hover:border-rose-500 text-white text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        View Player Profile
                        <RefreshCw className="h-3 w-3 group-hover/btn:rotate-180 transition-transform duration-500" />
                    </span>
                </Link>
            </div>


        </div>
    );
}
