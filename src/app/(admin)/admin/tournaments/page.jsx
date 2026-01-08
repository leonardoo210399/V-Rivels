"use client";
import { useEffect, useState } from "react";
import { getTournaments, deleteTournament } from "@/lib/tournaments";
import { Trophy, Calendar, Users, Trash2, ExternalLink, Plus, Edit2 } from "lucide-react";
import Link from "next/link";
import CreateTournamentDrawer from "@/components/CreateTournamentDrawer";

export default function AdminTournamentsPage() {
    const [tournaments, setTournaments] = useState([]);
    const [registrationCounts, setRegistrationCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const loadTournaments = async () => {
        setLoading(true);
        try {
            const [tData, regsRes] = await Promise.all([
                getTournaments(),
                // Import databases from lib/appwrite to fetch all registrations
                // or use a utility if available. For now, let's just use the tournaments list.
                // We'll actually fetch all registrations to count them.
                import("@/lib/appwrite").then(m => m.databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID,
                    []
                ))
            ]);
            
            // Count registrations per tournament
            const counts = {};
            regsRes.documents.forEach(reg => {
                counts[reg.tournamentId] = (counts[reg.tournamentId] || 0) + 1;
            });
            
            setRegistrationCounts(counts);
            setTournaments(tData);
        } catch (error) {
            console.error("Failed to load tournaments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTournaments();
    }, []);



    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Manage Tournaments</h1>
                    <p className="text-slate-400 mt-1">Create, edit and monitor your Valorant events</p>
                </div>
                <button 
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center gap-2 bg-rose-600 px-4 py-2 rounded-lg font-bold text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                >
                    <Plus className="h-4 w-4" />
                    New Tournament
                </button>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50 border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                                <th className="px-6 py-4">Tournament</th>
                                <th className="px-6 py-4">Mode</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Registered</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4">
                                            <div className="h-8 bg-white/5 rounded w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : tournaments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-medium">
                                        No tournaments found. Create your first one!
                                    </td>
                                </tr>
                            ) : (
                                tournaments.map((t) => (
                                    <tr key={t.$id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                                                    <Trophy className="h-4 w-4" />
                                                </div>
                                                <Link href={`/admin/tournaments/${t.$id}`} className="group/name block">
                                                    <p className="font-bold text-white group-hover/name:text-rose-500 transition-colors uppercase tracking-tight">{t.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono">{t.$id}</p>
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-white uppercase px-2 py-1 rounded bg-slate-950 border border-white/5">
                                                {t.gameType || "5v5"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-400 text-sm" suppressHydrationWarning>
                                                <Calendar className="h-3 w-3" />
                                                {new Date(t.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                             <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-white font-bold text-sm">
                                                    <Users className="h-3 w-3 text-rose-500" />
                                                    {registrationCounts[t.$id] || 0} / {t.maxTeams}
                                                </div>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${
                                                    (t.maxTeams - (registrationCounts[t.$id] || 0)) <= 2 ? "text-rose-500 animate-pulse" : "text-emerald-500"
                                                }`}>
                                                    {(t.maxTeams - (registrationCounts[t.$id] || 0))} SLOTS LEFT
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                                (t.status || 'open') === 'open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'
                                            }`}>
                                                {t.status || 'open'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <Link 
                                                    href={`/admin/tournaments/${t.$id}`}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-rose-600 transition-all"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                    Manage
                                                </Link>
                                                <Link 
                                                    href={`/tournaments/${t.$id}`}
                                                    target="_blank"
                                                    className="p-2 bg-slate-950 border border-white/5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                                    title="View Public Page"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateTournamentDrawer 
                isOpen={isDrawerOpen} 
                onClose={() => setIsDrawerOpen(false)} 
                onSuccess={loadTournaments}
            />
        </div>
    );
}
