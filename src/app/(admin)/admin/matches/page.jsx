"use client";
import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Loader2, Swords, User, Users, ShieldCheck, Calendar, Info, Trophy, ChevronRight } from "lucide-react";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const REGISTRATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID;
const TOURNAMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TOURNAMENTS_COLLECTION_ID;

export default function AdminMatchesPage() {
    const [groupedData, setGroupedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState({});

    const toggle = (id) => {
        setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
    };

    useEffect(() => {
        async function loadData() {
            try {
                const [regsRes, tourRes] = await Promise.all([
                    databases.listDocuments(DATABASE_ID, REGISTRATIONS_COLLECTION_ID),
                    databases.listDocuments(DATABASE_ID, TOURNAMENTS_COLLECTION_ID)
                ]);

                const tournaments = tourRes.documents;
                const registrations = regsRes.documents;

                // Group registrations by tournamentId
                const grouped = tournaments.map(tournament => {
                    const tournamentRegs = registrations.filter(r => r.tournamentId === tournament.$id);
                    return {
                        tournament,
                        registrations: tournamentRegs
                    };
                });

                // Sort by tournament date (newest first)
                grouped.sort((a, b) => new Date(b.tournament.date) - new Date(a.tournament.date));

                setGroupedData(grouped);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const parseMetadata = (metadata) => {
        try {
            return JSON.parse(metadata);
        } catch (e) {
            return null;
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Match Registrations</h1>
                <p className="text-slate-400 mt-1">Review team rosters and tournament entries</p>
            </div>

            <div className="space-y-4">
                {groupedData.length === 0 ? (
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-12 text-center text-slate-500">
                        No tournaments found.
                    </div>
                ) : (
                    groupedData.map(({ tournament, registrations }) => {
                        const is5v5 = tournament.gameType === "5v5";
                        const isCollapsed = collapsed[tournament.$id];

                        return (
                            <div key={tournament.$id} className="bg-slate-950/30 border border-white/5 rounded-2xl overflow-hidden transition-all">
                                {/* Tournament Header */}
                                <div 
                                    onClick={() => toggle(tournament.$id)}
                                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors select-none"
                                >
                                    <div className={`p-3 rounded-xl transition-all ${isCollapsed ? 'bg-slate-900 text-slate-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                        <Trophy className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-lg font-black uppercase text-white tracking-tight">
                                                {tournament.name}
                                            </h2>
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                                {tournament.gameType}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 font-medium" suppressHydrationWarning>
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {new Date(tournament.date).toLocaleDateString()}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span className={`flex items-center gap-1.5 ${registrations.length > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                                                <Users className="h-3.5 w-3.5" />
                                                {registrations.length} Teams Registered
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        {registrations.length === 0 && (
                                            <div className="px-3 py-1.5 bg-slate-900 rounded-lg text-slate-600 text-[10px] font-bold uppercase tracking-wider hidden md:block">
                                                No Registrations
                                            </div>
                                        )}
                                        <ChevronRight className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-90'}`} />
                                    </div>
                                </div>

                                {/* Registrations Grid */}
                                {!isCollapsed && registrations.length > 0 && (
                                    <div className="p-4 pt-0 border-t border-white/5 mt-4 bg-slate-900/20">
                                        <div className="grid gap-4 mt-4">
                                            {registrations.map((reg) => {
                                            const meta = parseMetadata(reg.metadata);

                                            if (!is5v5) {
                                                // Simplified View for Deathmatch (Single Player)
                                                return (
                                                    <div key={reg.$id} className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm group hover:border-rose-500/20 transition-all flex items-center justify-between p-4 px-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 text-rose-500 relative">
                                                                <User className="h-5 w-5" />
                                                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-slate-900">
                                                                    <ShieldCheck className="h-2 w-2 text-slate-900 fill-current" />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="text-lg font-bold text-white tracking-tight">
                                                                        {meta?.playerName || reg.teamName}
                                                                    </h3>
                                                                    {meta?.playerName && reg.teamName !== meta.playerName && (
                                                                         <span className="text-xs text-slate-500 font-medium">({reg.teamName})</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-2" suppressHydrationWarning>
                                                                    Registered {new Date(reg.registeredAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            <div className={`px-4 py-2 rounded-lg border text-xs font-black uppercase tracking-widest ${
                                                                reg.paymentStatus 
                                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                            }`}>
                                                                {reg.paymentStatus ? 'Paid' : 'Pending'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Default View for 5v5 (Team Based)
                                            return (
                                                <div key={reg.$id} className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm group hover:border-rose-500/20 transition-all">
                                                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="flex items-start gap-4">
                                                            <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-rose-500">
                                                                <Users className="h-6 w-6" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xl font-bold text-white tracking-tight mb-1">{reg.teamName}</h3>
                                                                <p className="text-xs text-slate-500 uppercase tracking-widest font-black flex items-center gap-2" suppressHydrationWarning>
                                                                    Registered {new Date(reg.registeredAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-4">
                                                            <div className={`px-4 py-2 rounded-lg border text-xs font-black uppercase tracking-widest ${
                                                                reg.paymentStatus 
                                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                            }`}>
                                                                {reg.paymentStatus ? 'Paid' : 'Pending'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Roster Section */}
                                                    <div className="bg-slate-950/30 border-t border-white/5 p-6">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <ShieldCheck className="h-4 w-4" />
                                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Verified Roster</h4>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                                            {meta?.members ? (
                                                                meta.members.map((m, i) => (
                                                                    <div key={i} className="flex flex-col p-3 bg-slate-900 rounded-xl border border-white/5 transition-all hover:border-emerald-500/30">
                                                                        <span className="text-[10px] text-slate-600 font-bold uppercase mb-1">Member {i+1}</span>
                                                                        <span className="text-sm font-bold text-white truncate">{m.name}</span>
                                                                        <span className="text-[10px] text-rose-500 font-mono italic">#{m.tag}</span>
                                                                    </div>
                                                                ))
                                                            ) : meta?.playerName ? (
                                                                <div className="flex flex-col p-3 bg-slate-900 rounded-xl border border-white/5 border-emerald-500/30">
                                                                    <span className="text-[10px] text-slate-600 font-bold uppercase mb-1">Individual Player</span>
                                                                    <span className="text-sm font-bold text-white truncate">{meta.playerName}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="col-span-full flex items-center gap-2 p-3 bg-slate-900 rounded-xl border border-white/5 text-slate-500 italic text-sm">
                                                                    <Info className="h-4 w-4" />
                                                                    No specific roster metadata found for this entry.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}
