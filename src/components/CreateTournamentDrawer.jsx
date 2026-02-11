import { useState, useRef, useEffect } from "react";
import { createTournament, updateTournament } from "@/lib/tournaments";
import {
  createTournamentChannelAction,
  announceNewTournamentAction,
} from "@/app/actions/discord";
import { mapImages } from "@/assets/images/maps";
import {
  X,
  Trophy,
  Calendar,
  Users,
  Info,
  Gamepad2,
  Swords,
  Skull,
  Bold,
  List,
  Heading2,
  Eye,
  Edit3,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Map as MapIcon,
} from "lucide-react";
import Loader from "@/components/Loader";

// Import the same parser logic used in the detail page
// Import the same parser logic used in the detail page
// Import the same parser logic used in the detail page
const DESCRIPTION_TEMPLATES = {
  "5v5": `**The Ultimate Valorant Showdown: Elite Series**

MISSION STATEMENT:
Welcome to the frontier of competitive community Valorant. The Elite Series is more than just a tournament; it’s a proving ground for the next generation of tactical masterminds. Our mission is to provide an uncompromising, professional-grade platform where skill is the only currency and strategy is the ultimate weapon.

COMPETITIVE INTEGRITY & FAIR PLAY:
We believe that the heart of every great tournament is a level playing field. To ensure the highest standards of competitive integrity, every match is monitored by our dedicated tournament marshals. We enforce a zero-tolerance policy regarding toxicity, exploit usage, and unsportsmanlike conduct. We are committed to a server environment where respect is mandatory and the victory is earned or not at all.

TOURNAMENT DYNAMICS:
- **The Format**: This event follows a high-stakes Single Elimination bracket. In this format, every round is a "must-win," heightening the tension and rewarding teams that can adapt under extreme pressure.
- **The Stakes**: Players are competing not just for the prize pool, but for points in our seasonal leaderboard. Consistency across our circuit is the path to being invited to our year-end grand finals.
- **Map Pool**: All matches will be played on current competitive rotation maps. Map vetos will be handled via our integrated system 15 minutes prior to match start.

LOBBY PROCEDURE:
1. **Check-in**: Captains must check-in 15 minutes prior to start.
2. **Get Code**: Captains will receive the Party Code in the private Discord match channel.
3. **Join**: Enter the code in-game and invite your teammates to the lobby.

PRIZE DISTRIBUTION:
- **Method**: Prize money is sent via UPI to the team captain after the Grand Finals.
- **Coordination**: Captains will provide details in the private admin channel on Discord.

EVENT GUIDELINES:
- **Check-in**: Team captains must check-in 15 minutes prior to the scheduled start time.
- **Communication**: All coordination and announcements will happen in this Discord server.

FINAL WORD:
Prepare your executes, refine your aim, and ensure your comms are crisp. The server is waiting, and the community is watching. Do you have the composure to clutch the win, or will you fall to the pressure of the big stage?

**Lock in. Step up. Reign supreme.**`,

  Deathmatch: `**The Deathmatch Arena: Maximum Velocity**

MISSION STATEMENT:
Witness the rawest form of Valorant skill. The Deathmatch Arena is where agents are pushed to their mechanical limits. No abilities, no utility—just aim, movement, and pure tactical instinct. This isn't just about winning; it's about dominating the field and proving who has the sharpest crosshair in the community.

COMPETITIVE DYNAMICS:
- **The Goal**: First player to reach 40 kills or the highest scorer at the 10-minute mark.
- **Standings**: Real-time tracking of kills and deaths. Only the most consistent slayers will climb the official leaderboard.
- **Spawn Mastery**: Players must adapt to rapid re-spawns and maintain map awareness to avoid being caught in crossfires.

LOBBY PROCEDURE:
1. **Check-in**: Confirm your presence on the site 15 minutes before start.
2. **Get Code**: Retrieve the Party Code from our Discord server's tournament channel.
3. **Join**: Enter the code in-game to join the lobby immediately.

PRIZE DISTRIBUTION:
- **Method**: All winnings are transferred via UPI immediately after tournament completion.
- **Coordination**: Winners will be contacted via a private Discord channel to confirm details.

EVENT RULES & ETIQUETTE:
- **Mandatory Check-in**: All participants must check-in via the portal 15 minutes before the match to secure their slot.
- **Fair Play**: We maintain a zero-tolerance policy for any third-party software or exploits. Our marshals monitor live standings for statistical anomalies.

FINAL WORD:
The lobby is waiting. Your rivals are practicing. Every corner is a potential duel and every shot counts towards your legacy. Do you have the composure to maintain a streak, or will you fall in the chaos of the arena?

**Aim True. Kill Fast. Rule the Lobby.**`,

  "1v1": `**The Duelist's Gauntlet: 1v1 Showdown**

MISSION STATEMENT:
Step into the ultimate test of individual prowess. The 1v1 Gauntlet strips away the team, the trades, and the excuses. It's just you, your opponent, and the map. This mode is designed for the sharpest aimers and the smartest duelists to prove who truly reigns supreme in a head-to-head battle.

COMPETITIVE DYNAMICS:
- **The Format**: Single Elimination. Lose and go home.
- **The Objective**: First to 13 kills or highest score when time expires.
- **Rules of Engagement**: No abilities (unless agreed otherwise). Pure gunplay focus. Agent selection is typically mirrored (e.g., Reyna vs Reyna) to ensure parity.

LOBBY PROCEDURE:
1. **Check-in**: Both players must check-in 15 minutes prior to match time.
2. **Get Code**: Exchange lobby details in the designated Discord channel.
3. **Duel**: Enter the custom game and fight for your honor.

PRIZE DISTRIBUTION:
- **Method**: Immediate UPI transfer to the victor.
- **Coordination**: Winner confirms details with admin on Discord.

FINAL WORD:
There is no one to trade you. There is no one to heal you. It's kill or be killed. Do you have the mechanics to out-duel anyone who steps in your path?

**One Map. Two Players. One Victor.**`,

  "2v2": `**Wingman Warfare: 2v2 Tactical Cup**

MISSION STATEMENT:
Grab your duo and prepare for synchronized chaos. The Wingman Warfare series tests the chemistry between two players. It's about trading effectively, double-peeking perfectly, and clutching up when your partner goes down. This is the perfect middle ground between individual skill and team strategy.

COMPETITIVE DYNAMICS:
- **The Format**: Single Elimination Bracket.
- **Map Pool**: Compact "Wingman" style sites on Skirmish maps.
- **Strategy**: Plant or Defuse. Economy management is simplified but crucial. Coordination is key.

LOBBY PROCEDURE:
1. **Check-in**: Team captain check-in required 15 minutes prior.
2. **Get Code**: Party Code provided in match channel.
3. **Join**: Both duos join the lobby and commence the series.

PRIZE DISTRIBUTION:
- **Method**: Prize pool split and sent to the team captain via UPI.
- **Coordination**: Captain handles distribution to their teammate.

FINAL WORD:
You and your partner against the world. Trust your teammate, play your angles, and prove you're the deadliest duo in the server.

**Play Together. Win Together.**`,

  "3v3": `**The Trinity Skirmish: 3v3 Battle**

MISSION STATEMENT:
Fast, frantic, and tactical. The Trinity Skirmish brings the intensity of full 5v5 into a condensed, high-octane 3v3 format. Perfect for small squads who want to execute strategies without the complexity of a full roster. Rotations are faster, punishments are harsher, and every kill impacts the round significantly.

COMPETITIVE DYNAMICS:
- **The Format**: Single Elimination Bracket.
- **Tactical Depth**: 3 players per team allows for a balanced composition (e.g., 1 Duelist, 1 Smoker, 1 Initiator).
- **Economy**: Standard competitive economy rules apply.

LOBBY PROCEDURE:
1. **Check-in**: Captains check-in 15 minutes early.
2. **Get Code**: Retrieve code from Discord.
3. **Battle**: Teams join the lobby and compete on Skirmish maps.

PRIZE DISTRIBUTION:
- **Method**: Sent to team captain via UPI.
- **Coordination**: Captain distributes to the squad.

FINAL WORD:
Three is the magic number. It's enough for strategy, but small enough for individual brilliance to shine. Assemble your trinity and dominate the bracket.

**Execute. Rotate. Dominate.**`,
};

