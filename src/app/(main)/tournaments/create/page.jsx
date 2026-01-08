"use client";
import { useState, useEffect, useRef } from "react";
import { createTournament } from "@/lib/tournaments";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Bold, List, Heading2, Eye, Edit3, Type, Undo2, Redo2 } from "lucide-react";

import Loader from "@/components/Loader";

// Import the same parser logic used in the detail page
const RichPreview = ({ text }) => {
    if (!text) return <p className="text-slate-600 italic text-sm">Preview will appear here...</p>;
    const lines = text.split('\n');
    return (
        <div className="space-y-3 p-4 rounded-md bg-slate-950/30 border border-white/5 min-h-[150px]">
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-2" />;
                const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
                let content = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed;
                const parts = content.split(/(\*\*.*?\*\*)/g);
                const formattedContent = parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <span key={j} className="font-bold text-white">{part.slice(2, -2)}</span>;
                    }
                    return part;
                });
                if (isBullet) {
                    return (
                        <div key={i} className="flex gap-3 pl-2 items-start">
                            <div className="mt-2 h-1 w-1 rounded-full bg-rose-500 shrink-0" />
                            <p className="text-sm text-slate-300 leading-relaxed">{formattedContent}</p>
                        </div>
                    );
                }
                const isHeader = !isBullet && ((trimmed === trimmed.toUpperCase() && trimmed.length > 3) || /^[A-Z\s]{4,}:/.test(trimmed));
                return (
                    <p key={i} className={`text-sm leading-relaxed ${isHeader ? 'font-bold text-rose-500 uppercase tracking-wider text-xs pt-2' : 'text-slate-400'}`}>
                        {formattedContent}
                    </p>
                );
            })}
        </div>
    );
};

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
  const [showPreview, setShowPreview] = useState(false);
  const [history, setHistory] = useState([formData.description]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const textareaRef = useRef(null);

  const updateDescription = (newText) => {
    setFormData(prev => ({ ...prev, description: newText }));
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newText);
    if (newHistory.length > 50) newHistory.shift(); // Limit history
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setFormData(prev => ({ ...prev, description: history[newIndex] }));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setFormData(prev => ({ ...prev, description: history[newIndex] }));
    }
  };

  const insertFormat = (prefix, suffix = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.description;
    const selection = text.substring(start, end);
    
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    // If it's a list item, check if we need a newline
    let finalPrefix = prefix;
    if (prefix === "• " && before.length > 0 && !before.endsWith('\n')) {
        finalPrefix = "\n• ";
    }

    const newText = before + finalPrefix + selection + suffix + after;
    
    setFormData({ ...formData, description: newText });
    
    // Reset focus and selection
    setTimeout(() => {
        textarea.focus();
        const cursorOffset = finalPrefix.length;
        textarea.setSelectionRange(start + cursorOffset, end + cursorOffset);
    }, 0);
  };

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
                <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-400">Description / Rules</label>
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-white/5">
                        <button 
                            type="button"
                            onClick={() => setShowPreview(false)}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${!showPreview ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            <div className="flex items-center gap-1.5">
                                <Edit3 className="h-3 w-3" />
                                Edit
                            </div>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setShowPreview(true)}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${showPreview ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                             <div className="flex items-center gap-1.5">
                                <Eye className="h-3 w-3" />
                                Preview
                            </div>
                        </button>
                    </div>
                </div>

                {!showPreview ? (
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-950 border border-white/10 rounded-t-md border-b-0">
                            <button 
                                type="button" 
                                onClick={() => insertFormat("**", "**")}
                                title="Bold"
                                className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors"
                            >
                                <Bold className="h-4 w-4" />
                            </button>
                            <button 
                                type="button" 
                                onClick={() => insertFormat("• ")}
                                title="Bullet List"
                                className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors"
                            >
                                <List className="h-4 w-4" />
                            </button>
                            <button 
                                type="button" 
                                onClick={() => insertFormat("HEADER: \n")}
                                title="Section Header"
                                className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors"
                            >
                                <Heading2 className="h-4 w-4" />
                            </button>
                            <div className="h-4 w-[1px] bg-white/5 mx-1" />
                            <button 
                                type="button" 
                                onClick={undo}
                                disabled={historyIndex === 0}
                                title="Undo"
                                className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors disabled:opacity-20"
                            >
                                <Undo2 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                                type="button" 
                                onClick={redo}
                                disabled={historyIndex === history.length - 1}
                                title="Redo"
                                className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors disabled:opacity-20"
                            >
                                <Redo2 className="h-3.5 w-3.5" />
                            </button>
                            <div className="h-4 w-[1px] bg-white/5 mx-1" />
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest pl-2">Styling Toolbar</span>
                        </div>
                        <textarea 
                            ref={textareaRef}
                            className="w-full rounded-b-md border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white focus:border-rose-500 focus:outline-none min-h-[200px]"
                            rows={8}
                            value={formData.description}
                            onChange={(e) => updateDescription(e.target.value)}
                            placeholder="**MISSION STATEMENT**&#10;Welcome to our tournament...&#10;&#10;• Rule 1...&#10;• Rule 2..."
                        />
                    </div>
                ) : (
                    <RichPreview text={formData.description} />
                )}
                <p className="mt-2 text-[10px] text-slate-500 italic">
                    Tip: Use **text** for bold, • for lists, and ALL CAPS for headers.
                </p>
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
