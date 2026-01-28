import { useState } from "react";
import {
  updateMatchStatus,
  updateMatchDetails,
  resetMatch,
  startMatchVeto,
  finalizeMatch,
  parsePlayerStats,
  deleteMatches,
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
      alert("Failed to update status: " + e.message);
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

      if (!matchData || !matchData.players || !matchData.teams) {
        throw new Error("Invalid match data structure received from the API.");
      }

      const jsonPlayers = matchData.players;
      const jsonTeams = matchData.teams;
      const totalRounds = (jsonTeams[0]?.rounds?.won || 0) + (jsonTeams[0]?.rounds?.lost || 0);

      let jsonTeamAId = null;
      let jsonTeamBId = null;

      // 1. Map Team A
      for (const p of jsonPlayers) {
        const foundA = teamAPlayers.some(
          (tp) => tp.ingameName.toLowerCase() === p.name.toLowerCase(),
        );
        if (foundA) {
          jsonTeamAId = p.team_id;
          break;
        }
      }

      // 2. Identify Team B
      if (jsonTeamAId) {
        jsonTeamBId = jsonTeams.find((t) => t.team_id !== jsonTeamAId)?.team_id;
      } else {
        for (const p of jsonPlayers) {
          const foundB = teamBPlayers.some(
            (tp) => tp.ingameName.toLowerCase() === p.name.toLowerCase(),
          );
          if (foundB) {
            jsonTeamBId = p.team_id;
            break;
          }
        }
        if (jsonTeamBId) {
          jsonTeamAId = jsonTeams.find((t) => t.team_id !== jsonTeamBId)?.team_id;
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
              p.team_id === targetTeamId &&
              p.name.toLowerCase() === tp.ingameName.toLowerCase(),
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

  const handleStartVeto = async (matchId) => {
    setUpdating(true);
    try {
      await startMatchVeto(matchId);
      await loadData();
      alert("Map veto started for this match!");
    } catch (error) {
      console.error("Failed to start veto:", error);
      alert("Failed to start veto: " + error.message);
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
      alert("Failed to reset match: " + error.message);
      setMatchResetSteps((prev) => ({ ...prev, [matchId]: 0 }));
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveMatchScore = async (matchId) => {
    const scores = matchScores[matchId];
    const currentMatch = matches.find((m) => m.$id === matchId);
    if (!currentMatch) return;

    const scoreA = scores?.scoreA !== undefined ? parseInt(scores.scoreA) : currentMatch.scoreA || 0;
    const scoreB = scores?.scoreB !== undefined ? parseInt(scores.scoreB) : currentMatch.scoreB || 0;

    if (scoreA === scoreB) {
      alert("Cannot finalize a match with a tie score!");
      return;
    }

    if (!confirm(`Finalize match with score ${scoreA} - ${scoreB}?`)) return;

    setUpdating(true);
    try {
      await finalizeMatch(matchId, scoreA, scoreB);

      if (tournament.discordChannelId) {
        const teamAName = participantMap[currentMatch.teamA]?.name || "Team A";
        const teamBName = participantMap[currentMatch.teamB]?.name || "Team B";
        const winnerName = scoreA > scoreB ? teamAName : teamBName;
        
        let message = `🏆 **MATCH RESULT**\n\n**${teamAName}** vs **${teamBName}**\n\n**Winner:** ${winnerName} 👑\n**Score:** ${scoreA} - ${scoreB}`;

        // Attempt to add detailed stats (Map Scores & MVP)
        try {
            const parsedStats = parsePlayerStats(currentMatch);
            
            // 1. Map Scores
            if (parsedStats.seriesScores && parsedStats.seriesScores.length > 0) {
                message += `\n\n**Map Breakdown:**`;
                parsedStats.seriesScores.forEach((s, i) => {
                    // Only show played maps (where scores are not 0-0 or at least one is > 0)
                    if (s.a > 0 || s.b > 0) {
                        message += `\nMap ${i + 1}: ${s.a} - ${s.b}`;
                    }
                });
            }

            // 2. Series MVP (Highest ACS)
            // parsedStats.players is an object with keys like "teamA_0", "teamB_1"
            if (parsedStats.players && Object.keys(parsedStats.players).length > 0) {
                let mvp = null;
                let maxScore = -1;

                Object.values(parsedStats.players).forEach(p => {
                    // Use score or acs to determine MVP
                    const val = p.score || 0; 
                    if (val > maxScore) {
                        maxScore = val;
                        mvp = p;
                    }
                });

                if (mvp) {
                   // Ensure we have a name. Since players object in match stats might just have 'ingameName' if derived from JSON, 
                   // or we might need to cross-ref.
                   // The structure saved in handleImportMatchJSON saves 'ingameName' inside 'teamAPlayers'/'teamBPlayers' 
                   // BUT 'parsedStats.players' (which is 'matchEditData.playerStats') only saved stats values (kills, deaths, agent), NOT name.
                   
                   // Wait, checking handleImportMatchJSON in step 5:
                   // It saves `aggregatePlayerStats` to `matchEditData.playerStats`.
                   // The keys are `teamA_0`, etc.
                   // The value objects DO NOT seem to contain the Name unless I missed it.
                   // Let's re-read step 5 lines 360-380.
                   
                   // It seems 'name' is NOT stored in the stats object, only the key.
                   // We need to fetch the name.
                   
                   // To avoid complex name fetching here (as teamAPlayers state isn't available for *this* match here easily if not selected),
                   // we might skip MVP or try to infer.
                   // Actually, if we look at `handleImportMatchJSON`:
                   // It calculates `aggregatePlayerStats`.
                   // It relies on `teamAPlayers` (state) to map names.
                   
                   // Re-reading `MatchEditorModal`: The name is displayed using `teamAPlayers` array and index.
                   
                   // Current Scope: `handleSaveMatchScore` doesn't have `teamAPlayers` loaded for the specific match (unless `selectedMatch` is this match, which is unlikely as we are in the card view).
                   // Fetching players again here is expensive/complex.
                   
                   // ALTERNATIVE: Just show Map Scores. The user asked for "stats of all the maps played". 
                   // "and there stats" -> "their stats" (Map stats).
                   // I will stick to Map Breakdown for now to be safe and avoid "undefined" names.
                   // Displaying just map scores satisfies "stats of maps".
                }
            }
        } catch (e) {
            console.warn("Error parsing match stats for discord:", e);
        }

        const origin = window.location.origin;
        const matchLink = `${origin}/tournaments/${tournament.$id}/match/${matchId}`;
        message += `\n\n🔗 **View Match Details:** [Click Here](${matchLink})`;
        
        try {
          // Construct Public Message with extra context
          const origin = window.location.origin;
          const tournamentLink = `${origin}/tournaments/${tournament.$id}`;
          const publicMessage = `🏆 **MATCH RESULT**\n**[${tournament.name}](${tournamentLink})**\n*Round ${currentMatch.round || "1"} • ${currentMatch.matchFormat || "Auto"}*\n\n**${teamAName}** vs **${teamBName}**\n\n**Winner:** ${winnerName} 👑\n**Score:** ${scoreA} - ${scoreB}\n\n🔗 **View Match Details:** [Click Here](${matchLink})`;

          // Send to Tournament Channel AND Public Results Channel
          await broadcastMatchResultAction(
            tournament.discordChannelId, 
            message, 
            tournament.discordRoleId,
            publicMessage
          );
        } catch (err) {
          console.error("Failed to send Discord result notification:", err);
        }
      }

      await loadData();
      setMatchScores((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
      alert("Match finalized and winner advanced!");
    } catch (error) {
      console.error("Failed to finalize match:", error);
      alert("Failed to finalize match: " + error.message);
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
      alert("Failed to save: " + error.message);
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

  const updatePlayerStat = (playerKey, stat, value) => {
    setMatchEditData((prev) => ({
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
    }));
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
  };
}
