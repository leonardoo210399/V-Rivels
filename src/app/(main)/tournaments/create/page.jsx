"use client";
import { useState, useEffect } from "react";
import { createTournament } from "@/lib/tournaments";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import Loader from "@/components/Loader";

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
      gameType: "5v5",
      location: "Online",
      checkInEnabled: false,
      checkInStart: ""
  });

  useEffect(() => {
    if (!authLoading) {
        if (!user || !isAdmin) {
            router.push("/tournaments");
        }
    }
  }, [user, authLoading, isAdmin, router]);

  if (authLoading) {
      return <Loader />;
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
            description: formData.description,
            location: formData.location || "Online",
            checkInEnabled: formData.checkInEnabled,
            checkInStart: formData.checkInEnabled && formData.checkInStart ? new Date(formData.checkInStart).toISOString() : null,
            registeredTeams: 0,
            bracketGenerated: false
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
                        className="w-full rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none [color-scheme:dark]"
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
                         placeholder="₹3,000"
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
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-400">Location</label>
                    <input 
                        type="text" 
                        className="w-full rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="Online"
                    />
                </div>
             </div>

             <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-white/5">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-400">Max Teams/Players</label>
                    <input 
                        type="number" 
                        className="w-full rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none"
                        value={formData.maxTeams}
                        onChange={(e) => setFormData({...formData, maxTeams: e.target.value})}
                        required
                    />
                </div>
                <div className="flex items-end pb-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only"
                                checked={formData.checkInEnabled}
                                onChange={(e) => setFormData({...formData, checkInEnabled: e.target.checked})}
                            />
                            <div className={`w-10 h-5 rounded-full transition-colors ${formData.checkInEnabled ? 'bg-rose-500' : 'bg-slate-800'}`} />
                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.checkInEnabled ? 'translate-x-5' : ''}`} />
                        </div>
                        <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Enable Check-in</span>
                    </label>
                </div>
             </div>

             {formData.checkInEnabled && (
                <div className="animate-in slide-in-from-top-2">
                    <label className="mb-1 block text-sm font-medium text-slate-400">Check-in Opens At</label>
                    <input 
                        type="datetime-local" 
                        className="w-full rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none [color-scheme:dark]"
                        value={formData.checkInStart}
                        onChange={(e) => setFormData({...formData, checkInStart: e.target.value})}
                        required={formData.checkInEnabled}
                    />
                </div>
             )}
            
             <div className="pt-4 border-t border-white/5">
                <label className="mb-1 block text-sm font-medium text-slate-400">Description</label>
                <textarea 
                    className="w-full rounded-md border border-white/10 bg-slate-950 px-4 py-2 focus:border-rose-500 focus:outline-none"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Rules, schedule, and other details..."
                />
            </div>

             <button 
                type="submit" 
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-rose-600 py-4 font-black text-white hover:bg-rose-700 disabled:opacity-50 shadow-lg shadow-rose-900/20 transition-all uppercase tracking-widest text-sm"
            >
                {loading ? <Loader fullScreen={false} size="sm" /> : "Publish Tournament"}
            </button>
        </form>
      </div>
    </div>
  );
}
