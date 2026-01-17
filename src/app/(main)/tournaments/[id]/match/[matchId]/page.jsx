"use client";
import { useEffect, useState, use } from "react";
import { getMatch, updateMatchScore, updateMatchVeto } from "@/lib/brackets";
import { getTournament, getRegistration } from "@/lib/tournaments";
import { client } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import {
  Trophy,
  Clock,
  Shield,
  Map as MapIcon,
  ChevronLeft,
  Swords,
  AlertTriangle,
} from "lucide-react";
import Loader from "@/components/Loader";
import { mapImages } from "@/assets/images/maps";
import Link from "next/link";
import PlayerRoster from "@/components/match/PlayerRoster";
import MatchInfo from "@/components/match/MatchInfo";
import CountdownTimer from "@/components/match/CountdownTimer";

const MAP_POOL = [
  { name: "Ascent", image: mapImages["Ascent"] },
  { name: "Bind", image: mapImages["Bind"] },
  { name: "Haven", image: mapImages["Haven"] },
  { name: "Split", image: mapImages["Split"] },
  { name: "Icebox", image: mapImages["Icebox"] },
  { name: "Breeze", image: mapImages["Breeze"] },
  { name: "Fracture", image: mapImages["Fracture"] },
  { name: "Lotus", image: mapImages["Lotus"] },
  { name: "Pearl", image: mapImages["Pearl"] },
  { name: "Sunset", image: mapImages["Sunset"] },
  { name: "Abyss", image: mapImages["Abyss"] },
];

