"use client";
import { useState, useEffect } from "react";
import { createTournament } from "@/lib/tournaments";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function CreateTournamentPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
      name: "",
      date: "",
      prizePool: "",
      maxTeams: 16,
      status: "open",
      description: "",
      gameType: "5v5" // Default value
  });

  useEffect(() => {
    if (!authLoading) {
        if (!user || !isAdmin) {
            router.push("/tournaments");
        }
    }
  }, [user, authLoading, isAdmin, router]);

  if (authLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
            <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
        </div>
      );
  }

  if (!user || !isAdmin) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const tournamentData = {
            name: formData.name,
            date: new Date(formData.date).toISOString(),
            prizePool: formData.prizePool,
            maxTeams: parseInt(formData.maxTeams),
            gameType: formData.gameType,
            status: formData.status,
            location: "Online", // default from schema
            registeredTeams: 0
        };

        await createTournament(tournamentData);
        router.push("/tournaments");
    } catch (error) {
        console.error("Failed to create tournament", error);
        alert("Failed to create tournament (Check console - likely permission or DB issue)");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-sm">
        <h1 className="mb-6 text-2xl font-bold">Create Tournament</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">Tournament Name</label>
                <input 
                    type="text" 
                    className="w-full rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                />
            </div>
            
             <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-400">Date</label>
                    <input 
                        type="datetime-local" 
                        className="w-full rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none" // Calendar icon might be dark, but built-in
                         value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                    />
                </div>
                 <div>
                    <label className="mb-1 block text-sm font-medium text-slate-400">Prize Pool</label>
                    <input 
                        type="text" 
                         className="w-full rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none"
                         placeholder="$1000"
                         value={formData.prizePool}
                        onChange={(e) => setFormData({...formData, prizePool: e.target.value})}
                        required
                    />
                </div>
                <div>
                     <label className="mb-1 block text-sm font-medium text-slate-400">Game Type</label>
                     <select
                        className="w-full rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none text-white"
                        value={formData.gameType}
                        onChange={(e) => setFormData({...formData, gameType: e.target.value})}
                     >
                        <option value="5v5">5v5</option>
                        <option value="Deathmatch">Deathmatch</option>
                     </select>
                </div>
             </div>
             
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">Max Teams</label>
                <input 
                    type="number" 
                    className="w-full rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none"
                    value={formData.maxTeams}
                    onChange={(e) => setFormData({...formData, maxTeams: e.target.value})}
                    required
                />
            </div>
            
             <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">Description</label>
                <textarea 
                    className="w-full rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
            </div>

             <button 
                type="submit" 
                disabled={loading}
                className="flex w-full items-center justify-center rounded-md bg-rose-600 py-3 font-medium text-white hover:bg-rose-700 disabled:opacity-50"
            >
                {loading ? <Loader2 className="h-5 w-5 animate-spin"/> : "Create Tournament"}
            </button>
        </form>
      </div>
    </div>
  );
}
