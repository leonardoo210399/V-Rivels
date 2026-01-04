"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Users, Trophy, Swords, Zap, Loader2 } from "lucide-react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users"; 
const TOURNAMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TOURNAMENTS_COLLECTION_ID;
const REGISTRATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
      users: 0,
      tournaments: 0,
      registrations: 0
  });

  const fetchCounts = async () => {
      try {
          setLoading(true);
          const [usersRes, tournamentsRes, regsRes] = await Promise.all([
              databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, []),
              databases.listDocuments(DATABASE_ID, TOURNAMENTS_COLLECTION_ID, []),
              databases.listDocuments(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, [Query.limit(100)])
          ]);

          // Filter out orphans for the total count display
          const liveRegs = regsRes.documents.filter(reg => 
              tournamentsRes.documents.some(t => t.$id === reg.tournamentId)
          );

          setCounts({
              users: usersRes.total,
              tournaments: tournamentsRes.total,
              registrations: liveRegs.length
          });
      } catch (error) {
          console.error("Failed to fetch admin stats", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const stats = [
    { name: 'Total Users', value: counts.users, icon: Users, change: 'Lifetime', trend: 'neutral' },
    { name: 'Tournaments', value: counts.tournaments, icon: Trophy, change: 'Active', trend: 'neutral' },
    { name: 'Registrations', value: counts.registrations, icon: Swords, change: 'Live', trend: 'neutral' },
    { name: 'Server Status', value: 'Online', icon: Zap, change: 'API Live', trend: 'up' },
  ];

  const handleCleanup = async () => {
    if (!window.confirm("This will permanently delete registrations associated with tournaments that no longer exist. Continue?")) return;
    
    try {
        setLoading(true);
        const [tRes, rRes] = await Promise.all([
            databases.listDocuments(DATABASE_ID, TOURNAMENTS_COLLECTION_ID),
            databases.listDocuments(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, [Query.limit(100)])
        ]);
        
        const orphans = rRes.documents.filter(reg => 
            !tRes.documents.some(t => t.$id === reg.tournamentId)
        );
        
        if (orphans.length === 0) {
            alert("No orphaned records found!");
            return;
        }

        // Deleting in parallel
        await Promise.all(orphans.map(o => 
            databases.deleteDocument(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, o.$id)
        ));
        
        alert(`Successfully deleted ${orphans.length} orphaned registrations!`);
        fetchCounts();
    } catch (e) {
        console.error("Cleanup failed", e);
        alert("Failed to cleanup: " + e.message + "\n\nNote: Ensure the Admin has 'Delete' permission on the Registrations collection in Appwrite.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Admin Overview</h1>
                <p className="text-slate-400 mt-1">Logged in as {user?.name}</p>
            </div>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-rose-500" />}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div key={stat.name} className="relative overflow-hidden bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm group hover:border-rose-500/20 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 group-hover:bg-rose-500/10 transition-colors">
                                <Icon className="h-6 w-6 text-rose-500" />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                                stat.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'
                            }`}>
                                {stat.change}
                            </span>
                        </div>
                        {loading ? (
                            <div className="h-8 w-16 bg-white/5 animate-pulse rounded mb-1" />
                        ) : (
                            <h3 className="text-3xl font-black text-white italic tracking-tighter mb-1">{stat.value}</h3>
                        )}
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.name}</p>
                    </div>
                )
            })}
        </div>
        
        {/* Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                    Quick Actions
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 rounded-xl bg-slate-950 border border-white/5 text-left hover:bg-white/5 transition-all group">
                         <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tournaments</p>
                         <p className="text-sm font-bold text-white group-hover:text-rose-500">Create New</p>
                    </button>
                    <button className="p-4 rounded-xl bg-slate-950 border border-white/5 text-left hover:bg-white/5 transition-all group">
                         <p className="text-xs font-bold text-slate-500 uppercase mb-1">Users</p>
                         <p className="text-sm font-bold text-white group-hover:text-rose-500">View All</p>
                    </button>
                    <button 
                        onClick={handleCleanup}
                        className="p-4 rounded-xl bg-slate-950 border border-white/5 text-left hover:bg-white/5 transition-all group"
                    >
                         <p className="text-xs font-bold text-slate-500 uppercase mb-1">Database</p>
                         <p className="text-sm font-bold text-white group-hover:text-rose-500">Cleanup Records</p>
                    </button>
                    <button className="p-4 rounded-xl bg-slate-950 border border-white/5 text-left hover:bg-white/5 transition-all group">
                         <p className="text-xs font-bold text-slate-500 uppercase mb-1">System</p>
                         <p className="text-sm font-bold text-white group-hover:text-rose-500">Settings</p>
                    </button>
                 </div>
            </div>
             <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    Live Database
                 </h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-white/5">
                        <span className="text-sm text-slate-400">Database Connection</span>
                        <span className="text-xs font-bold text-emerald-500 uppercase">Secure</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-white/5">
                        <span className="text-sm text-slate-400">Total Storage</span>
                        <span className="text-xs font-bold text-white uppercase">4.2 GB</span>
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
}