export default function MatchLobbyPage({ params }) {
  const { id, matchId } = use(params);
  const { user } = useAuth();
  const isAdmin = user?.labels?.includes("admin");

  // Data State
  const [match, setMatch] = useState(null);
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  // Veto State
  const [vetoState, setVetoState] = useState({
    bannedMaps: [],
    currentTurn: "teamA",
    selectedMap: null,
  });

  // Score Reporting State
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();

    const unsubscribe = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.matches.documents.${matchId}`,
      (response) => {
        if (response.events.some((e) => e.includes("update"))) {
          const updatedMatch = response.payload;
          setMatch(updatedMatch);
          if (updatedMatch.vetoData) {
            try {
              setVetoState(JSON.parse(updatedMatch.vetoData));
            } catch (e) {
              console.error("Failed to parse veto data", e);
            }
          }
        }
      },
    );

    return () => unsubscribe();
  }, [matchId, id]);

  const loadData = async () => {
    try {
      const matchData = await getMatch(matchId);
      setMatch(matchData);

      if (matchData.vetoData) {
        try {
          setVetoState(JSON.parse(matchData.vetoData));
        } catch (e) {
          console.error("Veto data parsing failed", e);
        }
      }

      const tourneyData = await getTournament(matchData.tournamentId);
      setTournament(tourneyData);

      if (matchData.teamA && matchData.teamA !== "LOBBY") {
        getRegistration(matchData.teamA).then(setTeamA).catch(console.error);
      }
      if (matchData.teamB) {
        getRegistration(matchData.teamB).then(setTeamB).catch(console.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBanMap = async (mapName) => {
    if (!isAdmin) {
      const isTeamATurn = vetoState.currentTurn === "teamA";
      const currentReg = isTeamATurn ? teamA : teamB;
      if (currentReg?.userId !== user?.$id) {
        alert("It's not your turn to ban!");
        return;
      }
    }

    if (vetoState.selectedMap) return;

    const newBanned = [...vetoState.bannedMaps, mapName];
    const newTurn = vetoState.currentTurn === "teamA" ? "teamB" : "teamA";

    let selected = null;
    if (newBanned.length === MAP_POOL.length - 1) {
      selected = MAP_POOL.find((m) => !newBanned.includes(m.name)).name;
    }

    const newState = {
      bannedMaps: newBanned,
      currentTurn: newTurn,
      selectedMap: selected,
    };

    try {
      await updateMatchVeto(matchId, newState);
      setVetoState(newState);
    } catch (e) {
      alert("Failed to save veto: " + e.message);
    }
  };

  const handleReportScore = async () => {
    if (!confirm(`Confirm Score: Team A ${scoreA} - ${scoreB} Team B?`)) return;

    setSubmitting(true);
    try {
      const winnerId = scoreA > scoreB ? match.teamA : match.teamB;
      await updateMatchScore(
        match.$id,
        Number(scoreA),
        Number(scoreB),
        winnerId,
      );
      alert("Match reported!");
      loadData();
    } catch (e) {
      alert("Error reporting score: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (!match)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Match not found
      </div>
    );

  const isCompleted = match.status === "completed";
  const scheduledTime = match.scheduledTime || tournament?.date;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Header */}
      <section className="relative h-[25vh] min-h-[180px] w-full overflow-hidden border-b border-white/5 pt-14 md:h-[30vh] md:min-h-[220px] md:pt-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-slate-950 to-cyan-500/10" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>

        <div className="relative z-20 mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-6 md:px-6 md:pb-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
            <div>
              <p className="mb-1 text-[9px] font-black tracking-[0.3em] text-rose-500/80 uppercase md:mb-2 md:text-[10px]">
                Match Lobby • Round {match.round}
              </p>
              <h1 className="text-xl font-black tracking-tight text-white uppercase italic md:text-3xl lg:text-4xl">
                {tournament?.name || "Tournament Match"}
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black tracking-[0.15em] uppercase shadow-lg backdrop-blur-md md:gap-2 md:px-4 md:py-2 md:text-[10px] ${
                  isCompleted
                    ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                    : "animate-pulse border border-amber-500/30 bg-amber-500/20 text-amber-400"
                }`}
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${isCompleted ? "bg-emerald-400" : "bg-amber-400"}`}
                />
                {isCompleted ? "Completed" : "In Progress"}
              </div>
              {scheduledTime && !isCompleted && (
                <div
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/50 px-3 py-1.5 text-[9px] font-black tracking-widest text-slate-400 uppercase backdrop-blur-md md:gap-2 md:px-4 md:py-2 md:text-[10px]"
                  suppressHydrationWarning
                >
                  <Clock className="h-3 w-3" />
                  {new Date(scheduledTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative z-30 mx-auto -mt-4 max-w-6xl px-4 py-6 md:-mt-6 md:px-6 md:py-10">
        {/* Back Button */}
        <Link
          href={`/tournaments/${id}`}
          className="group mb-6 inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase transition-all hover:text-white md:mb-8"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="hidden sm:inline">Back to Tournament</span>
          <span className="sm:hidden">Back</span>
        </Link>

        {/* Countdown Timer */}
        <div className="mb-8 md:mb-12">
          <CountdownTimer startTime={scheduledTime} status={match.status} />
        </div>

        {/* VS Scoreboard */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl md:mb-12 md:rounded-3xl md:p-8">
          {/* Background Gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-rose-500/5 via-transparent to-cyan-500/5" />
          <div className="absolute top-0 left-0 h-1 w-1/2 bg-gradient-to-r from-rose-500/50 to-transparent" />
          <div className="absolute top-0 right-0 h-1 w-1/2 bg-gradient-to-l from-cyan-500/50 to-transparent" />

          <div className="relative z-10 flex flex-col items-center gap-4 md:flex-row md:justify-between md:gap-8">
            {/* Team A */}
            <div className="flex w-full flex-col items-center text-center md:w-2/5 md:items-start md:text-left">
              <span className="mb-1 text-[9px] font-black tracking-[0.3em] text-rose-500 uppercase md:text-[10px]">
                Team A
              </span>
              <h2 className="text-xl font-black tracking-tight text-white uppercase italic md:text-2xl lg:text-3xl">
                {teamA?.teamName ||
                  (match.teamA && match.teamA !== "LOBBY"
                    ? "Loading..."
                    : "TBD")}
              </h2>
            </div>

            {/* VS / Score */}
            <div className="flex shrink-0 flex-col items-center justify-center py-2 md:py-0">
              {isCompleted ? (
                <div className="flex items-center gap-3 md:gap-4">
                  <span
                    className={`text-4xl font-black italic md:text-5xl lg:text-6xl ${match.scoreA > match.scoreB ? "text-rose-500" : "text-slate-600"}`}
                  >
                    {match.scoreA}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900 md:h-12 md:w-12">
                    <span className="text-[10px] font-black text-slate-600 md:text-xs">
                      VS
                    </span>
                  </div>
                  <span
                    className={`text-4xl font-black italic md:text-5xl lg:text-6xl ${match.scoreB > match.scoreA ? "text-cyan-400" : "text-slate-600"}`}
                  >
                    {match.scoreB}
                  </span>
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-slate-900/80 shadow-2xl md:h-20 md:w-20">
                  <Swords className="h-6 w-6 text-slate-500 md:h-8 md:w-8" />
                </div>
              )}
            </div>

            {/* Team B */}
            <div className="flex w-full flex-col items-center text-center md:w-2/5 md:items-end md:text-right">
              <span className="mb-1 text-[9px] font-black tracking-[0.3em] text-cyan-400 uppercase md:text-[10px]">
                Team B
              </span>
              <h2 className="text-xl font-black tracking-tight text-white uppercase italic md:text-2xl lg:text-3xl">
                {teamB?.teamName || (match.teamB ? "Loading..." : "TBD")}
              </h2>
            </div>
          </div>
        </div>

        {/* Player Rosters Section */}
        <div className="mb-8 md:mb-12">
          <PlayerRoster teamA={teamA} teamB={teamB} loading={loading} />
        </div>

        {/* Match Info Section */}
        <div className="mb-8 md:mb-12">
          <MatchInfo tournament={tournament} match={match} />
        </div>

        {/* Controls Grid */}
        <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
          {/* Map Veto Section */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl md:rounded-3xl md:p-6">
            <div className="mb-4 flex items-center gap-3 md:mb-6">
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-rose-500 md:p-3">
                <MapIcon className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white uppercase md:text-lg">
                  Map Veto
                </h3>
                <p className="text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase md:text-[10px]">
                  Ban maps to select battlefield
                </p>
              </div>
            </div>

            {vetoState.selectedMap ? (
              <div className="relative overflow-hidden rounded-xl py-12 text-center md:rounded-2xl md:py-16">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                  style={{
                    backgroundImage: `url(${(() => {
                      const img = MAP_POOL.find(
                        (m) => m.name === vetoState.selectedMap,
                      )?.image;
                      return typeof img === "object" ? img?.src : img;
                    })()})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />

                <div className="relative z-10">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-[9px] font-black tracking-widest text-emerald-400 uppercase backdrop-blur-md md:px-4 md:py-1.5 md:text-[10px]">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Map Selected
                  </div>
                  <p className="text-3xl font-black tracking-tight text-white uppercase italic drop-shadow-2xl md:text-4xl lg:text-5xl">
                    {vetoState.selectedMap}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-950/50 py-3 md:py-4">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase md:text-xs">
                    Current Turn:
                  </span>
                  <span
                    className={`text-[10px] font-black tracking-widest uppercase md:text-xs ${vetoState.currentTurn === "teamA" ? "text-rose-500" : "text-cyan-400"}`}
                  >
                    {vetoState.currentTurn === "teamA" ? "Team A" : "Team B"}
                  </span>
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase md:text-xs">
                    to ban
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {MAP_POOL.map((map) => {
                    const isBanned = vetoState.bannedMaps.includes(map.name);
                    return (
                      <button
                        key={map.name}
                        onClick={() => handleBanMap(map.name)}
                        disabled={isBanned || isCompleted}
                        className={`group relative h-16 overflow-hidden rounded-xl border text-sm font-bold transition-all md:h-20 md:rounded-2xl ${
                          isBanned
                            ? "cursor-not-allowed border-transparent opacity-40 grayscale"
                            : "border-white/10 shadow-lg hover:scale-[1.02] hover:border-rose-500/50"
                        }`}
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                          style={{
                            backgroundImage: `url(${typeof map.image === "object" ? map.image?.src : map.image})`,
                          }}
                        />
                        <div
                          className={`absolute inset-0 transition-colors ${isBanned ? "bg-slate-950/90" : "bg-slate-950/60 group-hover:bg-rose-950/60"}`}
                        />

                        <span
                          className={`relative z-10 flex h-full items-center justify-center text-[10px] font-black tracking-[0.15em] uppercase md:text-xs md:tracking-[0.2em] ${isBanned ? "text-slate-600 line-through" : "text-white"}`}
                        >
                          {map.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Admin Score Controls */}
          {isAdmin && !isCompleted && match.teamA && match.teamB && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-4 backdrop-blur-xl md:rounded-3xl md:p-6">
              <div className="mb-4 flex items-center gap-3 md:mb-6">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-500 md:p-3">
                  <Shield className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white uppercase md:text-lg">
                    Report Score
                  </h3>
                  <p className="text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase md:text-[10px]">
                    Admin Controls
                  </p>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="mb-2 block text-[9px] font-black tracking-widest text-rose-500 uppercase md:text-[10px]">
                      Team A Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={scoreA}
                      onChange={(e) => setScoreA(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-center text-lg font-black text-white transition-all focus:border-rose-500 focus:outline-none md:py-4 md:text-xl"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[9px] font-black tracking-widest text-cyan-400 uppercase md:text-[10px]">
                      Team B Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={scoreB}
                      onChange={(e) => setScoreB(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-center text-lg font-black text-white transition-all focus:border-cyan-500 focus:outline-none md:py-4 md:text-xl"
                    />
                  </div>
                </div>

                <button
                  onClick={handleReportScore}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50 md:rounded-2xl md:py-4 md:text-xs"
                >
                  {submitting ? (
                    <Loader fullScreen={false} size="sm" />
                  ) : (
                    "Submit Final Score"
                  )}
                </button>

                <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 md:p-4">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-[9px] font-bold text-amber-500/80 md:text-[10px]">
                    Submitting will end the match and advance the winner. This
                    action is irreversible.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
