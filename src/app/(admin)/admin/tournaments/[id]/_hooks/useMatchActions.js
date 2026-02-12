import { useState } from "react";
import { toast } from "sonner";
import {
  updateMatchStatus,
  updateMatchDetails,
  resetMatch,
  startMatchVeto,
  finalizeMatch,
  parsePlayerStats,
  deleteMatches,
  updateMatchVeto,
} from "@/lib/brackets";
import { updateTournament } from "@/lib/tournaments";
import { sendTournamentMessageAction, broadcastMatchResultAction } from "@/app/actions/discord";
import { getMatchV4 } from "@/lib/valorant";
import { getUserProfile } from "@/lib/users";

export function useMatchActions(
  tournament, 
  setTournament, 
  matches, 
  setMatches, 
  registrations, 
  loadData,
  id // tournament ID
) {
  const [updating, setUpdating] = useState(false);
  
  // Match Editing State
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchEditData, setMatchEditData] = useState({
    scheduledTime: "",
    notes: "",
    valMatchId: "",
    scoreA: 0,
    scoreB: 0,
    valoPartyCode: "",
    playerStats: {},
    seriesScores: [],
    mapPlayerStats: [],
    matchFormat: "Auto",
  });
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [expandedPlayers, setExpandedPlayers] = useState({});
  const [savingMatch, setSavingMatch] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [valMatchId, setValMatchId] = useState("");
  const [valRegion, setValRegion] = useState("ap");
  const [isFetchingVal, setIsFetchingVal] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [mapMatchIds, setMapMatchIds] = useState({});
  const [fetchingMapIdx, setFetchingMapIdx] = useState(null);
  const [viewingMapIdx, setViewingMapIdx] = useState(-1);
  const [matchScores, setMatchScores] = useState({}); 
  const [matchPartyCodes, setMatchPartyCodes] = useState({});
  const [matchResetSteps, setMatchResetSteps] = useState({});

  const participantMap =
    registrations?.reduce((acc, r) => {
      const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata;
      acc[r.$id] = r.teamName
        ? { name: r.teamName }
        : meta
          ? { name: meta?.playerName || "Unknown" }
          : { name: "Player" };
      return acc;
    }, {}) || {};

  const formatToLocalISO = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const parseMetadata = (metadata) => {
    try {
      return typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    } catch (e) {
      return null;
    }
  };

  const fetchTeamPlayers = async (team, setPlayers) => {
    if (!team) {
      setPlayers([]);
      return;
    }

    try {
      let metadata = parseMetadata(team.metadata) || {};
      const players = [];

      if (metadata.members && Array.isArray(metadata.members)) {
        for (const member of metadata.members) {
          players.push({
            ingameName: member.name,
            tag: member.tag,
          });
        }
      } else {
        try {
          const userProfile = await getUserProfile(team.userId);
          if (userProfile) {
            players.push({
              ingameName: userProfile.ingameName || team.teamName,
              tag: userProfile.tag,
            });
          } else {
            players.push({
              ingameName: team.teamName || "Player",
              tag: null,
            });
          }
        } catch (e) {
          players.push({
            ingameName: team.teamName || "Player",
            tag: null,
          });
        }
      }

      setPlayers(players);
    } catch (error) {
      console.error("Error fetching team players:", error);
      setPlayers([]);
    }
  };

  const selectMatchForEdit = async (match) => {
    setSelectedMatch(match);
    const parsedStats = parsePlayerStats(match);

    setMatchEditData({
      scheduledTime: formatToLocalISO(match.scheduledTime),
      notes: match.notes || "",
      valoPartyCode: match.valoPartyCode || "",
      playerStats: parsedStats.players || {},
      scoreA: match.scoreA || 0,
      scoreB: match.scoreB || 0,
      matchFormat: match.matchFormat || "Auto",
      seriesScores:
        parsedStats.seriesScores.length > 0
          ? parsedStats.seriesScores
          : match.seriesScores
            ? JSON.parse(match.seriesScores)
            : [],
      mapPlayerStats:
        parsedStats.mapPlayerStats.length > 0
          ? parsedStats.mapPlayerStats
          : match.mapPlayerStats
            ? JSON.parse(match.mapPlayerStats)
            : [],
    });
    setExpandedPlayers({});
    setSaveStatus(null);

    const teamAReg = registrations.find((r) => r.$id === match.teamA);
    const teamBReg = registrations.find((r) => r.$id === match.teamB);

    await fetchTeamPlayers(teamAReg, setTeamAPlayers);
    await fetchTeamPlayers(teamBReg, setTeamBPlayers);
  };

  const handleUpdateMatchStatus = async (matchId, status) => {
    setUpdating(true);
    try {
      await updateMatchStatus(matchId, status);
      const updatedMatches = matches.map((m) =>
        m.$id === matchId ? { ...m, status } : m,
      );
      const allCompleted =
        updatedMatches.length > 0 &&
        updatedMatches.every((m) => m.status === "completed");

      if (allCompleted) {
        await updateTournament(id, { status: "completed" });
        setTournament((prev) => ({ ...prev, status: "completed" }));
      } else if (status === "ongoing") {
        await updateTournament(id, { status: "ongoing" });
        setTournament((prev) => ({ ...prev, status: "ongoing" }));
      } else if (status === "scheduled") {
        const anyOngoing = updatedMatches.some((m) => m.status === "ongoing");
        const anyCompleted = updatedMatches.some((m) => m.status === "completed");
        const newStatus = anyOngoing || anyCompleted ? "ongoing" : "scheduled";
        await updateTournament(id, { status: newStatus });
        setTournament((prev) => ({ ...prev, status: newStatus }));
      }
      setMatches(updatedMatches);

    } catch (e) {
      toast.error("Failed to update status: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveMatchDetails = async () => {
    if (!selectedMatch) return;
    setSavingMatch(true);
    setSaveStatus(null);

    try {
      await updateMatchDetails(selectedMatch.$id, {
        scheduledTime: matchEditData.scheduledTime
          ? new Date(matchEditData.scheduledTime).toISOString()
          : null,
        notes: matchEditData.notes,
        valoPartyCode: matchEditData.valoPartyCode,
        playerStats: matchEditData.playerStats,
        scoreA: parseInt(matchEditData.scoreA),
        scoreB: parseInt(matchEditData.scoreB),
        matchFormat: matchEditData.matchFormat,
        seriesScores: matchEditData.seriesScores,
        mapPlayerStats: matchEditData.mapPlayerStats,
      });

      setSaveStatus({ type: "success", message: "Match details saved!" });

      if (
        matchEditData.valoPartyCode &&
        matchEditData.valoPartyCode !== selectedMatch.valoPartyCode
      ) {
        if (tournament.discordChannelId) {
          let message = "";
          if (tournament.gameType === "Deathmatch") {
            message = `📢 **DEATHMATCH ARENA READY!**\n\n🔑 **Lobby Code:** \`${matchEditData.valoPartyCode}\`\n\n*All participants, please join the lobby immediately!*`;
          } else {
            const teamAName = participantMap[selectedMatch.teamA]?.name || "Team A";
            const teamBName = participantMap[selectedMatch.teamB]?.name || "Team B";
            message = `📢 **MATCH LOBBY READY!**\n**${teamAName}** vs **${teamBName}**\n\n🔑 **Lobby Code:** \`${matchEditData.valoPartyCode}\`\n\n*Please join the lobby immediately!*`;
          }

          await sendTournamentMessageAction(
            tournament.discordChannelId,
            message,
            tournament.discordRoleId,
          );
        }
      }

      await loadData();
      const updatedMatch = matches.find((m) => m.$id === selectedMatch.$id);
      if (updatedMatch) setSelectedMatch(updatedMatch);
    } catch (error) {
      console.error("Failed to save match details:", error);
      setSaveStatus({ type: "error", message: "Failed to save: " + error.message });
    } finally {
      setSavingMatch(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleFinalizeMatch = () => {
    if (!selectedMatch) return;
    // Basic validation
    if (matchEditData.scoreA === matchEditData.scoreB) {
      toast.error("Cannot finalize a draw. Please ensure there is a winner.");
      return;
    }

    toast("Finalize Match?", {
      description:
        "This will advance the winner to the next round and award stats.",
      action: {
        label: "Finalize",
        onClick: () => executeFinalizeMatch(),
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  const executeFinalizeMatch = async () => {
    setSavingMatch(true);
    try {
      await finalizeMatch(
        selectedMatch.$id,
        parseInt(matchEditData.scoreA),
        parseInt(matchEditData.scoreB),
      );
      await loadData(); // Reload to see bracket update
      toast.success("Match finalized and winner advanced!");
      closeMatchEditor();
    } catch (e) {
      console.error("Finalize Error:", e);
      toast.error("Failed to finalize: " + e.message);
    } finally {
      setSavingMatch(false);
    }
  };
  
  const handleImportMatchJSON = async (specificMapIdx = null) => {
    try {
      const matchIdToUse = specificMapIdx !== null
          ? (mapMatchIds[specificMapIdx] || valMatchId).trim()
          : valMatchId.trim();

      if (!matchIdToUse) return;

      setIsFetchingVal(true);
      if (specificMapIdx !== null) setFetchingMapIdx(specificMapIdx);
      
      setImportStatus({
        type: "info",
        message: specificMapIdx !== null
            ? `Fetching map ${specificMapIdx + 1}...`
            : "Fetching match data...",
      });

      const jsonData = await getMatchV4(valRegion, matchIdToUse);
      const matchData = jsonData.data || jsonData;

      const jsonPlayers = (Array.isArray(matchData.players) ? matchData.players : matchData.players?.all_players) || [];
      const jsonTeamsRaw = matchData.teams || {};
      const jsonTeams = Array.isArray(jsonTeamsRaw) 
        ? jsonTeamsRaw 
        : Object.entries(jsonTeamsRaw).map(([key, val]) => ({ ...val, team_id: key, team: key }));

      if (!jsonPlayers.length || !jsonTeams.length) {
        throw new Error("Invalid match data structure received from the API (Empty players or teams).");
      }

      const t0 = jsonTeams[0] || {};
      const totalRounds = (t0.rounds?.won || t0.rounds_won || 0) + (t0.rounds?.lost || t0.rounds_lost || 0) || matchData.metadata?.rounds_played || 0;

      let jsonTeamAId = null;
      let jsonTeamBId = null;

      // 1. Map Team A
      for (const p of jsonPlayers) {
        const foundA = teamAPlayers.some(
          (tp) => (tp.ingameName || "").toLowerCase() === (p.name || "").toLowerCase(),
        );
        if (foundA) {
          jsonTeamAId = p.team_id || p.team;
          break;
        }
      }

      // 2. Identify Team B
      if (jsonTeamAId) {
        jsonTeamBId = jsonTeams.find((t) => t.team_id !== jsonTeamAId)?.team_id;
      } else {
        for (const p of jsonPlayers) {
          const foundB = teamBPlayers.some(
            (tp) => (tp.ingameName || "").toLowerCase() === (p.name || "").toLowerCase(),
          );
          if (foundB) {
            jsonTeamBId = p.team_id || p.team;
            break;
          }
        }
        if (jsonTeamBId) {
          jsonTeamAId = jsonTeams.find((t) => (t.team_id || t.team) !== jsonTeamBId)?.team_id || jsonTeams.find((t) => (t.team_id || t.team) !== jsonTeamBId)?.team;
        }
      }

      if (!jsonTeamAId || !jsonTeamBId) {
        throw new Error("Could not identify teams. Ensure player names match registered members.");
      }

      const scoreA = jsonTeams.find((t) => t.team_id === jsonTeamAId)?.rounds.won || 0;
      const scoreB = jsonTeams.find((t) => t.team_id === jsonTeamBId)?.rounds.won || 0;

      const mapStats = {};
      const processPlayers = (tournamentPlayers, prefix, targetTeamId) => {
        tournamentPlayers.forEach((tp, idx) => {
          const jp = jsonPlayers.find(
            (p) =>
              (p.team_id === targetTeamId || p.team === targetTeamId) &&
              (p.name || "").toLowerCase() === (tp.ingameName || "").toLowerCase(),
          );
          if (jp) {
            const playerScore = jp.stats.score || 0;
            const playerAcs = totalRounds > 0 ? Math.round(playerScore / totalRounds) : 0;
            mapStats[`${prefix}_${idx}`] = {
              kills: jp.stats.kills || 0,
              deaths: jp.stats.deaths || 0,
              assists: jp.stats.assists || 0,
              score: playerScore,
              rounds: totalRounds,
              acs: playerAcs,
              agent: jp.agent?.name || null,
              agentId: jp.agent?.id || null,
              playerCard: jp.card_id || null,
            };
          }
        });
      };

      processPlayers(teamAPlayers, "teamA", jsonTeamAId);
      processPlayers(teamBPlayers, "teamB", jsonTeamBId);

      setMatchEditData((prev) => {
        const newMapPlayerStats = [...(prev.mapPlayerStats || [])];
        if (specificMapIdx !== null) {
          newMapPlayerStats[specificMapIdx] = mapStats;
        }

        const newSeriesScores = [...(prev.seriesScores || [])];
        if (specificMapIdx !== null) {
          newSeriesScores[specificMapIdx] = { a: scoreA, b: scoreB };
        }

        const aggregatePlayerStats = {};
        const allMaps = specificMapIdx !== null ? newMapPlayerStats : [mapStats];

        allMaps.forEach((mStats) => {
          if (!mStats) return;
          Object.entries(mStats).forEach(([key, stats]) => {
            if (!aggregatePlayerStats[key]) {
              aggregatePlayerStats[key] = {
                kills: 0, deaths: 0, assists: 0, score: 0, rounds: 0,
                agent: stats.agent, agentId: stats.agentId, playerCard: stats.playerCard,
              };
            }
            aggregatePlayerStats[key].kills += stats.kills;
            aggregatePlayerStats[key].deaths += stats.deaths;
            aggregatePlayerStats[key].assists += stats.assists;
            aggregatePlayerStats[key].score += stats.score;
            aggregatePlayerStats[key].rounds += stats.rounds;
            aggregatePlayerStats[key].agent = stats.agent;
            aggregatePlayerStats[key].agentId = stats.agentId;
            aggregatePlayerStats[key].playerCard = stats.playerCard;
          });
        });

        Object.keys(aggregatePlayerStats).forEach((key) => {
          const s = aggregatePlayerStats[key];
          s.acs = s.rounds > 0 ? Math.round(s.score / s.rounds) : 0;
        });

        let winsA = scoreA;
        let winsB = scoreB;
        if (specificMapIdx !== null) {
          winsA = 0; winsB = 0;
          newSeriesScores.forEach((s) => {
            if (s.a > s.b) winsA++;
            else if (s.b > s.a) winsB++;
          });
        } else {
          // Normalize score logic for single map import
          const teamAObj = jsonTeams.find(t => (t.team_id || t.team) === jsonTeamAId);
          const teamBObj = jsonTeams.find(t => (t.team_id || t.team) === jsonTeamBId);
          winsA = teamAObj?.rounds_won ?? teamAObj?.rounds?.won ?? scoreA;
          winsB = teamBObj?.rounds_won ?? teamBObj?.rounds?.won ?? scoreB;
        }

        return {
          ...prev,
          scoreA: winsA,
          scoreB: winsB,
          seriesScores: newSeriesScores,
          mapPlayerStats: newMapPlayerStats,
          playerStats: aggregatePlayerStats,
        };
      });

      setImportStatus({
        type: "success",
        message: specificMapIdx !== null ? `Map ${specificMapIdx + 1} imported!` : "Match data imported!",
      });
      if (specificMapIdx !== null) {
        setMapMatchIds((prev) => ({ ...prev, [specificMapIdx]: "" }));
      } else {
        setValMatchId("");
      }
      setTimeout(() => setImportStatus(null), 3000);
    } catch (e) {
      console.error("Import Error:", e);
      setImportStatus({ type: "error", message: e.message });
      setTimeout(() => setImportStatus(null), 5000);
    } finally {
      setIsFetchingVal(false);
      setFetchingMapIdx(null);
    }
  };

  /**
   * Auto-fetch DM match stats from Henrik Valorant API.
   * Matches API players to tournament registrations by Riot ID.
   * Returns { matched: { [regId]: { kills, deaths } }, unmatched: string[] }
   */
  const handleImportDMMatchJSON = async (dmRegistrations) => {
    try {
      const matchIdToUse = valMatchId.trim();
      if (!matchIdToUse) {
        toast.error("Please enter a Match ID.");
        return null;
      }

      setIsFetchingVal(true);
      setImportStatus({ type: "info", message: "Fetching DM match data..." });

      const jsonData = await getMatchV4(valRegion, matchIdToUse);
      const matchData = jsonData.data || jsonData;

      const apiPlayers = (Array.isArray(matchData.players) ? matchData.players : matchData.players?.all_players) || [];

      if (!apiPlayers.length) {
        throw new Error("Invalid match data — no players found.");
      }

      // Validate that this is actually a Deathmatch
      const metadata = matchData.metadata || {};
      const extractStr = (val) => {
        if (!val) return "";
        if (typeof val === "string") return val;
        return val.name || val.localized || val.id || String(val);
      };

      // 1. Check metadata strings (standard detection)
      const isDetailedMatch = Object.values(metadata).some(val => 
        extractStr(val).toLowerCase().includes("deathmatch")
      );
      
      // 2. Smart Detection: Check if it's an FFA match (team IDs are PUUIDs, not "Red" or "Blue")
      const isFFA = apiPlayers.some(p => {
        const team = String(p.team || p.team_id || "").toLowerCase();
        return team && team !== "red" && team !== "blue" && team !== "neutral";
      });

      const isDM = isDetailedMatch || isFFA;
      
      if (!isDM) {
        const displayMode = extractStr(metadata.mode) || "Unknown";
        const displayQueue = extractStr(metadata.queue) || "Unknown";
        throw new Error(`This match is "${displayMode}" (Queue: ${displayQueue}) — not a Deathmatch. Please use a DM match ID.`);
      }

      // No change needed here anymore as apiPlayers is already defined above
      const matched = {};
      const unmatchedApi = [];

      // Build a lookup from registration data
      const regLookup = {};
      (dmRegistrations || []).forEach((reg) => {
        const meta = parseMetadata(reg.metadata) || {};
        const possibleNames = [
          reg.teamName,
          meta.playerName,
          meta.riotId,
          meta.ingameName
        ].filter(Boolean);

        possibleNames.forEach(nameStr => {
          // 1. Name part (before #)
          const namePart = nameStr.split("#")[0].trim().toLowerCase();
          regLookup[namePart] = reg;
          
          // 2. Full ID (normalized by removing spaces)
          const fullIdNormalized = nameStr.replace(/[#\s]/g, "").toLowerCase();
          regLookup[fullIdNormalized] = reg;
        });
      });

      // Match each API player to a registration
      for (const ap of apiPlayers) {
        const apiName = (ap.name || "").trim().toLowerCase();
        const apiTag = (ap.tag || "").trim().toLowerCase();
        const apiFullNormalized = (apiName + apiTag).replace(/\s/g, "");
        
        // Try matching by name part or full normalized ID
        const reg = regLookup[apiName] || regLookup[apiFullNormalized];
        
        if (reg) {
          matched[reg.$id] = {
            kills: ap.stats?.kills || 0,
            deaths: ap.stats?.deaths || 0,
            score: ap.stats?.score || 0,
          };
        } else {
          unmatchedApi.push(`${ap.name}#${ap.tag}`);
        }
      }

      const matchedCount = Object.keys(matched).length;
      const totalRegs = (dmRegistrations || []).length;

      if (matchedCount === 0) {
        const sampleApi = apiPlayers.slice(0, 5).map(p => `${p.name}#${p.tag}`).join(", ");
        throw new Error(
          `No players matched. API has players like: [${sampleApi}]. Ensure your tournament registrations match these exactly.`
        );
      }

      let statusMsg = `Matched ${matchedCount}/${totalRegs} players.`;
      if (unmatchedApi.length > 0) {
        statusMsg += ` Unmatched API players: ${unmatchedApi.join(", ")}`;
      }

      setImportStatus({ type: "success", message: statusMsg });
      setValMatchId("");
      setTimeout(() => setImportStatus(null), 5000);

      return { matched, unmatched: unmatchedApi };
    } catch (e) {
      console.error("DM Import Error:", e);
      setImportStatus({ type: "error", message: e.message });
      setTimeout(() => setImportStatus(null), 5000);
      return null;
    } finally {
      setIsFetchingVal(false);
    }
  };

  const handleStartVeto = async (matchId) => {
    setUpdating(true);
    try {
      await startMatchVeto(matchId);
      await loadData();
      toast.success("Map veto started for this match!");
    } catch (error) {
      console.error("Failed to start veto:", error);
      toast.error("Failed to start veto: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleResetIndividualMatch = async (matchId) => {
    const currentStep = matchResetSteps[matchId] || 0;
    if (currentStep === 0) {
      setMatchResetSteps((prev) => ({ ...prev, [matchId]: 1 }));
      setTimeout(() => {
        setMatchResetSteps((prev) => ({ ...prev, [matchId]: 0 }));
      }, 3000);
      return;
    }
    setMatchResetSteps((prev) => ({ ...prev, [matchId]: 2 }));
    setUpdating(true);
    try {
      await resetMatch(matchId);
      await loadData();
      setMatchResetSteps((prev) => ({ ...prev, [matchId]: 0 }));
    } catch (error) {
      console.error("Failed to reset match:", error);
      toast.error("Failed to reset match: " + error.message);
      setMatchResetSteps((prev) => ({ ...prev, [matchId]: 0 }));
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveMatchScore = (matchId) => {
    const scores = matchScores[matchId];
    const currentMatch = matches.find((m) => m.$id === matchId);
    if (!currentMatch) return;

    const scoreA =
      scores?.scoreA !== undefined
        ? parseInt(scores.scoreA)
        : currentMatch.scoreA || 0;
    const scoreB =
      scores?.scoreB !== undefined
        ? parseInt(scores.scoreB)
        : currentMatch.scoreB || 0;

    if (scoreA === scoreB) {
      toast.error("Cannot finalize a match with a tie score!");
      return;
    }

    toast("Finalize Match Score?", {
      description: `Finalize match with score ${scoreA} - ${scoreB}?`,
      action: {
        label: "Finalize",
        onClick: () => executeSaveMatchScore(matchId, scoreA, scoreB, currentMatch),
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  const executeSaveMatchScore = async (matchId, scoreA, scoreB, currentMatch) => {
    setUpdating(true);
    try {
      await finalizeMatch(matchId, scoreA, scoreB);

      // --- Discord Result Broadcasting ---
      try {
        const teamAName = participantMap[currentMatch.teamA]?.name || "Team A";
        const teamBName = participantMap[currentMatch.teamB]?.name || "Team B";
        const winnerName = scoreA > scoreB ? teamAName : teamBName;

        let message = `🏆 **MATCH RESULT**\n\n**${teamAName}** vs **${teamBName}**\n\n**Winner:** ${winnerName} 👑\n**Score:** ${scoreA} - ${scoreB}`;

        // Attempt to add detailed stats (Map Scores)
        try {
          const parsedStats = parsePlayerStats(currentMatch);
          if (parsedStats.seriesScores && parsedStats.seriesScores.length > 0) {
            const mapsPlayed = parsedStats.seriesScores.filter(
              (s) => s.a > 0 || s.b > 0,
            );
            if (mapsPlayed.length > 0) {
              message += `\n\n**Map Breakdown:**`;
              mapsPlayed.forEach((s, i) => {
                message += `\nMap ${i + 1}: ${s.a} - ${s.b}`;
              });
            }
          }
        } catch (e) {
          console.warn("Error parsing match stats for discord:", e);
        }

        const origin = window.location.origin;
        const matchLink = `${origin}/tournaments/${tournament.$id}/match/${matchId}`;
        const tournamentLink = `${origin}/tournaments/${tournament.$id}`;
        message += `\n\n🔗 **View Match Details:** [Click Here](${matchLink})`;

        const publicMessage = `🏆 **MATCH RESULT**\n**[${tournament.name}](${tournamentLink})**\n*Round ${currentMatch.round || "1"} • ${currentMatch.matchFormat || "Auto"}*\n\n**${teamAName}** vs **${teamBName}**\n\n**Winner:** ${winnerName} 👑\n**Score:** ${scoreA} - ${scoreB}\n\n🔗 **View Match Details:** [Click Here](${matchLink})`;

        // Send to Tournament Channel (if exists) AND Public Results Channel
        await broadcastMatchResultAction(
          tournament.discordChannelId,
          message,
          tournament.discordRoleId,
          publicMessage,
        );
      } catch (err) {
        console.error("Failed to send Discord result notification:", err);
      }

      await loadData();
      setMatchScores((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
      toast.success("Match finalized and winner advanced!");
    } catch (error) {
      console.error("Failed to finalize match:", error);
      toast.error("Failed to finalize match: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSavePartyCode = async (matchId) => {
    const newCode = matchPartyCodes[matchId];
    const currentMatch = matches.find((m) => m.$id === matchId);
    if (!currentMatch || newCode === undefined) return;

    setUpdating(true);
    try {
      await updateMatchDetails(matchId, {
        valoPartyCode: newCode,
      });

      // Send Discord notification if changed
      if (newCode && newCode !== currentMatch.valoPartyCode) {
        if (tournament.discordChannelId) {
          const teamAName = participantMap[currentMatch.teamA]?.name || "Team A";
          const teamBName = participantMap[currentMatch.teamB]?.name || "Team B";
          const message = `📢 **MATCH LOBBY READY!**\n**${teamAName}** vs **${teamBName}**\n\n🔑 **Lobby Code:** \`${newCode}\`\n\n*Please join the lobby immediately!*`;
          
          try {
            await sendTournamentMessageAction(
              tournament.discordChannelId,
              message,
              tournament.discordRoleId,
            );
          } catch (discordErr) {
            console.warn("Discord notification failed:", discordErr);
          }
        }
      }

      await loadData();
      setMatchPartyCodes((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    } catch (error) {
      console.error("Failed to save party code:", error);
      toast.error("Failed to save: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const closeMatchEditor = () => {
    setSelectedMatch(null);
    setTeamAPlayers([]);
    setTeamBPlayers([]);
    setMatchEditData({
      scheduledTime: "",
      notes: "",
      valoPartyCode: "",
      playerStats: {},
      scoreA: 0,
      scoreB: 0,
    });
    setMapMatchIds({});
    setValMatchId("");
    setViewingMapIdx(-1);
  };

  const handleSkirmishLottery = async (matchId) => {
    setUpdating(true);
    try {
      const SKIRMISH_MAPS = ["Skirmish A", "Skirmish B", "Skirmish C"];
      const randomMap =
        SKIRMISH_MAPS[Math.floor(Math.random() * SKIRMISH_MAPS.length)];

      const vetoData = JSON.stringify({
        map: randomMap,
        status: "completed",
        logs: [
          { action: "lottery_win", map: randomMap, timestamp: Date.now() },
        ],
      });

      await updateMatchVeto(matchId, vetoData, true);

      await loadData();
    } catch (e) {
      console.error("Skirmish lottery failed", e);
      toast.error("Failed to run map lottery: " + e.message);
    } finally {
      setUpdating(false);
    }
  };
  
  const updateMapScore = (index, team, value) => {
      setMatchEditData((prev) => {
        const newSeriesScores = [...(prev.seriesScores || [])];
        if (!newSeriesScores[index]) newSeriesScores[index] = { a: 0, b: 0 };
        newSeriesScores[index][team] = parseInt(value) || 0;
  
        // Calculate new series score (map wins)
        let winsA = 0;
        let winsB = 0;
        newSeriesScores.forEach((s) => {
          if (s.a > s.b) winsA++;
          else if (s.b > s.a) winsB++;
        });
  
        return {
          ...prev,
          seriesScores: newSeriesScores,
          scoreA: winsA,
          scoreB: winsB,
        };
      });
  };

  const updatePlayerStat = (playerKey, stat, value, mapIndex = -1) => {
    setMatchEditData((prev) => {
      if (mapIndex !== -1) {
        // Update Map Players Stats
        const newMapPlayerStats = { ...prev.mapPlayerStats };
        if (!newMapPlayerStats[mapIndex]) newMapPlayerStats[mapIndex] = {};
        
        const currentStats = newMapPlayerStats[mapIndex][playerKey] || {
          kills: 0, deaths: 0, assists: 0, acs: 0, agent: null,
        };

        newMapPlayerStats[mapIndex][playerKey] = {
          ...currentStats,
          [stat]: stat === "agent" ? value : parseInt(value) || 0,
        };

        return { ...prev, mapPlayerStats: newMapPlayerStats };
      } else {
        // Update Aggregate Stats
        return {
          ...prev,
          playerStats: {
            ...prev.playerStats,
            [playerKey]: {
              ...(prev.playerStats[playerKey] || {
                kills: 0, deaths: 0, assists: 0, acs: 0, agent: null,
              }),
              [stat]: stat === "agent" ? value : parseInt(value) || 0,
            },
          },
        };
      }
    });
  };

  const togglePlayerExpand = (playerKey) => {
    setExpandedPlayers((prev) => ({
      ...prev,
      [playerKey]: !prev[playerKey],
    }));
  };

  return {
    updating,
    setUpdating,
    // Edit State
    selectedMatch,
    matchEditData,
    setMatchEditData,
    teamAPlayers,
    teamBPlayers,
    expandedPlayers,
    savingMatch,
    saveStatus,
    valMatchId,
    setValMatchId,
    valRegion,
    setValRegion,
    isFetchingVal,
    importStatus,
    mapMatchIds, 
    setMapMatchIds,
    fetchingMapIdx, 
    viewingMapIdx, 
    setViewingMapIdx,
    
    // Actions
    selectMatchForEdit,
    closeMatchEditor,
    handleSaveMatchDetails,
    handleImportMatchJSON,
    handleImportDMMatchJSON,
    handleUpdateMatchStatus,
    handleStartVeto,
    handleResetIndividualMatch,
    handleSaveMatchScore,
    handleSavePartyCode,
    matchScores, 
    setMatchScores,
    matchPartyCodes,
    setMatchPartyCodes,
    matchResetSteps,
    updateMapScore,
    updatePlayerStat,
    togglePlayerExpand,
    handleSkirmishLottery,
    handleFinalizeMatch,
  };
}
