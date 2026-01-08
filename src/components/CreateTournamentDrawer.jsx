"use client";
import { useState } from "react";
import { createTournament } from "@/lib/tournaments";
import { X, Trophy, Calendar, Users, Info, Gamepad2 } from "lucide-react";
import Loader from "@/components/Loader";

export default function CreateTournamentDrawer({ isOpen, onClose, onSuccess }) {
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

  if (!isOpen) return null;

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
            description: formData.description,
            status: formData.status,
            location: formData.location || "Online",
            checkInEnabled: formData.checkInEnabled,
            checkInStart: formData.checkInEnabled && formData.checkInStart ? new Date(formData.checkInStart).toISOString() : null,
            registeredTeams: 0,
            bracketGenerated: false
        };

        await createTournament(tournamentData);
        onSuccess();
        onClose();
        // Reset form
        setFormData({
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
    } catch (error) {
        console.error("Failed to create tournament", error);
        alert("Failed to create tournament");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-950/50">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-rose-500" />
                New Tournament
              </h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-black">Admin Panel</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} id="create-tournament-form" className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Tournament Title</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Asia Deathmatch Series"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date & Time
                    </label>
                    <input 
                      type="datetime-local" 
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      onClick={(e) => e.target.showPicker()}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50 outline-none transition-all [color-scheme:dark] cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-amber-500" /> Prize Pool
                    </label>
                    <input 
                      type="text" 
                      required
                      value={formData.prizePool}
                      onChange={(e) => setFormData({...formData, prizePool: e.target.value})}
                      placeholder="₹3,000"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Game Settings */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                 <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1">
                      <Gamepad2 className="h-3 w-3" /> Game Mode
                    </label>
                    <select
                      value={formData.gameType}
                      onChange={(e) => setFormData({...formData, gameType: e.target.value})}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="5v5">5v5 Tournament</option>
                      <option value="Deathmatch">Deathmatch</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1">
                      <Users className="h-3 w-3" /> Max Slots
                    </label>
                    <input 
                      type="number" 
                      required
                      value={formData.maxTeams}
                      onChange={(e) => setFormData({...formData, maxTeams: e.target.value})}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Location</label>
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Online"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Check-in Settings */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Enable Check-in</label>
                    <button 
                        type="button"
                        onClick={() => setFormData({...formData, checkInEnabled: !formData.checkInEnabled})}
                        className={`w-10 h-5 rounded-full relative transition-colors ${formData.checkInEnabled ? 'bg-rose-500' : 'bg-slate-800'}`}
                    >
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.checkInEnabled ? 'translate-x-5' : ''}`} />
                    </button>
                </div>
                {formData.checkInEnabled && (
                    <div className="animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Check-in Opens At</label>
                        <input 
                            type="datetime-local" 
                            required={formData.checkInEnabled}
                            value={formData.checkInStart}
                            onChange={(e) => setFormData({...formData, checkInStart: e.target.value})}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50 outline-none transition-all [color-scheme:dark]"
                        />
                    </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1">
                    <Info className="h-3 w-3" /> About / Rules
                  </label>
                  <textarea 
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter tournament rules, map pool, and general info..."
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-slate-950/50">
            <button 
              type="submit" 
              form="create-tournament-form"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-900/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader fullScreen={false} size="sm" />
                  Creating...
                </>
              ) : (
                 "Publish Tournament"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
