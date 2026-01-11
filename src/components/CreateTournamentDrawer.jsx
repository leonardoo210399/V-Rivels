import { useState, useRef, useEffect } from "react";
import { createTournament } from "@/lib/tournaments";
import { X, Trophy, Calendar, Users, Info, Gamepad2, Bold, List, Heading2, Eye, Edit3, Undo2, Redo2, Plus, Trash2 } from "lucide-react";
import Loader from "@/components/Loader";

// Import the same parser logic used in the detail page
const DEFAULT_DM_DESCRIPTION = `**The Deathmatch Arena: Maximum Velocity**

MISSION STATEMENT:
Witness the rawest form of Valorant skill. The Deathmatch Arena is where agents are pushed to their mechanical limits. No abilities, no utility—just aim, movement, and pure tactical instinct. This isn't just about winning; it's about dominating the field and proving who has the sharpest crosshair in the community.

COMPETITIVE DYNAMICS:
- **The Goal**: First player to reach 40 kills or the highest scorer at the 10-minute mark.
- **Standings**: Real-time tracking of kills and deaths. Only the most consistent slayers will climb the official leaderboard.
- **Spawn Mastery**: Players must adapt to rapid re-spawns and maintain map awareness to avoid being caught in crossfires.

EVENT RULES & ETIQUETTE:
- **Mandatory Check-in**: All participants must check-in via the portal 15 minutes before the lobby goes live.
- **Fair Play**: We maintain a zero-tolerance policy for any third-party software or exploits. Our marshals monitor live standings for statistical anomalies.
- **Hardware**: For the best experience, ensure your network connection is stable. Technical disconnects during the match cannot be restarted.

FINAL WORD:
The lobby is waiting. Your rivals are practicing. Every corner is a potential duel and every shot counts towards your legacy. Do you have the composure to maintain a streak, or will you fall in the chaos of the arena?

**Aim True. Kill Fast. Rule the Lobby.**`;

const DEFAULT_5V5_DESCRIPTION = `**The Ultimate Valorant Showdown: Elite Series**

MISSION STATEMENT:
Welcome to the frontier of competitive community Valorant. The Elite Series is more than just a tournament; it’s a proving ground for the next generation of tactical masterminds. Our mission is to provide an uncompromising, professional-grade platform where skill is the only currency and strategy is the ultimate weapon.

COMPETITIVE INTEGRITY & FAIR PLAY:
We believe that the heart of every great tournament is a level playing field. To ensure the highest standards of competitive integrity, every match is monitored by our dedicated tournament marshals. We enforce a zero-tolerance policy regarding toxicity, exploit usage, and unsportsmanlike conduct. We are committed to a server environment where respect is mandatory and the victory is earned or not at all.

TOURNAMENT DYNAMICS:
- **The Format**: This event follows a high-stakes Single Elimination bracket. In this format, every round is a "must-win," heightening the tension and rewarding teams that can adapt under extreme pressure.
- **The Stakes**: Players are competing not just for the prize pool, but for points in our seasonal leaderboard. Consistency across our circuit is the path to being invited to our year-end grand finals.
- **Map Pool**: All matches will be played on current competitive rotation maps. Map vetos will be handled via our integrated system 15 minutes prior to match start.

THE ROAD TO CHAMPIONSHIP:
From the first pistol round of the qualifiers to the final clutch in the Grand Finals, every moment will be tracked on our live Tournament Map. Spectators can follow the progression in real-time, watching as the bracket narrows and favorites are tested.

FINAL WORD:
Prepare your executes, refine your aim, and ensure your comms are crisp. The server is waiting, and the community is watching. Do you have the composure to clutch the win, or will you fall to the pressure of the big stage?

**Lock in. Step up. Reign supreme.**`;

const RichPreview = ({ text }) => {
    if (!text) return <p className="text-slate-600 italic text-sm">Preview will appear here...</p>;
    const lines = text.split('\n');
    return (
        <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-white/5 min-h-[150px]">
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
                    <p key={i} className={`text-sm leading-relaxed ${isHeader ? 'font-bold text-rose-500 uppercase tracking-wider text-[10px] pt-2' : 'text-slate-400'}`}>
                        {formattedContent}
                    </p>
                );
            })}
        </div>
    );
};

