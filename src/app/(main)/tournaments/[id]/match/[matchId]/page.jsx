"use client";
import { useEffect, useState, use } from "react";
import {
  getMatch,
  updateMatchScore,
  updateMatchVeto,
  parsePlayerStats,
} from "@/lib/brackets";
import {
  getTournament,
  getRegistration,
  checkUserRegistration,
} from "@/lib/tournaments";
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
  Share2,
  CheckCircle2,
  XCircle,
  Zap,
  Users,
  Gamepad2,
} from "lucide-react";
import Loader from "@/components/Loader";
import { mapImages } from "@/assets/images/maps";
import Link from "next/link";
import PlayerRoster from "@/components/match/PlayerRoster";
import MatchInfo from "@/components/match/MatchInfo";
import CountdownTimer from "@/components/match/CountdownTimer";
import TeamFaceOff from "@/components/match/TeamFaceOff";
import MapCard3D from "@/components/match/MapCard3D";

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
  const [isRegistered, setIsRegistered] = useState(false);

  // Veto State
  const [vetoState, setVetoState] = useState({
    bannedMaps: [],
    pickedMaps: [],
    currentTurn: "teamA",
    selectedMap: null,
    selectedMaps: [],
  });

  const [totalRounds, setTotalRounds] = useState(0);
  const [playerStats, setPlayerStats] = useState({});

  // Score Reporting State
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // UI State
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [banningMap, setBanningMap] = useState(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [mapPlayerStats, setMapPlayerStats] = useState([]);
  const [viewingMapIdx, setViewingMapIdx] = useState(null); // null means "Total"

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
              const parsed = JSON.parse(updatedMatch.vetoData);
              setVetoState({
                ...parsed,
                pickedMaps: parsed.pickedMaps || [],
                selectedMaps:
                  parsed.selectedMaps ||
                  (parsed.selectedMap ? [parsed.selectedMap] : []),
              });
            } catch (e) {
              console.error("Failed to parse veto data", e);
            }
          }
          if (updatedMatch.playerStats) {
            const parsedStats = parsePlayerStats(updatedMatch);
            setPlayerStats(parsedStats.players || {});
            // Update mapPlayerStats if present in consolidated format, otherwise check legacy field
            if (parsedStats.mapPlayerStats.length > 0) {
              setMapPlayerStats(parsedStats.mapPlayerStats);
            } else if (updatedMatch.mapPlayerStats) {
              try {
                setMapPlayerStats(
                  typeof updatedMatch.mapPlayerStats === "string"
                    ? JSON.parse(updatedMatch.mapPlayerStats)
                    : updatedMatch.mapPlayerStats,
                );
              } catch (e) {
                console.error("Failed to parse map player stats", e);
              }
            }
          }
        }
      },
    );

    return () => unsubscribe();
  }, [matchId, id]);

  useEffect(() => {
    if (user?.$id && id) {
      checkUserRegistration(id, user.$id)
        .then(setIsRegistered)
        .catch(console.error);
    }
  }, [user?.$id, id]);

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

      if (matchData.playerStats) {
        const parsedStats = parsePlayerStats(matchData);
        setPlayerStats(parsedStats.players || {});

        // Update mapPlayerStats if present in consolidated format
        if (parsedStats.mapPlayerStats.length > 0) {
          setMapPlayerStats(parsedStats.mapPlayerStats);
        } else if (matchData.mapPlayerStats) {
          // Fallback to legacy field
          try {
            setMapPlayerStats(
              typeof matchData.mapPlayerStats === "string"
                ? JSON.parse(matchData.mapPlayerStats)
                : matchData.mapPlayerStats,
            );
          } catch (e) {
            console.error("Map player stats parsing failed", e);
          }
        }
      }

      const tourneyData = await getTournament(matchData.tournamentId);
      setTournament(tourneyData);

      // Fetch matches to determine total rounds
      try {
        const allMatches = await getMatches(matchData.tournamentId);
        if (allMatches.length > 0) {
          const maxR = Math.max(...allMatches.map((m) => m.round));
          setTotalRounds(maxR);
        } else {
          // Fallback calculation based on maxTeams
          const teams = tourneyData.maxTeams || 16;
          setTotalRounds(Math.ceil(Math.log2(teams)));
        }
      } catch (me) {
        console.warn("Failed to fetch all matches for round calculation", me);
        // Fallback
        const teams = tourneyData.maxTeams || 16;
        setTotalRounds(Math.ceil(Math.log2(teams)));
      }

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

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getEffectiveFormat = () => {
    if (!tournament || !match) return "BO1";
    if (match.matchFormat && match.matchFormat !== "Auto")
      return match.matchFormat;
    if (tournament.matchFormat && tournament.matchFormat !== "Auto")
      return tournament.matchFormat;

    const currentRound = match.round;
    const isFinal = totalRounds > 0 && currentRound === totalRounds;
    const isSemi = totalRounds > 1 && currentRound === totalRounds - 1;
    if (isFinal || isSemi) return "BO3";
    return "BO1";
  };

  const getVetoAction = (turnNumber, format) => {
    if (format === "BO3") {
      if (turnNumber === 3 || turnNumber === 4) return "pick";
      return "ban";
    }
    if (format === "BO5") {
      if (turnNumber >= 3 && turnNumber <= 6) return "pick";
      return "ban";
    }
    return "ban";
  };

  const handleBanMap = async (mapName) => {
    if (!isAdmin) {
      const isTeamATurn = vetoState.currentTurn === "teamA";
      const currentReg = isTeamATurn ? teamA : teamB;
      if (currentReg?.userId !== user?.$id) {
        showToast("It's not your turn!", "error");
        return;
      }
    }

    const format = getEffectiveFormat();
    const action = getVetoAction(
      vetoState.bannedMaps.length + vetoState.pickedMaps.length + 1,
      format,
    );

    if (vetoState.selectedMaps?.length > 0 || vetoState.selectedMap) return;

    setBanningMap(mapName);
    const newBanned =
      action === "ban"
        ? [...vetoState.bannedMaps, mapName]
        : [...vetoState.bannedMaps];
    const newPicked =
      action === "pick"
        ? [...vetoState.pickedMaps, mapName]
        : [...vetoState.pickedMaps];
    const newTurn = vetoState.currentTurn === "teamA" ? "teamB" : "teamA";

    let finalSelectedMaps = [];
    if (newBanned.length + newPicked.length === MAP_POOL.length - 1) {
      const decider = MAP_POOL.find(
        (m) => !newBanned.includes(m.name) && !newPicked.includes(m.name),
      ).name;
      // Combine picks and decider in order: Picks first, then decider
      finalSelectedMaps = [...newPicked, decider];
    }

    const newState = {
      bannedMaps: newBanned,
      pickedMaps: newPicked,
      currentTurn: newTurn,
      selectedMaps: finalSelectedMaps,
      selectedMap: finalSelectedMaps[0] || null, // Fallback for old UI
    };

    try {
      await updateMatchVeto(matchId, newState);
      setVetoState(newState);
      showToast(
        finalSelectedMaps.length > 0
          ? `Veto completed! Maps: ${finalSelectedMaps.join(", ")}`
          : `${mapName} has been ${action}ed!`,
        "success",
      );
    } catch (e) {
      showToast("Failed to save veto: " + e.message, "error");
    } finally {
      setTimeout(() => setBanningMap(null), 500);
    }
  };

  const handleReportScore = async () => {
    setSubmitting(true);
    try {
      const winnerId = scoreA > scoreB ? match.teamA : match.teamB;
      await updateMatchScore(
        match.$id,
        Number(scoreA),
        Number(scoreB),
        winnerId,
      );
      showToast("Match reported successfully!", "success");
      setShowScoreModal(false);
      loadData();
    } catch (e) {
      showToast("Error reporting score: " + e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareMatch = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const incrementScore = (team) => {
    const effFormat = getEffectiveFormat();
    const maxScore = effFormat === "BO5" ? 3 : effFormat === "BO3" ? 2 : 13;

    if (team === "A") {
      setScoreA((prev) => Math.min(maxScore, parseInt(prev || 0) + 1));
    } else {
      setScoreB((prev) => Math.min(maxScore, parseInt(prev || 0) + 1));
    }
  };

  const decrementScore = (team) => {
    if (team === "A") {
      setScoreA((prev) => Math.max(0, parseInt(prev || 0) - 1));
    } else {
      setScoreB((prev) => Math.max(0, parseInt(prev || 0) - 1));
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

  // Calculate Scheduled Time (Fallback logic matching Admin Panel)
  let scheduledTime = match.scheduledTime;
  if (!scheduledTime && tournament?.date) {
    if (tournament.gameType === "5v5") {
      const startDate = new Date(tournament.date);
      const offset = (match.round - 1) * 4 + match.matchIndex;
      startDate.setHours(startDate.getHours() + offset);
      scheduledTime = startDate.toISOString();
    } else {
      scheduledTime = tournament.date;
    }
  }

  const vetoProgress =
    (vetoState.bannedMaps.length / (MAP_POOL.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-rose-500/30">
      {/* Toast Notifications */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all duration-300 md:top-24 md:px-6 md:py-4 ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
              : "border-red-500/30 bg-red-500/20 text-red-400"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/20 px-4 py-3 text-cyan-400 shadow-2xl backdrop-blur-xl md:top-24 md:px-6 md:py-4">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-bold">Link copied to clipboard!</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1920px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/tournaments/${id}`}
              className="group flex items-center gap-2 rounded-lg border border-white/5 bg-slate-800/50 px-3 py-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-all hover:bg-slate-800 hover:text-white"
            >
              <ChevronLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
              <span className="hidden sm:inline">Tournament</span>
            </Link>
            <div className="h-6 w-[1px] bg-white/5" />
            <h1 className="text-sm font-black tracking-tight text-white uppercase italic md:text-base">
              {tournament?.name}
              <span className="ml-2 text-slate-500 not-italic">
                Round {match.round}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black tracking-widest uppercase shadow-lg backdrop-blur-md ${
                isCompleted
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "animate-pulse border border-amber-500/30 bg-amber-500/10 text-amber-400"
              }`}
            >
              <div
                className={`h-1.5 w-1.5 rounded-full ${isCompleted ? "bg-emerald-400" : "animate-ping bg-amber-400"}`}
              />
              {isCompleted ? "Completed" : "Live"}
            </div>

            <button
              onClick={handleShareMatch}
              className="flex items-center gap-2 rounded-lg border border-white/5 bg-slate-800/50 px-3 py-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-all hover:border-cyan-500/30 hover:text-cyan-400"
            >
              <Share2 className="h-3 w-3" />
              <span className="hidden sm:inline">Share Lobby</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Arena Content */}
      <div className="relative mx-auto max-w-[1920px] px-4 pt-8 pb-4 md:px-6 md:pt-10 md:pb-6 lg:px-8 lg:pt-12 lg:pb-8">
        {/* Cinematic Header */}
        <div className="mb-8">
          <TeamFaceOff
            teamA={teamA}
            teamB={teamB}
            match={match}
            isCompleted={isCompleted}
          />
        </div>

        {/* Map Stats Selector */}
        {mapPlayerStats && mapPlayerStats.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setViewingMapIdx(null)}
              className={`rounded-lg px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all ${
                viewingMapIdx === null
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20"
                  : "border border-white/5 bg-slate-900/50 text-slate-500 hover:text-white"
              }`}
            >
              Series Total Stats
            </button>
            {mapPlayerStats.map((stats, idx) => {
              if (!stats) return null;
              return (
                <button
                  key={idx}
                  onClick={() => setViewingMapIdx(idx)}
                  className={`rounded-lg px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all ${
                    viewingMapIdx === idx
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20"
                      : "border border-white/5 bg-slate-900/50 text-slate-500 hover:text-white"
                  }`}
                >
                  Map {idx + 1} Stats
                </button>
              );
            })}
          </div>
        )}

        {/* 3-Column Grid Layout */}
        <div className="grid gap-8 lg:grid-cols-12 xl:gap-10">
          {/* LEFT COLUMN: Team A Roster (Sticky) */}
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-3">
            <div className="sticky top-6 space-y-4">
              <div className="flex items-center justify-start gap-2 border-b border-rose-500/20 pb-2">
                <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                <h3 className="text-xs font-black tracking-[0.2em] text-rose-500 uppercase">
                  Team A Roster
                </h3>
              </div>
              <div className="rounded-2xl border border-l-4 border-rose-500/10 border-rose-500/30 bg-gradient-to-b from-rose-500/5 to-transparent p-2 md:p-4">
                <PlayerRoster
                  teamA={teamA}
                  teamB={null}
                  playerStats={
                    viewingMapIdx === null
                      ? playerStats
                      : mapPlayerStats[viewingMapIdx]
                  }
                  loading={loading}
                  mirrored={false}
                />
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Main Stage */}
          <div className="order-1 space-y-8 lg:order-2 lg:col-span-6">
            {/* Countdown Timer */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <CountdownTimer
                  startTime={scheduledTime}
                  status={match.status}
                />
              </div>
            </div>

            {/* Valorant Party Code */}
            {match.valoPartyCode &&
              (isAdmin ||
                (tournament?.gameType === "Deathmatch"
                  ? isRegistered
                  : teamA?.userId === user?.$id ||
                    teamB?.userId === user?.$id)) && (
                <div className="mx-auto w-full max-w-2xl">
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 backdrop-blur-xl md:rounded-3xl md:p-6">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="relative flex flex-col items-center justify-between gap-4 sm:flex-row">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                          <Gamepad2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black tracking-[0.2em] text-emerald-500 uppercase">
                            Valorant Party Code
                          </h4>
                          <p className="font-mono text-xl font-black tracking-wider text-white md:text-2xl">
                            {match.valoPartyCode}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(match.valoPartyCode);
                          showToast("Party code copied!", "success");
                        }}
                        className="group flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                      >
                        <Zap className="h-3.5 w-3.5 fill-current transition-transform group-hover:scale-125" />
                        Copy Code
                      </button>
                    </div>
                    <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      <p className="text-[9px] font-bold text-slate-500 uppercase">
                        Lobby is active • Join via Valorant "Open Party"
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Map Veto & Selection Stage */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-1 shadow-2xl backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent" />

              <div className="relative rounded-[20px] border border-white/5 bg-slate-950/80 p-6 md:p-8">
                <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-inner">
                      <MapIcon className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-white uppercase italic md:text-2xl">
                        Map Veto
                      </h2>
                      <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Pick & Ban Phase
                      </p>
                    </div>
                  </div>

                  {/* Veto Progress Pill */}
                  {!vetoState.selectedMap && !isCompleted && (
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                        Veto Progress ({getEffectiveFormat()})
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: MAP_POOL.length - 1 }).map(
                          (_, i) => {
                            const turnIdx = i + 1;
                            const action = getVetoAction(
                              turnIdx,
                              getEffectiveFormat(),
                            );
                            return (
                              <div
                                key={i}
                                className={`h-1.5 w-1.5 rounded-full transition-all ${
                                  i <
                                  vetoState.bannedMaps.length +
                                    vetoState.pickedMaps.length
                                    ? "bg-slate-700"
                                    : action === "pick"
                                      ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                                      : "bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]"
                                }`}
                                title={`Turn ${turnIdx}: ${action.toUpperCase()}`}
                              />
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}

                  {/* Completed Badge */}
                  {isCompleted && (
                    <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                        Match Completed
                      </span>
                    </div>
                  )}
                </div>

                {/* Selected Maps Hero */}
                {vetoState.selectedMaps?.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <Zap className="h-4 w-4 text-emerald-400" />
                      <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                        Series Maps Locked
                      </span>
                    </div>
                    <div
                      className={`grid gap-4 ${vetoState.selectedMaps.length > 1 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"}`}
                    >
                      {vetoState.selectedMaps.map((mapName, idx) => {
                        const mapInfo = MAP_POOL.find(
                          (m) => m.name === mapName,
                        );
                        const mapImage =
                          typeof mapInfo?.image === "object"
                            ? mapInfo?.image?.src
                            : mapInfo?.image;
                        return (
                          <div
                            key={mapName}
                            className="group relative aspect-video overflow-hidden rounded-2xl border border-white/10"
                          >
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center">
                              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-slate-950/80 px-3 py-1 text-[8px] font-black tracking-[0.2em] text-emerald-400 uppercase shadow-xl backdrop-blur-md">
                                Map {idx + 1}{" "}
                                {idx === vetoState.selectedMaps.length - 1 &&
                                vetoState.selectedMaps.length > 1
                                  ? "(Decider)"
                                  : ""}
                              </span>
                              <h3 className="text-2xl font-black text-white uppercase italic drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] md:text-3xl">
                                {mapName}
                              </h3>
                            </div>
                            <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                            <div
                              className="h-full w-full bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110"
                              style={{ backgroundImage: `url(${mapImage})` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : isCompleted ? (
                  /* Match Completed - No Map Selected State */
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-slate-800/50">
                      <MapIcon className="h-10 w-10 text-slate-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-black tracking-tight text-slate-400 uppercase">
                      Veto Not Completed
                    </h3>
                    <p className="max-w-sm text-sm text-slate-600">
                      The map veto process was not completed for this match.
                      Final map may have been decided by tournament admins.
                    </p>

                    {/* Show banned maps summary if any */}
                    {vetoState.bannedMaps.length > 0 && (
                      <div className="mt-8 w-full max-w-md">
                        <p className="mb-3 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                          Maps Banned ({vetoState.bannedMaps.length})
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {vetoState.bannedMaps.map((mapName) => (
                            <span
                              key={mapName}
                              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400"
                            >
                              {mapName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : !match.vetoStarted ? (
                  /* Veto Not Started State */
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20" />
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-slate-900">
                        <Clock className="h-10 w-10 text-indigo-400" />
                      </div>
                    </div>
                    <h3 className="mb-2 text-xl font-black tracking-tight text-white uppercase italic">
                      Waiting for Admin
                    </h3>
                    <p className="max-w-sm text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      The map veto phase hasn't started yet.
                      <br />
                      Please wait for the tournament administrator.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Turn Indicator */}
                    <div className="flex justify-center">
                      <div className="relative inline-flex items-center justify-center">
                        <div
                          className={`animate-glow-pulse absolute inset-0 opacity-20 blur-xl ${vetoState.currentTurn === "teamA" ? "bg-rose-500" : "bg-cyan-400"}`}
                        />
                        <div className="relative flex items-center gap-4 rounded-full border border-white/10 bg-slate-900/90 px-8 py-3 backdrop-blur-xl">
                          <div className="text-right">
                            <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                              Current Turn
                            </p>
                            <p
                              className={`text-sm font-black tracking-widest uppercase ${vetoState.currentTurn === "teamA" ? "text-rose-500" : "text-cyan-400"}`}
                            >
                              {vetoState.currentTurn === "teamA"
                                ? teamA?.teamName || "Team A"
                                : teamB?.teamName || "Team B"}
                            </p>
                          </div>
                          <div className={`h-8 w-[1px] bg-white/10`} />
                          <div
                            className={`text-xs font-black uppercase ${
                              vetoState.currentTurn === "teamA"
                                ? "text-rose-500"
                                : "text-cyan-400"
                            }`}
                          >
                            TO{" "}
                            {getVetoAction(
                              vetoState.bannedMaps.length +
                                vetoState.pickedMaps.length +
                                1,
                              getEffectiveFormat(),
                            ).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Maps Grid */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                      {MAP_POOL.slice(0, 12).map((map) => {
                        const isBanned = vetoState.bannedMaps.includes(
                          map.name,
                        );
                        const isPicked = vetoState.pickedMaps?.includes(
                          map.name,
                        );
                        const isBanning = banningMap === map.name;

                        return (
                          <MapCard3D
                            key={map.name}
                            map={map}
                            isBanned={isBanned}
                            isPicked={isPicked}
                            isSelected={false}
                            isBanning={isBanning}
                            onBan={handleBanMap}
                            disabled={isCompleted}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Match Rules & Info */}
            <div className="mt-8">
              <MatchInfo
                tournament={tournament}
                match={match}
                totalRounds={totalRounds}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Team B Roster (Sticky) */}
          <div className="order-3 space-y-6 lg:col-span-3">
            <div className="sticky top-6 space-y-4">
              <div className="flex items-center justify-end gap-2 border-b border-cyan-500/20 pb-2">
                <h3 className="text-xs font-black tracking-[0.2em] text-cyan-400 uppercase">
                  Team B Roster
                </h3>
                <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              </div>
              <div className="rounded-2xl border border-r-4 border-cyan-400/30 border-cyan-500/10 bg-gradient-to-b from-cyan-500/5 to-transparent p-2 md:p-4">
                <PlayerRoster
                  teamA={null}
                  teamB={teamB}
                  playerStats={
                    viewingMapIdx === null
                      ? playerStats
                      : mapPlayerStats[viewingMapIdx]
                  }
                  loading={loading}
                  mirrored={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 px-6 py-12 text-center md:px-8">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <Trophy className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="mb-2 text-2xl font-black tracking-tight text-white uppercase italic md:text-3xl">
                Confirm Victory
              </h2>
              <p className="text-sm font-medium text-slate-400">
                Please verify the final score before submitting.
              </p>
            </div>

            <div className="border-t border-white/5 bg-slate-950/50 p-6 md:p-8">
              <div className="mb-8 flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="mb-2 text-[10px] font-black tracking-widest text-rose-500 uppercase">
                    Team A
                  </p>
                  <span className="text-5xl font-black text-white italic">
                    {scoreA}
                  </span>
                </div>
                <div className="h-12 w-[1px] bg-white/10" />
                <div className="text-center">
                  <p className="mb-2 text-[10px] font-black tracking-widest text-cyan-400 uppercase">
                    Team B
                  </p>
                  <span className="text-5xl font-black text-white italic">
                    {scoreB}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowScoreModal(false)}
                  className="flex-1 rounded-xl border border-white/10 py-4 text-xs font-black tracking-widest text-slate-400 uppercase transition-all hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportScore}
                  disabled={submitting}
                  className="flex-[2] rounded-xl bg-emerald-500 py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm Result"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