const RichPreview = ({ text }) => {
  if (!text)
    return (
      <p className="text-sm text-slate-600 italic">
        Preview will appear here...
      </p>
    );
  const lines = text.split("\n");
  return (
    <div className="min-h-[150px] space-y-3 rounded-xl border border-white/5 bg-slate-950 p-4">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        const isBullet =
          trimmed.startsWith("•") ||
          trimmed.startsWith("- ") ||
          trimmed.startsWith("* ");
        let content = isBullet ? trimmed.replace(/^[•\-*]\s*/, "") : trimmed;
        const parts = content.split(/(\*\*.*?\*\*)/g);
        const formattedContent = parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <span key={j} className="font-bold text-white">
                {part.slice(2, -2)}
              </span>
            );
          }
          return part;
        });
        if (isBullet) {
          return (
            <div key={i} className="flex items-start gap-3 pl-2">
              <div className="mt-2 h-1 w-1 shrink-0 rounded-full bg-rose-500" />
              <p className="text-sm leading-relaxed text-slate-300">
                {formattedContent}
              </p>
            </div>
          );
        }
        const isHeader =
          !isBullet &&
          ((trimmed === trimmed.toUpperCase() && trimmed.length > 3) ||
            /^[A-Z\s]{4,}:/.test(trimmed));
        return (
          <p
            key={i}
            className={`text-sm leading-relaxed ${isHeader ? "pt-2 text-[10px] font-bold tracking-wider text-rose-500 uppercase" : "text-slate-400"}`}
          >
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
    maxTeams: 10,
    status: "scheduled",
    description: "",
    gameType: "5v5",
    location: "Online",
    checkInEnabled: true,
    checkInStart: "",
    entryFee: "",
    firstPrize: "",
    secondPrize: "",
    additionalPrizes: [],
    matchFormat: "Auto",
    map: "",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [history, setHistory] = useState([formData.description]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    // For description updates
    const isSkirmish = ["1v1", "2v2", "3v3"].includes(formData.gameType);

    // Check if the current description is one of the defaults (or empty)
    // If it is, we can safely switch it to the new mode's default.
    // If it's custom text, we leave it alone.
    const isDefaultDescription =
      !formData.description ||
      Object.values(DESCRIPTION_TEMPLATES).includes(formData.description) ||
      // Keep legacy checks for a moment just in case, or simpler: just trust strict equality?
      // Strict equality is better for the new system.
      // But purely for transition, let's just use the strict check.
      // If the user has "old" default text, it might not update, but that's acceptable edge case.
      // Actually, let's include the old checks just to be safe if they trigger "clearing" to new defaults.
      formData.description.includes("standard 5v5 tournament") ||
      formData.description.includes("deathmatch tournament") ||
      formData.description.includes("Skirmish mode");

    if (isDefaultDescription) {
      if (formData.gameType === "Deathmatch") {
        setFormData((prev) => ({
          ...prev,
          description: DESCRIPTION_TEMPLATES.Deathmatch,
        }));
      } else if (isSkirmish) {
        setFormData((prev) => ({
          ...prev,
          description:
            DESCRIPTION_TEMPLATES[formData.gameType] ||
            DESCRIPTION_TEMPLATES["1v1"],
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          description: DESCRIPTION_TEMPLATES["5v5"],
        }));
      }
    }

    // Update maxTeams based on mode
    if (formData.gameType === "1v1")
      setFormData((prev) => ({ ...prev, maxTeams: 16 }));
    else if (formData.gameType === "2v2")
      setFormData((prev) => ({ ...prev, maxTeams: 16 }));
    else if (formData.gameType === "3v3")
      setFormData((prev) => ({ ...prev, maxTeams: 8 }));
    else if (formData.gameType === "5v5")
      setFormData((prev) => ({ ...prev, maxTeams: 16 }));
    else if (formData.gameType === "Deathmatch")
      setFormData((prev) => ({ ...prev, maxTeams: 40 }));

    // Reset map when switching modes, but if switching back to Deathmatch, maybe default to random or empty
    if (formData.gameType !== "Deathmatch") {
      setFormData((prev) => ({ ...prev, map: "" }));
    }
  }, [formData.gameType]);

  const updateDescription = (newText) => {
    setFormData((prev) => ({ ...prev, description: newText }));
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
      setFormData((prev) => ({ ...prev, description: history[newIndex] }));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFormData((prev) => ({ ...prev, description: history[newIndex] }));
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
    if (prefix === "• " && before.length > 0 && !before.endsWith("\n")) {
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
      // 1. Prepare Data
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
        checkInStart:
          formData.checkInEnabled && formData.checkInStart
            ? new Date(formData.checkInStart).toISOString()
            : null,
        entryFee: formData.entryFee,
        firstPrize: formData.firstPrize,
        secondPrize: formData.secondPrize,
        additionalPrizes: JSON.stringify(formData.additionalPrizes),
        matchFormat: formData.matchFormat,
        registeredTeams: 0,
        bracketGenerated: false,
        map: formData.map || null,
      };

      // 2. Create Tournament Document (Client Side)
      const createdTournament = await createTournament(tournamentData);
      const tournamentId = createdTournament.$id;

      // 3. Trigger Discord Bot (Server Side)
      // We do this after creation so failure doesn't block the database write
      try {
        const botResult = await createTournamentChannelAction(formData.name, {
          ...formData,
          id: tournamentId,
        });

        if (botResult && !botResult.error) {
          // 4. Update Tournament with Discord Data
          try {
            await updateTournament(tournamentId, {
              discordChannelId: botResult.channelId,
              discordVoiceChannelId: botResult.voiceChannelId,
              discordRoleId: botResult.roleId,
              discordInviteUrl: botResult.inviteUrl,
            });
          } catch (dbError) {
            console.error("Failed to save Discord ID to DB:", dbError);
            alert(
              "Tournament created, but failed to save Discord Link to database. \n\nCheck if 'discordChannelId' and 'discordRoleId' attributes exist in Appwrite Tournaments Collection.",
            );
          }
        } else if (botResult && botResult.error) {
          console.warn("Discord Bot Error:", botResult.error);
        }
      } catch (discordErr) {
        console.warn("Failed to execute Discord Server Action:", discordErr);
        // Don't fail the UI, just log it
      }

      // 5. Send Announcement Check (Existing Webhook logic -> Now Bot Action)
      try {
        await announceNewTournamentAction({
          ...tournamentData,
          $id: tournamentId,
        });
      } catch (discordError) {
        console.warn("Discord announcement bot action failed:", discordError);
      }

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
        checkInEnabled: true,
        checkInStart: "",
        entryFee: "",
        firstPrize: "",
        secondPrize: "",
        additionalPrizes: [],
        matchFormat: "Auto",
        map: "",
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
      <div className="animate-in slide-in-from-right relative w-full max-w-md border-l border-white/10 bg-slate-900 shadow-2xl duration-300">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 bg-slate-950/50 p-6">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <Trophy className="h-5 w-5 text-rose-500" />
                New Tournament
              </h2>
              <p className="mt-1 text-xs font-black tracking-widest text-slate-500 uppercase">
                Admin Panel
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form
              onSubmit={handleSubmit}
              id="create-tournament-form"
              className="space-y-6"
            >
              {/* GAME TYPE SELECTION */}
              <div>
                <label className="mb-3 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Game Mode
                </label>

                {/* Primary Mode Selector */}
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/5 bg-slate-900/50 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, gameType: "5v5" })
                    }
                    className={`group relative flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold uppercase transition-all ${
                      formData.gameType === "5v5"
                        ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20"
                        : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                    }`}
                  >
                    <Swords className="h-4 w-4" />
                    <span>5v5</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, gameType: "Deathmatch" })
                    }
                    className={`group relative flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold uppercase transition-all ${
                      formData.gameType === "Deathmatch"
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                        : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                    }`}
                  >
                    <Skull className="h-4 w-4" />
                    <span>Deathmatch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, gameType: "1v1" })
                    }
                    className={`group relative flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold uppercase transition-all ${
                      ["1v1", "2v2", "3v3"].includes(formData.gameType)
                        ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20"
                        : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Skirmish</span>
                  </button>
                </div>

                {/* Sub Mode Selector for Skirmish */}
                {["1v1", "2v2", "3v3"].includes(formData.gameType) && (
                  <div className="animate-in fade-in slide-in-from-top-2 mt-4">
                    <div className="grid grid-cols-3 gap-2">
                      {["1v1", "2v2", "3v3"].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, gameType: mode })
                          }
                          className={`flex items-center justify-center gap-2 rounded-lg border border-white/5 py-2 text-xs font-black tracking-wider uppercase transition-all ${
                            formData.gameType === mode
                              ? "border-amber-500/50 bg-amber-500/20 text-amber-400"
                              : "bg-slate-900/30 text-slate-500 hover:bg-slate-800"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-center text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                      {formData.gameType === "1v1" && "Solo Duel Mode"}
                      {formData.gameType === "2v2" && "Wingman Mode"}
                      {formData.gameType === "3v3" && "Trio Skirmish Mode"}
                    </p>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="space-y-4 border-t border-white/5 pt-4">
                <div>
                  <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Tournament Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Asia Deathmatch Series"
                    className="w-full rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-white transition-all outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      <Calendar className="h-3 w-3" /> Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.date}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        let newCheckIn = formData.checkInStart;

                        if (newDate) {
                          const d = new Date(newDate);
                          d.setMinutes(d.getMinutes() - 15);

                          // Format to YYYY-MM-DDTHH:mm local time string
                          const pad = (n) => n.toString().padStart(2, "0");
                          const year = d.getFullYear();
                          const month = pad(d.getMonth() + 1);
                          const day = pad(d.getDate());
                          const hours = pad(d.getHours());
                          const minutes = pad(d.getMinutes());
                          newCheckIn = `${year}-${month}-${day}T${hours}:${minutes}`;
                        }

                        setFormData({
                          ...formData,
                          date: newDate,
                          checkInStart: newCheckIn,
                        });
                      }}
                      onClick={(e) => e.target.showPicker()}
                      className="w-full cursor-pointer rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-sm text-white [color-scheme:dark] transition-all outline-none focus:border-rose-500/50 [&::-webkit-calendar-picker-indicator]:[filter:invert(1)]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      <Trophy className="h-3 w-3 text-amber-500" /> Prize Pool
                      (Total)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.prizePool}
                      onChange={(e) =>
                        setFormData({ ...formData, prizePool: e.target.value })
                      }
                      placeholder="e.g. ₹10,000"
                      className="w-full rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-sm text-white transition-all outline-none focus:border-rose-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      <Gamepad2 className="h-3 w-3" />{" "}
                      {formData.gameType === "Deathmatch"
                        ? "Entry Fee (Head)"
                        : "Entry Fee (Team)"}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.entryFee}
                      onChange={(e) =>
                        setFormData({ ...formData, entryFee: e.target.value })
                      }
                      placeholder="e.g. ₹500"
                      className="w-full rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-sm text-white transition-all outline-none focus:border-rose-500/50"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      <Users className="h-3 w-3" /> Max Slots
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.maxTeams}
                      onChange={(e) =>
                        setFormData({ ...formData, maxTeams: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-sm text-white transition-all outline-none focus:border-rose-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="Online"
                      className="w-full rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-sm text-white transition-all outline-none focus:border-rose-500/50"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      Default Match Format
                    </label>
                    <select
                      value={formData.matchFormat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          matchFormat: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-sm text-white transition-all outline-none focus:border-rose-500/50"
                    >
                      <option value="Auto">Auto (BO1 early/BO3 late)</option>
                      <option value="BO1">Best of 1 (BO1)</option>
                      <option value="BO3">Best of 3 (BO3)</option>
                      <option value="BO5">Best of 5 (BO5)</option>
                    </select>
                  </div>
                </div>

                {/* Map Selection for Deathmatch */}
                {formData.gameType === "Deathmatch" && (
                  <div className="animate-in fade-in slide-in-from-top-2 border-t border-white/5 pt-4">
                    <label className="mb-2 block flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      <MapIcon className="h-3 w-3 text-purple-500" /> Map
                      Selection
                    </label>
                    <select
                      value={formData.map}
                      onChange={(e) =>
                        setFormData({ ...formData, map: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-sm text-white transition-all outline-none focus:border-purple-500/50"
                    >
                      <option value="">Random Map</option>
                      {Object.keys(mapImages)
                        .filter((m) => !m.startsWith("Skirmish")) // Exclude Skirmish maps for Deathmatch likely? Or keep them? Deathmatch usually standard maps.
                        .map((mapName) => (
                          <option key={mapName} value={mapName}>
                            {mapName}
                          </option>
                        ))}
                    </select>
                    <p className="mt-2 text-[10px] text-slate-500">
                      Leave empty to deciding via veto or random selection
                      later.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      1st Prize (Winner)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstPrize}
                      onChange={(e) =>
                        setFormData({ ...formData, firstPrize: e.target.value })
                      }
                      placeholder="₹5,000"
                      className="w-full rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-sm text-white transition-all outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      2nd Prize (Runner Up)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.secondPrize}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          secondPrize: e.target.value,
                        })
                      }
                      placeholder="₹2,500"
                      className="w-full rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-sm text-white transition-all outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block flex items-center justify-between text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    <span>Additional Prizes (Optional)</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          additionalPrizes: [
                            ...formData.additionalPrizes,
                            { label: "", value: "" },
                          ],
                        })
                      }
                      className="flex items-center gap-1 rounded-md p-1 text-[9px] text-rose-500 transition-all hover:bg-rose-500/10"
                    >
                      <Plus className="h-2.5 w-2.5" /> Add Prize
                    </button>
                  </label>
                  <div className="space-y-3">
                    {formData.additionalPrizes.map((prize, index) => (
                      <div
                        key={index}
                        className="group animate-in slide-in-from-right-2 flex gap-2 duration-300"
                      >
                        <input
                          type="text"
                          value={prize.label}
                          onChange={(e) => {
                            const newPrizes = [...formData.additionalPrizes];
                            newPrizes[index].label = e.target.value;
                            setFormData({
                              ...formData,
                              additionalPrizes: newPrizes,
                            });
                          }}
                          placeholder="e.g. MVP"
                          className="flex-[1.5] rounded-xl border border-white/5 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-rose-500/50"
                        />
                        <input
                          type="text"
                          value={prize.value}
                          onChange={(e) => {
                            const newPrizes = [...formData.additionalPrizes];
                            newPrizes[index].value = e.target.value;
                            setFormData({
                              ...formData,
                              additionalPrizes: newPrizes,
                            });
                          }}
                          placeholder="₹500"
                          className="flex-1 rounded-xl border border-white/5 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-rose-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newPrizes = formData.additionalPrizes.filter(
                              (_, i) => i !== index,
                            );
                            setFormData({
                              ...formData,
                              additionalPrizes: newPrizes,
                            });
                          }}
                          className="p-2 text-slate-600 transition-colors hover:text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {formData.additionalPrizes.length === 0 && (
                      <p className="text-[10px] text-slate-600 italic">
                        No additional prizes added yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Check-in Settings */}
              <div className="space-y-4 border-t border-white/5 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Enable Check-in
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        checkInEnabled: !formData.checkInEnabled,
                      })
                    }
                    className={`relative h-5 w-10 rounded-full transition-colors ${formData.checkInEnabled ? "bg-rose-500" : "bg-slate-800"}`}
                  >
                    <div
                      className={`absolute top-1 left-1 h-3 w-3 rounded-full bg-white transition-transform ${formData.checkInEnabled ? "translate-x-5" : ""}`}
                    />
                  </button>
                </div>
                {formData.checkInEnabled && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      Check-in Opens At
                    </label>
                    <input
                      type="datetime-local"
                      required={formData.checkInEnabled}
                      value={formData.checkInStart}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          checkInStart: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-sm text-white [color-scheme:dark] transition-all outline-none focus:border-rose-500/50 [&::-webkit-calendar-picker-indicator]:[filter:invert(1)]"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-4 border-t border-white/5 pt-4">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      <Info className="h-3 w-3" /> About / Rules
                    </label>
                    <div className="flex rounded-lg border border-white/5 bg-slate-950 p-1">
                      <button
                        type="button"
                        onClick={() => setShowPreview(false)}
                        className={`rounded-md px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-all ${!showPreview ? "bg-rose-500 text-white" : "text-slate-500 hover:text-white"}`}
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className={`rounded-md px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-all ${showPreview ? "bg-rose-500 text-white" : "text-slate-500 hover:text-white"}`}
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {!showPreview ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 rounded-t-xl border border-b-0 border-white/10 bg-slate-950 px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => insertFormat("**", "**")}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          <Bold className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormat("• ")}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          <List className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormat("HEADER: \n")}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          <Heading2 className="h-4 w-4" />
                        </button>
                        <div className="mx-1 h-4 w-[1px] bg-white/5" />
                        <button
                          type="button"
                          onClick={undo}
                          disabled={historyIndex === 0}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-20"
                          title="Undo"
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={redo}
                          disabled={historyIndex === history.length - 1}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-20"
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
                        className="min-h-[200px] w-full resize-none rounded-b-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white transition-all outline-none focus:border-rose-500/50"
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
          <div className="border-t border-white/5 bg-slate-950/50 p-6">
            <button
              type="submit"
              form="create-tournament-form"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-4 font-bold text-white shadow-lg shadow-rose-900/20 transition-all hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50"
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