export default function CreateTournamentDrawer({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
      name: "",
      date: "",
      prizePool: "",
      maxTeams: 16,
      status: "scheduled",
      description: "",
      gameType: "5v5",
      location: "Online",
      checkInEnabled: false,
      checkInStart: "",
      entryFee: "",
      firstPrize: "",
      secondPrize: "",
      additionalPrizes: []
  });
  const [showPreview, setShowPreview] = useState(false);
  const [history, setHistory] = useState([formData.description]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    const isDefault5v5 = formData.description === DEFAULT_5V5_DESCRIPTION;
    const isDefaultDM = formData.description === DEFAULT_DM_DESCRIPTION;
    const isEmpty = !formData.description || formData.description.trim().length < 5;

    if (isEmpty || isDefault5v5 || isDefaultDM) {
        if (formData.gameType === "Deathmatch" && !isDefaultDM) {
            updateDescription(DEFAULT_DM_DESCRIPTION);
        } else if (formData.gameType === "5v5" && !isDefault5v5) {
            updateDescription(DEFAULT_5V5_DESCRIPTION);
        }
    }
  }, [formData.gameType]);

  const updateDescription = (newText) => {
    setFormData(prev => ({ ...prev, description: newText }));
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newText);
    if (newHistory.length > 50) newHistory.shift();
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
    
    let finalPrefix = prefix;
    if (prefix === "• " && before.length > 0 && !before.endsWith('\n')) {
        finalPrefix = "\n• ";
    }

    const newText = before + finalPrefix + selection + suffix + after;
    setFormData({ ...formData, description: newText });
    
    setTimeout(() => {
        textarea.focus();
        const cursorOffset = finalPrefix.length;
        textarea.setSelectionRange(start + cursorOffset, end + cursorOffset);
    }, 0);
  };

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
            entryFee: formData.entryFee,
            firstPrize: formData.firstPrize,
            secondPrize: formData.secondPrize,
            additionalPrizes: JSON.stringify(formData.additionalPrizes),
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
            status: "scheduled",
            description: "",
            gameType: "5v5",
            location: "Online",
            checkInEnabled: false,
            checkInStart: "",
            entryFee: "",
            firstPrize: "",
            secondPrize: "",
            additionalPrizes: []
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
              {/* Game Settings First */}
              <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1">
                      <Gamepad2 className="h-3 w-3" /> Game Mode
                    </label>
                    <div className="relative flex p-1 bg-slate-950 rounded-xl border border-white/5 h-[46px]">
                        {/* Sliding Background */}
                        <div 
                            className={`absolute inset-y-1 w-[calc(50%-4px)] bg-rose-600 rounded-lg shadow-lg shadow-rose-900/40 transition-all duration-300 ease-out ${
                                formData.gameType === 'Deathmatch' ? 'translate-x-full' : 'translate-x-0'
                            }`}
                        />
                        
                        {/* Options */}
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, gameType: '5v5'})}
                            className={`relative flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                                formData.gameType === '5v5' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            5v5
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, gameType: 'Deathmatch'})}
                            className={`relative flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                                formData.gameType === 'Deathmatch' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            Deathmatch
                        </button>
                    </div>
                  </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4 pt-4 border-t border-white/5">
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
                      <Trophy className="h-3 w-3 text-amber-500" /> Prize Pool (Total)
                    </label>
                    <input 
                      type="text" 
                      required
                      value={formData.prizePool}
                      onChange={(e) => setFormData({...formData, prizePool: e.target.value})}
                      placeholder="e.g. ₹10,000"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1">
                      <Gamepad2 className="h-3 w-3" /> {formData.gameType === 'Deathmatch' ? 'Entry Fee (Head)' : 'Entry Fee (Team)'}
                    </label>
                    <input 
                      type="text" 
                      required
                      value={formData.entryFee}
                      onChange={(e) => setFormData({...formData, entryFee: e.target.value})}
                      placeholder="e.g. ₹500"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50 outline-none transition-all"
                    />
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

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">1st Prize (Winner)</label>
                    <input 
                      type="text" 
                      required
                      value={formData.firstPrize}
                      onChange={(e) => setFormData({...formData, firstPrize: e.target.value})}
                      placeholder="₹5,000"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">2nd Prize (Runner Up)</label>
                    <input 
                      type="text" 
                      required
                      value={formData.secondPrize}
                      onChange={(e) => setFormData({...formData, secondPrize: e.target.value})}
                      placeholder="₹2,500"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none transition-all"
                    />
                  </div>
                </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center justify-between">
                      <span>Additional Prizes (Optional)</span>
                      <button 
                        type="button"
                        onClick={() => setFormData({
                          ...formData, 
                          additionalPrizes: [...formData.additionalPrizes, { label: "", value: "" }]
                        })}
                        className="p-1 rounded-md hover:bg-rose-500/10 text-rose-500 transition-all flex items-center gap-1 text-[9px]"
                      >
                        <Plus className="h-2.5 w-2.5" /> Add Prize
                      </button>
                    </label>
                    <div className="space-y-3">
                      {formData.additionalPrizes.map((prize, index) => (
                        <div key={index} className="flex gap-2 group animate-in slide-in-from-right-2 duration-300">
                          <input 
                            type="text" 
                            value={prize.label}
                            onChange={(e) => {
                              const newPrizes = [...formData.additionalPrizes];
                              newPrizes[index].label = e.target.value;
                              setFormData({ ...formData, additionalPrizes: newPrizes });
                            }}
                            placeholder="e.g. MVP"
                            className="flex-[1.5] bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500/50 outline-none"
                          />
                          <input 
                            type="text" 
                            value={prize.value}
                            onChange={(e) => {
                              const newPrizes = [...formData.additionalPrizes];
                              newPrizes[index].value = e.target.value;
                              setFormData({ ...formData, additionalPrizes: newPrizes });
                            }}
                            placeholder="₹500"
                            className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500/50 outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const newPrizes = formData.additionalPrizes.filter((_, i) => i !== index);
                              setFormData({ ...formData, additionalPrizes: newPrizes });
                            }}
                            className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {formData.additionalPrizes.length === 0 && (
                        <p className="text-[10px] text-slate-600 italic">No additional prizes added yet.</p>
                      )}
                    </div>
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
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                        <Info className="h-3 w-3" /> About / Rules
                    </label>
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-white/5">
                        <button 
                            type="button"
                            onClick={() => setShowPreview(false)}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${!showPreview ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Edit3 className="h-3 w-3" />
                        </button>
                        <button 
                            type="button"
                            onClick={() => setShowPreview(true)}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${showPreview ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Eye className="h-3 w-3" />
                        </button>
                    </div>
                  </div>

                  {!showPreview ? (
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-950 border border-white/10 rounded-t-xl border-b-0">
                            <button 
                                type="button" 
                                onClick={() => insertFormat("**", "**")}
                                className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors"
                            >
                                <Bold className="h-4 w-4" />
                            </button>
                            <button 
                                type="button" 
                                onClick={() => insertFormat("• ")}
                                className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors"
                            >
                                <List className="h-4 w-4" />
                            </button>
                            <button 
                                type="button" 
                                onClick={() => insertFormat("HEADER: \n")}
                                className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors"
                            >
                                <Heading2 className="h-4 w-4" />
                            </button>
                            <div className="h-4 w-[1px] bg-white/5 mx-1" />
                            <button 
                                type="button" 
                                onClick={undo}
                                disabled={historyIndex === 0}
                                className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors disabled:opacity-20"
                                title="Undo"
                            >
                                <Undo2 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                                type="button" 
                                onClick={redo}
                                disabled={historyIndex === history.length - 1}
                                className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors disabled:opacity-20"
                                title="Redo"
                            >
                                <Redo2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <textarea 
                            ref={textareaRef}
                            rows={8}
                            value={formData.description}
                            onChange={(e) => updateDescription(e.target.value)}
                            placeholder="Enter tournament rules..."
                            className="w-full bg-slate-950 border border-white/10 rounded-b-xl px-4 py-3 text-sm text-white focus:border-rose-500/50 outline-none transition-all resize-none min-h-[200px]"
                        />
                    </div>
                  ) : (
                    <RichPreview text={formData.description} />
                  )}
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
