"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  getTournament,
  updateTournament,
  deleteTournament,
  getRegistrations,
  updateRegistrationPaymentStatus,
  registerForTournament,
  deleteRegistration,
} from "@/lib/tournaments";
import {
  getTournamentPaymentRequests,
  updatePaymentRequestStatus,
} from "@/lib/payment_requests";
import {
  deleteTournamentChannelsAction,
  assignTournamentRoleAction,
  sendTournamentMessageAction,
} from "@/app/actions/discord";
import {
  getMatches,
  updateMatchStatus,
  updateParticipantScore,
  deleteMatches,
  createBracket,
  finalizeMatch,
  finalizeDeathmatch,
  revertTournamentStats,
  updateMatchDetails,
  parsePlayerStats,
  resetMatch,
  startMatchVeto,
} from "@/lib/brackets";
import { getUserProfile } from "@/lib/users";
import {
  Trophy,
  Users,
  Swords,
  Settings,
  ChevronLeft,
  Calendar,
  ShieldCheck,
  User,
  Info,
  Check,
  X,
  Edit2,
  Trash2,
  Plus,
  ExternalLink,
  Loader as LoaderIcon,
  RotateCcw,
  Clock,
  Target,
  Skull,
  Medal,
  FileText,
  Save,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Map as MapIcon,
} from "lucide-react";
import Loader from "@/components/Loader";
import Link from "next/link";

export default function TournamentControlPage({ params }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const router = useRouter();

  const [tournament, setTournament] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("participants");

  const [editingTournamentId, setEditingTournamentId] = useState(null);
  const [bulkEditValues, setBulkEditValues] = useState({});
  const [resetStep, setResetStep] = useState(0);
  const [resetError, setResetError] = useState(null);
  const [startStep, setStartStep] = useState(0);
  const [startError, setStartError] = useState(null);
  const [matchScores, setMatchScores] = useState({}); // { [matchId]: { scoreA: 0, scoreB: 0 } }
  const [matchResetSteps, setMatchResetSteps] = useState({}); // { [matchId]: 0 | 1 | 2 } for reset confirmation

  // Enhanced Match Editing State
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchEditData, setMatchEditData] = useState({
    scheduledTime: "",
    notes: "",
    playerStats: {},
    scoreA: 0,
    scoreB: 0,
  });
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [expandedPlayers, setExpandedPlayers] = useState({});
  const [savingMatch, setSavingMatch] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Rejection Modal State
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedRequestForRejection, setSelectedRequestForRejection] =
    useState(null);
  const [rejectionReason, setRejectionReason] = useState(
    "Invalid Transaction ID",
  );
  const [customRejectionReason, setCustomRejectionReason] = useState("");

  const REJECTION_REASONS = [
    "Invalid Transaction ID",
    "Payment Not Received",
    "Incorrect Amount",
    "Duplicate Request",
    "Other",
  ];

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    gameType: "5v5",
    prizePool: "",
    maxTeams: 8,
    location: "Online",
    date: "",
    firstPrize: "",
    secondPrize: "",
    additionalPrizes: [],
    description: "",
    entryFee: "",
    status: "scheduled",
    discordChannelId: "",
    discordVoiceChannelId: "",
    discordRoleId: "",
    discordInviteUrl: "",
    valoPartyCode: "",
    checkInEnabled: false,
    checkInStart: "",
  });

  const formatToLocalISO = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [tData, regsRes, matchesRes, payReqsRes] = await Promise.all([
        getTournament(id),
        getRegistrations(id),
        getMatches(id),
        getTournamentPaymentRequests(id),
      ]);

      // Auto-fix count discrepancy
      // If the counter on the tournament doc doesn't match the actual number of registration docs
      if (tData.registeredTeams !== regsRes.total) {
        console.warn(
          `Fixing count discrepancy: ${tData.registeredTeams} -> ${regsRes.total}`,
        );
        await updateTournament(id, { registeredTeams: regsRes.total });
        tData.registeredTeams = regsRes.total; // Update local object
      }

      setTournament(tData);
      setRegistrations(regsRes.documents);
      setMatches(matchesRes);
      setPaymentRequests(payReqsRes);

      // Sync edit form with loaded data
      setEditForm({
        name: tData.name || "",
        gameType: tData.gameType || "5v5",
        prizePool: tData.prizePool || "",
        maxTeams: tData.maxTeams || 8,
        location: tData.location || "Online",
        date: formatToLocalISO(tData.date),
        firstPrize: tData.firstPrize || "",
        secondPrize: tData.secondPrize || "",
        additionalPrizes: tData.additionalPrizes
          ? typeof tData.additionalPrizes === "string"
            ? JSON.parse(tData.additionalPrizes)
            : tData.additionalPrizes
          : [],
        description: tData.description || "",
        entryFee: tData.entryFee || "",
        status: tData.status || "scheduled",
        discordChannelId: tData.discordChannelId || "",
        discordVoiceChannelId: tData.discordVoiceChannelId || "",
        discordRoleId: tData.discordRoleId || "",
        discordInviteUrl: tData.discordInviteUrl || "",
        valoPartyCode: tData.valoPartyCode || "",
        checkInEnabled: tData.checkInEnabled || false,
        checkInStart: formatToLocalISO(tData.checkInStart),
      });
    } catch (error) {
      console.error("Failed to load tournament data", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleTogglePayment = async (regId, newStatus) => {
    try {
      setUpdating(true);
      await updateRegistrationPaymentStatus(regId, newStatus);
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.$id === regId ? { ...reg, paymentStatus: newStatus } : reg,
        ),
      );
    } catch (e) {
      alert("Failed to update payment: " + e.message);
    } finally {
      setUpdating(false);
    }
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
        const anyCompleted = updatedMatches.some(
          (m) => m.status === "completed",
        );
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

  const parseMetadata = (metadata) => {
    try {
      return typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    } catch (e) {
      return null;
    }
  };

  // Enhanced Match Editing Functions
  const selectMatchForEdit = async (match) => {
    setSelectedMatch(match);
    setMatchEditData({
      scheduledTime: formatToLocalISO(match.scheduledTime),
      notes: match.notes || "",
      playerStats: parsePlayerStats(match) || {},
      scoreA: match.scoreA || 0,
      scoreB: match.scoreB || 0,
    });
    setExpandedPlayers({});
    setSaveStatus(null);

    // Fetch team players
    const teamAReg = registrations.find((r) => r.$id === match.teamA);
    const teamBReg = registrations.find((r) => r.$id === match.teamB);

    await fetchTeamPlayers(teamAReg, setTeamAPlayers);
    await fetchTeamPlayers(teamBReg, setTeamBPlayers);
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

  const updatePlayerStat = (playerKey, stat, value) => {
    setMatchEditData((prev) => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        [playerKey]: {
          ...(prev.playerStats[playerKey] || {
            kills: 0,
            deaths: 0,
            assists: 0,
            acs: 0,
          }),
          [stat]: parseInt(value) || 0,
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
        playerStats: matchEditData.playerStats,
        scoreA: parseInt(matchEditData.scoreA),
        scoreB: parseInt(matchEditData.scoreB),
      });

      setSaveStatus({ type: "success", message: "Match details saved!" });
      await loadData();

      // Update selected match with new data
      const updatedMatch = matches.find((m) => m.$id === selectedMatch.$id);
      if (updatedMatch) {
        setSelectedMatch(updatedMatch);
      }
    } catch (error) {
      console.error("Failed to save match details:", error);
      setSaveStatus({
        type: "error",
        message: "Failed to save: " + error.message,
      });
    } finally {
      setSavingMatch(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const closeMatchEditor = () => {
    setSelectedMatch(null);
    setTeamAPlayers([]);
    setTeamBPlayers([]);
    setMatchEditData({
      scheduledTime: "",
      notes: "",
      playerStats: {},
      scoreA: 0,
      scoreB: 0,
    });
  };

  const handleResetIndividualMatch = async (matchId) => {
    const currentStep = matchResetSteps[matchId] || 0;

    if (currentStep === 0) {
      // First click - show confirmation
      setMatchResetSteps((prev) => ({ ...prev, [matchId]: 1 }));
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => {
        setMatchResetSteps((prev) => ({ ...prev, [matchId]: 0 }));
      }, 3000);
      return;
    }

    // Second click - perform reset
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

  const handleSaveMatchScore = async (matchId) => {
    const scores = matchScores[matchId];
    // If we haven't touched the inputs, use existing match scores or 0
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
      alert("Cannot finalize a match with a tie score!");
      return;
    }

    if (
      !confirm(
        `Finalize match with score ${scoreA} - ${scoreB}? This will advance the winner to the next round.`,
      )
    ) {
      return;
    }

    setUpdating(true);
    try {
      await finalizeMatch(matchId, scoreA, scoreB);
      await loadData();
      // clear local state for this match
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

  const startBulkEdit = () => {
    const initialValues = {};
    registrations.forEach((reg) => {
      const meta = parseMetadata(reg.metadata);
      initialValues[reg.$id] = {
        kills: meta?.kills || 0,
        deaths: meta?.deaths || 0,
      };
    });
    setBulkEditValues(initialValues);
    setEditingTournamentId(id);
  };

  const handleBulkUpdateScores = async () => {
    setUpdating(true);
    try {
      await Promise.all(
        Object.entries(bulkEditValues).map(([regId, values]) =>
          updateParticipantScore(regId, values.kills, values.deaths),
        ),
      );

      // Identify winner, runner-up and update global stats
      if (tournament.gameType === "Deathmatch") {
        const entries = Object.entries(bulkEditValues);
        if (entries.length >= 1) {
          // Sort descending by kills to find 1st and 2nd
          const sortedEntries = entries.sort((a, b) => b[1].kills - a[1].kills);

          const winnerId = sortedEntries[0][0];
          const runnerUpId = sortedEntries[1] ? sortedEntries[1][0] : null;

          try {
            // This will only award prizes if current tournament status is not 'completed'
            await finalizeDeathmatch(id, winnerId, runnerUpId);
          } catch (err) {
            console.error(
              "Failed to update leaderboard stats for DM winner",
              err,
            );
          }
        }
      }

      // Automatically mark matches and tournament as completed for Deathmatch
      if (tournament.gameType === "Deathmatch" && matches.length > 0) {
        await Promise.all(
          matches.map((m) => updateMatchStatus(m.$id, "completed")),
        );
        setMatches((prev) => prev.map((m) => ({ ...m, status: "completed" })));

        await updateTournament(id, { status: "completed" });
        setTournament((prev) => ({ ...prev, status: "completed" }));
      }

      setRegistrations((prev) =>
        prev.map((reg) => {
          const newValues = bulkEditValues[reg.$id];
          if (!newValues) return reg;

          const meta = parseMetadata(reg.metadata) || {};
          return {
            ...reg,
            metadata: JSON.stringify({
              ...meta,
              kills: newValues.kills,
              deaths: newValues.deaths,
            }),
          };
        }),
      );

      setEditingTournamentId(null);
      setBulkEditValues({});
      alert("Scores saved and tournament marked as completed!");
    } catch (e) {
      alert("Failed to update scores: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setUpdating(true);
    try {
      const dataToUpdate = {
        ...editForm,
        date: editForm.date ? new Date(editForm.date).toISOString() : null,
        checkInStart: editForm.checkInStart
          ? new Date(editForm.checkInStart).toISOString()
          : null,
        additionalPrizes: JSON.stringify(editForm.additionalPrizes),
      };

      // Reset alert status if check-in time is updated
      if (dataToUpdate.checkInStart !== tournament.checkInStart) {
        dataToUpdate.checkInAlertSent = false;
      }

      await updateTournament(id, dataToUpdate);

      // --- DISCORD NOTIFICATIONS ---
      // 1. Party Code Update
      if (
        editForm.valoPartyCode &&
        editForm.valoPartyCode !== tournament.valoPartyCode
      ) {
        if (tournament.discordChannelId) {
          await sendTournamentMessageAction(
            tournament.discordChannelId,
            `📢 **MATCH LOBBY READY!**\nThe Valorant Party Code for **${tournament.name}** has been updated.\n\n🔑 **Code:** \`${editForm.valoPartyCode}\`\n\n*Please join the lobby immediately!*`,
            tournament.discordRoleId,
          );
        }
      }

      setTournament((prev) => ({ ...prev, ...dataToUpdate }));
      alert("Tournament updated successfully!");
    } catch (e) {
      alert("Failed to update tournament: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendCheckInAlert = async () => {
    if (!tournament.discordChannelId) {
      alert("No Discord channel linked to this tournament.");
      return;
    }

    if (
      !confirm(
        "Send Check-in live alert to Discord? This will ping everyone with the tournament role.",
      )
    )
      return;

    try {
      setUpdating(true);
      await sendTournamentMessageAction(
        tournament.discordChannelId,
        `🚨 **CHECK-IN IS NOW LIVE!**\nRegistered players for **${tournament.name}** can now check-in on the website.\n\n🔗 **Check-in Here:** <${window.location.origin}/tournaments/${id}>\n\n*Note: Failure to check-in may result in disqualification!*`,
        tournament.discordRoleId,
      );

      // Update DB so automation doesn't send it again
      await updateTournament(id, { checkInAlertSent: true });
      setTournament((prev) => ({ ...prev, checkInAlertSent: true }));

      alert("Check-in alert sent successfully!");
    } catch (err) {
      alert("Failed to send alert: " + (err.message || "Unknown error"));
    } finally {
      setUpdating(false);
    }
  };

  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (deleteStep === 0) {
      setDeleteStep(1);
      setTimeout(() => setDeleteStep(0), 3000);
      return;
    }

    setDeleteStep(2);
    setDeleteError(null);
    setUpdating(true);

    // 1. Delete Discord Channels if they exist
    if (tournament.discordChannelId || tournament.discordVoiceChannelId) {
      try {
        const result = await deleteTournamentChannelsAction(
          [tournament.discordChannelId, tournament.discordVoiceChannelId],
          tournament.discordRoleId,
        );
        if (result && result.error) {
          const proceed = confirm(
            `Discord Channel Deletion Failed: ${result.error}\n\nDo you want to delete the tournament anyway? (Channels will remain manually)`,
          );
          if (!proceed) {
            setDeleteStep(0);
            setUpdating(false);
            return;
          }
        }
      } catch (discordErr) {
        console.warn("Failed to delete discord channels:", discordErr);
        // Proceed anyway
      }
    }

    try {
      await deleteTournament(id);
      router.replace("/admin/tournaments");
    } catch (error) {
      setDeleteError(error.message);
      setDeleteStep(0);
      setUpdating(false);
    }
  };

  const [discordDeleteStep, setDiscordDeleteStep] = useState(0);
  const [discordDeleteError, setDiscordDeleteError] = useState(null);

  const handleManualDiscordDelete = async () => {
    if (!tournament.discordChannelId && !tournament.discordVoiceChannelId) {
      alert("No Discord channel IDs found for this tournament.");
      return;
    }

    if (discordDeleteStep === 0) {
      setDiscordDeleteStep(1);
      setTimeout(() => setDiscordDeleteStep(0), 3000);
      return;
    }

    setDiscordDeleteStep(2);
    setDiscordDeleteError(null);
    setUpdating(true);

    try {
      const result = await deleteTournamentChannelsAction(
        [tournament.discordChannelId, tournament.discordVoiceChannelId],
        tournament.discordRoleId,
      );
      if (result && result.error) {
        setDiscordDeleteError(result.error);
        setDiscordDeleteStep(0);
      } else {
        // Success: Clear the IDs from the tournament document
        const updateData = {};
        if (tournament.discordChannelId) updateData.discordChannelId = null;
        if (tournament.discordVoiceChannelId)
          updateData.discordVoiceChannelId = null;
        if (tournament.discordRoleId) updateData.discordRoleId = null;

        await updateTournament(id, updateData);
        setTournament((prev) => ({
          ...prev,
          discordChannelId: null,
          discordVoiceChannelId: null,
          discordRoleId: null,
        }));
        alert("Discord Channels Deleted successfully!");
        setDiscordDeleteStep(0);
      }
    } catch (error) {
      setDiscordDeleteError(error.message);
      setDiscordDeleteStep(0);
    } finally {
      setUpdating(false);
    }
  };

  const handleStartTournament = async () => {
    if (tournament.bracketGenerated || matches.length > 0) {
      alert(
        "Bracket already exists. Reset it first if you want to regenerate.",
      );
      return;
    }

    if (startStep === 0) {
      setStartStep(1);
      setTimeout(() => setStartStep(0), 3000);
      return;
    }

    setStartStep(2);
    setStartError(null);
    setUpdating(true);

    try {
      await createBracket(
        id,
        registrations,
        tournament.gameType,
        tournament.date,
      );
      await updateTournament(id, { bracketGenerated: true, status: "ongoing" });

      // Reload data to show matches
      await loadData();
      setStartStep(0);
    } catch (e) {
      console.error("Start failed", e);
      setStartError(e.message);
      setStartStep(0);
    } finally {
      setUpdating(false);
    }
  };

  const handleResetBracket = async () => {
    if (resetStep === 0) {
      setResetStep(1);
      setTimeout(() => setResetStep(0), 3000); // Reset confirmation state after 3 seconds
      return;
    }

    setResetStep(2); // Loading state
    setResetError(null);
    setUpdating(true);

    try {
      // New: Revert any prizes/wins awarded
      await revertTournamentStats(id);

      await deleteMatches(id);
      await updateTournament(id, {
        bracketGenerated: false,
        status: "scheduled",
      });
      await loadData();
      setResetStep(0);
    } catch (e) {
      console.error("Reset failed", e);
      setResetError(e.message);
      setResetStep(0);
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveRequest = async (request) => {
    if (!confirm("Approve this payment and register the user?")) return;
    setUpdating(true);

    // Optimistic Update
    setPaymentRequests((prev) =>
      prev.map((r) =>
        r.$id === request.$id ? { ...r, paymentStatus: "verified" } : r,
      ),
    );

    try {
      // Check if user is already registered
      const existingReg = registrations.find(
        (r) => r.userId === request.userId,
      );

      if (existingReg) {
        if (
          confirm(
            `User is already registered as "${existingReg.teamName}". Update their existing registration to VERIFIED?`,
          )
        ) {
          // Update existing registration
          await updateRegistrationPaymentStatus(
            existingReg.$id,
            "verified",
            request.transactionId,
          );
        } else {
          setUpdating(false);
          return;
        }
      } else {
        // 1. Create New Registration
        await registerForTournament(
          request.tournamentId,
          request.userId,
          request.teamName,
          {
            metadata: request.metadata, // Pass the original string, not the parsed object
            transactionId: request.transactionId,
            paymentStatus: "verified",
          },
        );
      }

      // 2. Update Request Status
      await updatePaymentRequestStatus(request.$id, "verified");

      // 2b. Assign Discord Role (if applicable)
      try {
        const userProfile = await getUserProfile(request.userId);
        if (userProfile?.discordId && tournament.discordRoleId) {
          console.log(
            `[Admin] Assigning tournament role to ${userProfile.discordId}`,
          );
          const discordResult = await assignTournamentRoleAction(
            tournament.discordRoleId,
            userProfile.discordId,
          );

          if (discordResult && discordResult.error) {
            alert(
              `Payment verified, but Discord Role assignment failed: ${discordResult.error}\n\nAsk the user to join the Discord server if they haven't already.`,
            );
          }
        }
      } catch (discordErr) {
        console.warn(
          "Failed to assign Discord role during approval:",
          discordErr,
        );
      }

      // 3. Reload
      await loadData(false);
      alert("User registered/updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to approve: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRevokeRegistration = async (registration) => {
    if (
      !confirm(
        "Are you sure you want to REVOKE this registration? This will delete the entry and reject the payment.",
      )
    )
      return;

    setUpdating(true);
    try {
      // 1. Delete Registration
      await deleteRegistration(registration.$id, id);

      // 2. Find associated payment request and update it
      // We look for verified requests for this user
      const relatedRequest = paymentRequests.find(
        (pr) =>
          pr.userId === registration.userId && pr.paymentStatus === "verified",
      );

      if (relatedRequest) {
        await updatePaymentRequestStatus(
          relatedRequest.$id,
          "rejected",
          "Registration Revoked by Admin",
        );
      }

      await loadData(false);
      alert("Registration revoked successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to revoke: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectRequest = (request) => {
    setSelectedRequestForRejection(request);
    setRejectionReason("Invalid Transaction ID");
    setCustomRejectionReason("");
    setRejectionModalOpen(true);
  };

  const confirmReject = async () => {
    if (!selectedRequestForRejection) return;

    const finalReason =
      rejectionReason === "Other" ? customRejectionReason : rejectionReason;

    if (!finalReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setUpdating(true);

    // Optimistic Update
    setPaymentRequests((prev) =>
      prev.map((r) =>
        r.$id === selectedRequestForRejection.$id
          ? { ...r, paymentStatus: "rejected", rejectionReason: finalReason }
          : r,
      ),
    );

    try {
      await updatePaymentRequestStatus(
        selectedRequestForRejection.$id,
        "rejected",
        finalReason,
      );
      await loadData(false);
      setRejectionModalOpen(false);
      setSelectedRequestForRejection(null);
    } catch (e) {
      console.error(e);
      alert("Failed to reject: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const participantMap =
    registrations?.reduce((acc, r) => {
      acc[r.$id] = r.teamName
        ? { name: r.teamName }
        : r.metadata
          ? { name: parseMetadata(r.metadata)?.playerName || "Unknown" }
          : { name: "Player" };
      return acc;
    }, {}) || {};

  if (loading) return <Loader />;
  if (!tournament)
    return (
      <div className="p-8 text-center text-white">Tournament not found</div>
    );

  const is5v5 = tournament.gameType === "5v5";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      {/* Header / Breadcrumbs */}
      <div className="flex flex-col gap-6">
        <button
          onClick={() => router.push("/admin/tournaments")}
          className="group flex w-fit items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase transition-all hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to All Tournaments
        </button>

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-5">
            <div className="rounded-2xl bg-rose-600 p-4 shadow-lg shadow-rose-900/20">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                  {tournament.name}
                </h1>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    tournament.status === "scheduled" || !tournament.status
                      ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-500"
                      : tournament.status === "ongoing"
                        ? "animate-pulse border border-amber-500/20 bg-amber-500/10 text-amber-500"
                        : "border border-white/5 bg-slate-800 text-slate-400"
                  }`}
                >
                  {tournament.status === "scheduled" || !tournament.status
                    ? "SCHEDULED"
                    : tournament.status === "ongoing"
                      ? "ONGOING (LIVE)"
                      : "COMPLETED"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1.5 text-[10px] font-black tracking-wider uppercase">
                  <Swords className="h-3.5 w-3.5 text-rose-500" />
                  {tournament.gameType}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-800" />
                <span
                  className="flex items-center gap-1.5"
                  suppressHydrationWarning
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(tournament.date).toLocaleDateString()}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-800" />
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {registrations.length} / {tournament.maxTeams} Entries
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/tournaments/${id}`}
              target="_blank"
              className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-900 px-4 py-2.5 text-xs font-black tracking-widest text-slate-400 uppercase transition-all hover:bg-slate-800 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              View Public Page
            </Link>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="space-y-6">
        <div className="flex w-fit items-center gap-1 rounded-2xl border border-white/5 bg-slate-900/50 p-1 backdrop-blur-sm">
          {[
            { id: "participants", label: "Participants", icon: Users },
            { id: "requests", label: "Requests", icon: FileText },
            { id: "matches", label: "Match Control", icon: Swords },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-black tracking-widest uppercase transition-all ${
                activeTab === tab.id
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20"
                  : "text-slate-500 hover:bg-white/5 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="animate-in fade-in duration-300">
          {activeTab === "requests" && (
            <div className="space-y-4">
              {paymentRequests.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/5 bg-slate-950/30 p-12 text-center">
                  <div className="mx-auto mb-4 w-fit rounded-full bg-slate-900 p-4">
                    <FileText className="h-8 w-8 text-slate-700" />
                  </div>
                  <h3 className="text-xl font-bold tracking-widest text-slate-500 uppercase">
                    No Payment Requests
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Pending payment requests will appear here.
                  </p>
                </div>
              ) : (
                paymentRequests.map((req) => {
                  const meta = parseMetadata(req.metadata);
                  return (
                    <div
                      key={req.$id}
                      className="group overflow-hidden rounded-3xl border border-white/5 bg-slate-950/30 backdrop-blur-sm transition-all hover:border-indigo-500/20"
                    >
                      <div className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center">
                        <div className="flex items-center gap-4">
                          <div
                            className={`rounded-2xl border border-white/5 p-4 ${req.paymentStatus === "pending" ? "bg-amber-500/10 text-amber-500" : req.paymentStatus === "verified" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
                          >
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <h3 className="text-xl font-bold tracking-tight text-white">
                                {is5v5
                                  ? req.teamName
                                  : meta?.playerName || req.teamName}
                              </h3>
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                                  req.paymentStatus === "pending"
                                    ? "border border-amber-500/20 bg-amber-500/10 text-amber-500"
                                    : req.paymentStatus === "verified"
                                      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                      : "border border-rose-500/20 bg-rose-500/10 text-rose-500"
                                }`}
                              >
                                {req.paymentStatus}
                              </span>
                            </div>
                            <p className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                              <Clock className="h-3 w-3" />
                              Requested{" "}
                              {new Date(req.requestedAt).toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Transaction ID:{" "}
                              <span className="font-mono text-white">
                                {req.transactionId}
                              </span>
                            </p>
                          </div>
                        </div>

                        {req.paymentStatus === "pending" && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleRejectRequest(req)}
                              disabled={updating}
                              className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[10px] font-black tracking-widest text-rose-500 uppercase transition-all hover:bg-rose-500 hover:text-white disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveRequest(req)}
                              disabled={updating}
                              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 disabled:opacity-50"
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </button>
                          </div>
                        )}
                        {req.paymentStatus === "rejected" && (
                          <div className="text-right">
                            <p className="text-[10px] font-black text-rose-500 uppercase">
                              Rejection Reason
                            </p>
                            <p className="text-xs text-slate-400">
                              {req.rejectionReason || "No reason provided"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "participants" && (
            <div className="grid gap-4">
              {registrations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/5 bg-slate-950/30 p-12 text-center">
                  <div className="mx-auto mb-4 w-fit rounded-full bg-slate-900 p-4">
                    <Users className="h-8 w-8 text-slate-700" />
                  </div>
                  <h3 className="text-xl font-bold tracking-widest text-slate-500 uppercase">
                    No Registrations Yet
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    When players sign up, they will appear here.
                  </p>
                </div>
              ) : (
                registrations.map((reg) => {
                  const meta = parseMetadata(reg.metadata);
                  return (
                    <div
                      key={reg.$id}
                      className="group overflow-hidden rounded-3xl border border-white/5 bg-slate-950/30 backdrop-blur-sm transition-all hover:border-rose-500/20"
                    >
                      <div className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center">
                        <div className="flex items-center gap-4">
                          <div className="rounded-2xl border border-white/5 bg-slate-900 p-4 text-rose-500">
                            {is5v5 ? (
                              <Users className="h-6 w-6" />
                            ) : (
                              <User className="h-6 w-6" />
                            )}
                          </div>
                          <div>
                            <h3 className="mb-1 text-xl font-bold tracking-tight text-white">
                              {is5v5
                                ? reg.teamName
                                : meta?.playerName || reg.teamName}
                            </h3>
                            <p
                              className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase"
                              suppressHydrationWarning
                            >
                              <Calendar className="h-3 w-3" />
                              Registered{" "}
                              {new Date(reg.registeredAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {!is5v5 && (
                            <div className="mr-6 flex items-center gap-6 border-r border-white/5 pr-6">
                              <div className="text-center">
                                <p className="mb-1 text-[10px] font-black text-slate-500 uppercase">
                                  Kills
                                </p>
                                <p className="text-xl font-black text-white italic">
                                  {meta?.kills || 0}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="mb-1 text-[10px] font-black text-slate-500 uppercase">
                                  Deaths
                                </p>
                                <p className="text-xl font-black text-slate-600 italic">
                                  {meta?.deaths || 0}
                                </p>
                              </div>
                            </div>
                          )}
                          {/* Payment Status & Transaction ID */}
                          <div className="flex flex-col items-end gap-2">
                            {reg.transactionId && (
                              <div className="text-right">
                                <p className="text-[9px] font-medium tracking-wide text-slate-600 uppercase">
                                  Transaction ID
                                </p>
                                <p className="font-mono text-xs text-white">
                                  {reg.transactionId}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              {reg.paymentStatus === "pending" ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleTogglePayment(reg.$id, "verified")
                                    }
                                    disabled={updating}
                                    className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black tracking-wider text-emerald-500 uppercase transition-all hover:bg-emerald-500/20"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    Verify
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleTogglePayment(reg.$id, "rejected")
                                    }
                                    disabled={updating}
                                    className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[10px] font-black tracking-wider text-rose-500 uppercase transition-all hover:bg-rose-500/20"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div
                                    className={`rounded-xl border px-4 py-2 text-[10px] font-black tracking-widest uppercase ${
                                      reg.paymentStatus === "verified"
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                        : reg.paymentStatus === "rejected"
                                          ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                                          : reg.paymentStatus === "free"
                                            ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-500"
                                            : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                                    }`}
                                  >
                                    {reg.paymentStatus === "verified"
                                      ? "✓ Paid"
                                      : reg.paymentStatus === "rejected"
                                        ? "✗ Rejected"
                                        : reg.paymentStatus === "free"
                                          ? "Free Entry"
                                          : "Pending"}
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleRevokeRegistration(reg)
                                    }
                                    disabled={updating}
                                    title="Revoke Registration"
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 transition-all hover:bg-rose-500 hover:text-white disabled:opacity-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {is5v5 && (
                        <div className="border-t border-white/5 bg-slate-950/30 p-6 pb-8">
                          <div className="mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            <h4 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                              Verified Roster
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                            {meta?.members?.map((m, i) => (
                              <div
                                key={i}
                                className="flex flex-col rounded-xl border border-white/5 bg-slate-900/50 p-3 transition-all hover:border-rose-500/30"
                              >
                                <span className="mb-1 text-[10px] font-bold text-slate-600 uppercase">
                                  Member {i + 1}
                                </span>
                                <span className="truncate text-xs font-bold text-white">
                                  {m.name}
                                </span>
                                <span className="font-mono text-[10px] text-rose-500 italic">
                                  #{m.tag}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "matches" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/5 bg-slate-950/30 p-8 backdrop-blur-sm">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-rose-500/10 p-3 text-rose-500">
                      <Swords className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-white uppercase">
                        Match Control Overview
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Manage statuses and player performances
                      </p>
                    </div>
                  </div>

                  {!is5v5 && matches.length > 0 && (
                    <div className="flex items-center gap-2">
                      {editingTournamentId === id ? (
                        <>
                          <button
                            onClick={handleBulkUpdateScores}
                            disabled={updating}
                            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700"
                          >
                            {updating ? (
                              <LoaderIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Save Scores
                          </button>
                          <button
                            onClick={() => setEditingTournamentId(null)}
                            className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase transition-all hover:bg-slate-700"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={startBulkEdit}
                          disabled={updating}
                          className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-700"
                        >
                          <Edit2 className="h-4 w-4" />
                          Bulk Edit Scores
                        </button>
                      )}
                    </div>
                  )}

                  {matches.length > 0 && (
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={handleResetBracket}
                        disabled={updating || resetStep === 2}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black tracking-widest uppercase shadow-lg transition-all ${
                          resetStep === 1
                            ? "animate-pulse bg-amber-500 text-slate-950"
                            : resetStep === 2
                              ? "bg-slate-900 text-slate-600"
                              : "border border-white/5 bg-slate-950 text-slate-500 hover:bg-rose-500/5 hover:text-rose-500"
                        }`}
                        title="Reset Bracket"
                      >
                        {resetStep === 0 && (
                          <>
                            <RotateCcw className="h-4 w-4" /> Reset Matches
                          </>
                        )}
                        {resetStep === 1 && (
                          <>
                            <Info className="h-4 w-4" /> Click to Confirm Reset
                          </>
                        )}
                        {resetStep === 2 && (
                          <LoaderIcon className="h-4 w-4 animate-spin" />
                        )}
                      </button>
                      {resetError && (
                        <p className="text-[8px] font-bold text-rose-500 uppercase">
                          {resetError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-6">
                  {matches.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/5 bg-slate-900/20 py-20 text-center">
                      <div className="mx-auto mb-6 w-fit rounded-full border border-white/5 bg-slate-900 p-6">
                        <Trophy className="h-10 w-10 text-slate-700" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold tracking-tight text-white uppercase">
                        No active matches found
                      </h3>
                      <p className="mx-auto mb-8 max-w-sm text-sm text-slate-500">
                        To begin management, you first need to generate the
                        bracket or standings for this tournament.
                      </p>

                      <button
                        onClick={handleStartTournament}
                        disabled={
                          updating ||
                          registrations.length < 2 ||
                          startStep === 2
                        }
                        className={`mx-auto flex items-center gap-3 rounded-2xl px-8 py-4 text-xs font-black tracking-[0.2em] uppercase shadow-xl transition-all ${
                          startStep === 1
                            ? "animate-pulse bg-amber-500 text-slate-950"
                            : startStep === 2
                              ? "bg-slate-900 text-slate-600"
                              : "bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-700"
                        } disabled:opacity-30`}
                      >
                        {startStep === 2 ? (
                          <LoaderIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <Swords className="h-4 w-4" />
                        )}
                        {startStep === 0 &&
                          (tournament.gameType === "Deathmatch"
                            ? "Start Standings"
                            : "Generate Bracket")}
                        {startStep === 1 && "Click to Confirm Start"}
                      </button>

                      {startError && (
                        <p className="mt-4 text-[10px] font-bold tracking-widest text-rose-500 uppercase">
                          {startError}
                        </p>
                      )}

                      {registrations.length < 2 && (
                        <p className="mt-4 text-[10px] font-bold tracking-widest text-rose-500 uppercase">
                          Need at least 2 participants to start
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="mb-2 border-b border-white/5 pb-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                        Active Matches
                      </h4>
                      <div className="grid gap-3">
                        {matches.map((match) => (
                          <div
                            key={match.$id}
                            className="group flex flex-col rounded-2xl border border-white/5 bg-slate-900/50 p-4 transition-all hover:border-rose-500/10"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-slate-950 text-xs font-black text-rose-500 italic">
                                  {match.teamA === "LOBBY"
                                    ? "L"
                                    : `R${match.round}`}
                                </div>
                                <div>
                                  <p className="text-sm font-black tracking-tight text-white uppercase">
                                    {match.teamA === "LOBBY" ? (
                                      "Main Lobby Match"
                                    ) : (
                                      <span className="flex items-center gap-2">
                                        <span className="text-rose-500">
                                          {!match.teamA && match.round === 1
                                            ? "BYE"
                                            : participantMap[match.teamA]
                                                ?.name || "TBD"}
                                        </span>
                                        <span className="text-slate-600 opacity-40">
                                          VS
                                        </span>
                                        <span className="text-rose-500">
                                          {!match.teamB && match.round === 1
                                            ? "BYE"
                                            : participantMap[match.teamB]
                                                ?.name || "TBD"}
                                        </span>
                                      </span>
                                    )}
                                  </p>
                                  <div className="flex items-center gap-3">
                                    <p className="text-[10px] font-black text-slate-600 uppercase">
                                      ID: {match.$id.substring(0, 8)}...
                                    </p>
                                    {(() => {
                                      const time = match.scheduledTime;
                                      let displayTime = time;

                                      if (!time && tournament.date) {
                                        // Calculate fallback time for 5v5
                                        if (tournament.gameType === "5v5") {
                                          const startDate = new Date(
                                            tournament.date,
                                          );
                                          // Simple heuristic: Round 1 starts at T+0, R2 at T+(MatchesInR1) etc.
                                          // But we can just use a simpler one: (Round-1)*4 + MatchIndex
                                          // To keep it simple and clean:
                                          const offset =
                                            (match.round - 1) * 4 +
                                            match.matchIndex;
                                          startDate.setHours(
                                            startDate.getHours() + offset,
                                          );
                                          displayTime = startDate.toISOString();
                                        } else {
                                          displayTime = tournament.date;
                                        }
                                      }

                                      return displayTime ? (
                                        <p
                                          className="flex items-center gap-1 text-[10px] font-black tracking-widest text-rose-500/60 uppercase"
                                          suppressHydrationWarning
                                        >
                                          <Clock className="h-3 w-3" />
                                          {new Date(
                                            displayTime,
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="mr-4 flex flex-col items-end gap-1">
                                  <p className="text-[8px] font-black tracking-tighter text-slate-700 uppercase">
                                    Current Status
                                  </p>
                                  <div
                                    className={`text-[10px] font-bold tracking-widest uppercase ${
                                      match.status === "completed"
                                        ? "text-emerald-500"
                                        : match.status === "ongoing"
                                          ? "animate-pulse text-amber-500"
                                          : "text-slate-500"
                                    }`}
                                  >
                                    {match.status}
                                  </div>
                                </div>
                                <select
                                  value={match.status}
                                  onChange={(e) =>
                                    handleUpdateMatchStatus(
                                      match.$id,
                                      e.target.value,
                                    )
                                  }
                                  disabled={updating}
                                  className="cursor-pointer rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-[10px] font-black text-white uppercase shadow-xl transition-colors outline-none hover:bg-slate-900 focus:border-rose-500"
                                >
                                  <option value="scheduled">Scheduled</option>
                                  <option value="ongoing">
                                    Ongoing (Live)
                                  </option>
                                  <option value="completed">Completed</option>
                                </select>

                                {/* Edit Details Button */}
                                {match.teamA !== "LOBBY" && (
                                  <button
                                    onClick={() => selectMatchForEdit(match)}
                                    className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-[10px] font-black text-emerald-400 uppercase transition-all hover:bg-emerald-500/20"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                    Edit Details
                                  </button>
                                )}

                                {is5v5 &&
                                  match.teamA !== "LOBBY" &&
                                  match.status !== "completed" &&
                                  !match.vetoStarted && (
                                    <button
                                      onClick={() => handleStartVeto(match.$id)}
                                      className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-[10px] font-black text-indigo-400 uppercase transition-all hover:bg-indigo-500/20"
                                    >
                                      <MapIcon className="h-3.5 w-3.5" />
                                      Start Veto
                                    </button>
                                  )}

                                {/* Reset Match Button */}
                                {match.teamA !== "LOBBY" && (
                                  <button
                                    onClick={() =>
                                      handleResetIndividualMatch(match.$id)
                                    }
                                    disabled={
                                      updating ||
                                      matchResetSteps[match.$id] === 2
                                    }
                                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase transition-all ${
                                      matchResetSteps[match.$id] === 1
                                        ? "animate-pulse border border-amber-500/50 bg-amber-500/20 text-amber-400"
                                        : matchResetSteps[match.$id] === 2
                                          ? "border border-white/5 bg-slate-900 text-slate-600"
                                          : "border border-white/10 bg-slate-900/50 text-slate-500 hover:border-amber-500/30 hover:text-amber-400"
                                    }`}
                                    title="Reset this match"
                                  >
                                    {matchResetSteps[match.$id] === 2 ? (
                                      <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-3.5 w-3.5" />
                                    )}
                                    {matchResetSteps[match.$id] === 1
                                      ? "Confirm?"
                                      : "Reset"}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Score Entry Row for 5v5 Bracket Matches */}
                            {is5v5 &&
                              match.teamA !== "LOBBY" &&
                              match.status !== "completed" && (
                                <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/5 pt-4">
                                  <div className="flex flex-1 items-center gap-4">
                                    <div className="flex flex-1 flex-col gap-1">
                                      <label className="ml-1 text-[8px] font-black text-slate-500 uppercase">
                                        {!match.teamA && match.round === 1
                                          ? "BYE"
                                          : participantMap[match.teamA]?.name ||
                                            "TBD"}{" "}
                                        Score
                                      </label>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-xs font-bold text-white transition-all outline-none focus:border-rose-500"
                                        value={
                                          matchScores[match.$id]?.scoreA ??
                                          match.scoreA ??
                                          0
                                        }
                                        onChange={(e) =>
                                          setMatchScores({
                                            ...matchScores,
                                            [match.$id]: {
                                              ...matchScores[match.$id],
                                              scoreA: e.target.value,
                                              scoreB:
                                                matchScores[match.$id]
                                                  ?.scoreB ??
                                                match.scoreB ??
                                                0,
                                            },
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="mt-4 text-xs font-black text-slate-700">
                                      VS
                                    </div>
                                    <div className="flex flex-1 flex-col gap-1">
                                      <label className="ml-1 text-[8px] font-black text-slate-500 uppercase">
                                        {!match.teamB && match.round === 1
                                          ? "BYE"
                                          : participantMap[match.teamB]?.name ||
                                            "TBD"}{" "}
                                        Score
                                      </label>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-xs font-bold text-white transition-all outline-none focus:border-rose-500"
                                        value={
                                          matchScores[match.$id]?.scoreB ??
                                          match.scoreB ??
                                          0
                                        }
                                        onChange={(e) =>
                                          setMatchScores({
                                            ...matchScores,
                                            [match.$id]: {
                                              ...matchScores[match.$id],
                                              scoreB: e.target.value,
                                              scoreA:
                                                matchScores[match.$id]
                                                  ?.scoreA ??
                                                match.scoreA ??
                                                0,
                                            },
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleSaveMatchScore(match.$id)
                                    }
                                    disabled={
                                      updating || !match.teamA || !match.teamB
                                    }
                                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-30"
                                  >
                                    Save Result
                                  </button>
                                </div>
                              )}

                            {match.status === "completed" &&
                              match.teamA !== "LOBBY" && (
                                <div className="mt-4 flex items-center justify-center gap-12 border-t border-white/5 pt-4 text-slate-400">
                                  <div className="flex flex-col items-center">
                                    <span className="text-[8px] font-black uppercase opacity-40">
                                      Final Score
                                    </span>
                                    <span className="text-xl font-black italic">
                                      <span
                                        className={
                                          match.winner === match.teamA
                                            ? "text-emerald-500"
                                            : ""
                                        }
                                      >
                                        {match.scoreA}
                                      </span>
                                      <span className="mx-3 opacity-20">-</span>
                                      <span
                                        className={
                                          match.winner === match.teamB
                                            ? "text-emerald-500"
                                            : ""
                                        }
                                      >
                                        {match.scoreB}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!is5v5 && editingTournamentId === id && (
                    <div className="mt-8 grid grid-cols-1 gap-4 border-t border-white/5 pt-8 sm:grid-cols-2 lg:grid-cols-3">
                      {registrations.map((reg) => (
                        <div
                          key={reg.$id}
                          className="rounded-2xl border border-rose-500/20 bg-slate-950 p-4 shadow-lg shadow-rose-900/10"
                        >
                          <p className="mb-4 truncate text-xs font-bold text-white">
                            {parseMetadata(reg.metadata)?.playerName ||
                              reg.teamName}
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-slate-500 uppercase">
                                Kills
                              </label>
                              <input
                                type="number"
                                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 font-bold text-white transition-all outline-none focus:border-rose-500"
                                value={bulkEditValues[reg.$id]?.kills || 0}
                                onChange={(e) =>
                                  setBulkEditValues({
                                    ...bulkEditValues,
                                    [reg.$id]: {
                                      ...bulkEditValues[reg.$id],
                                      kills: parseInt(e.target.value) || 0,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-slate-500 uppercase">
                                Deaths
                              </label>
                              <input
                                type="number"
                                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 font-bold text-white transition-all outline-none focus:border-rose-500"
                                value={bulkEditValues[reg.$id]?.deaths || 0}
                                onChange={(e) =>
                                  setBulkEditValues({
                                    ...bulkEditValues,
                                    [reg.$id]: {
                                      ...bulkEditValues[reg.$id],
                                      deaths: parseInt(e.target.value) || 0,
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Match Editor Modal */}
          {selectedMatch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
              <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/5 bg-slate-800/50 px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Swords className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-white uppercase">
                        Edit Match Details
                      </h2>
                      <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                        Round {selectedMatch.round} •{" "}
                        {participantMap[selectedMatch.teamA]?.name || "TBD"} vs{" "}
                        {participantMap[selectedMatch.teamB]?.name || "TBD"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Save Status */}
                    {saveStatus && (
                      <div
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                          saveStatus.type === "success"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {saveStatus.type === "success" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        {saveStatus.message}
                      </div>
                    )}

                    <button
                      onClick={handleSaveMatchDetails}
                      disabled={savingMatch}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {savingMatch ? (
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save All
                    </button>
                    <button
                      onClick={closeMatchEditor}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition-all hover:bg-white/5 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="flex-1 space-y-6 overflow-y-auto p-6">
                  {/* Schedule Section */}
                  <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                        Match Schedule
                      </span>
                    </div>
                    <input
                      type="datetime-local"
                      value={matchEditData.scheduledTime}
                      onChange={(e) =>
                        setMatchEditData((prev) => ({
                          ...prev,
                          scheduledTime: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm font-medium text-white transition-colors outline-none focus:border-indigo-500/50"
                    />
                    <p className="mt-2 text-[10px] text-slate-500">
                      This updates the countdown timer and match schedule
                      display.
                    </p>
                  </div>

                  {/* Scores Section */}
                  <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-400" />
                      <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                        Team Scores
                      </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Team A Score */}
                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                        <label className="mb-2 block text-[10px] font-black tracking-widest text-rose-500 uppercase">
                          {participantMap[selectedMatch.teamA]?.name ||
                            "Team A"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="13"
                          value={matchEditData.scoreA}
                          onChange={(e) =>
                            setMatchEditData((prev) => ({
                              ...prev,
                              scoreA: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full rounded-lg border border-rose-500/30 bg-slate-900/50 px-4 py-3 text-center text-2xl font-black text-white transition-colors outline-none focus:border-rose-500"
                        />
                      </div>

                      {/* Team B Score */}
                      <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4">
                        <label className="mb-2 block text-[10px] font-black tracking-widest text-cyan-400 uppercase">
                          {participantMap[selectedMatch.teamB]?.name ||
                            "Team B"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="13"
                          value={matchEditData.scoreB}
                          onChange={(e) =>
                            setMatchEditData((prev) => ({
                              ...prev,
                              scoreB: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full rounded-lg border border-cyan-400/30 bg-slate-900/50 px-4 py-3 text-center text-2xl font-black text-white transition-colors outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Player Stats Section */}
                  <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-400" />
                        <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase">
                          Player Stats
                        </span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/50 px-3 py-1.5 text-[9px] font-bold text-slate-500 uppercase">
                        <Target className="h-3 w-3" />K / D / A / ACS
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Team A Players */}
                      {teamAPlayers.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 rounded-lg bg-rose-500/5 px-3 py-2">
                            <div className="h-2 w-2 rounded-full bg-rose-500" />
                            <span className="text-xs font-black tracking-widest text-rose-500 uppercase">
                              {participantMap[selectedMatch.teamA]?.name ||
                                "Team A"}
                            </span>
                          </div>
                          {teamAPlayers.map((player, idx) => {
                            const playerKey = `teamA_${idx}`;
                            const stats = matchEditData.playerStats[
                              playerKey
                            ] || { kills: 0, deaths: 0, assists: 0, acs: 0 };
                            const isExpanded = expandedPlayers[playerKey];

                            return (
                              <div
                                key={playerKey}
                                className="rounded-xl border border-rose-500/20 bg-slate-900/40"
                              >
                                <button
                                  onClick={() => togglePlayerExpand(playerKey)}
                                  className="flex w-full items-center justify-between p-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 bg-slate-950/50">
                                      <Target className="h-4 w-4 text-rose-500" />
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm font-bold text-white">
                                        {player.ingameName}
                                      </p>
                                      {player.tag && (
                                        <p className="text-[10px] font-bold text-rose-500">
                                          #{player.tag}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                      <span className="text-emerald-400">
                                        {stats.kills}
                                      </span>
                                      /
                                      <span className="text-red-400">
                                        {stats.deaths}
                                      </span>
                                      /
                                      <span className="text-amber-400">
                                        {stats.assists}
                                      </span>
                                      <span className="text-slate-600">|</span>
                                      <span className="text-purple-400">
                                        {stats.acs}
                                      </span>
                                    </div>
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-slate-500" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-slate-500" />
                                    )}
                                  </div>
                                </button>
                                {isExpanded && (
                                  <div className="border-t border-white/5 p-4">
                                    <div className="grid grid-cols-4 gap-3">
                                      <div className="space-y-1">
                                        <label className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase">
                                          <Target className="h-3 w-3" />
                                          Kills
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={stats.kills}
                                          onChange={(e) =>
                                            updatePlayerStat(
                                              playerKey,
                                              "kills",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-center text-lg font-bold text-white outline-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="flex items-center gap-1 text-[9px] font-bold text-red-400 uppercase">
                                          <Skull className="h-3 w-3" />
                                          Deaths
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={stats.deaths}
                                          onChange={(e) =>
                                            updatePlayerStat(
                                              playerKey,
                                              "deaths",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-center text-lg font-bold text-white outline-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="flex items-center gap-1 text-[9px] font-bold text-amber-400 uppercase">
                                          <Swords className="h-3 w-3" />
                                          Assists
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={stats.assists}
                                          onChange={(e) =>
                                            updatePlayerStat(
                                              playerKey,
                                              "assists",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-center text-lg font-bold text-white outline-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="flex items-center gap-1 text-[9px] font-bold text-purple-400 uppercase">
                                          <Medal className="h-3 w-3" />
                                          ACS
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={stats.acs}
                                          onChange={(e) =>
                                            updatePlayerStat(
                                              playerKey,
                                              "acs",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full rounded-lg border border-purple-500/30 bg-purple-500/5 px-3 py-2 text-center text-lg font-bold text-white outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Team B Players */}
                      {teamBPlayers.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 rounded-lg bg-cyan-500/5 px-3 py-2">
                            <div className="h-2 w-2 rounded-full bg-cyan-400" />
                            <span className="text-xs font-black tracking-widest text-cyan-400 uppercase">
                              {participantMap[selectedMatch.teamB]?.name ||
                                "Team B"}
                            </span>
                          </div>
                          {teamBPlayers.map((player, idx) => {
                            const playerKey = `teamB_${idx}`;
                            const stats = matchEditData.playerStats[
                              playerKey
                            ] || { kills: 0, deaths: 0, assists: 0, acs: 0 };
                            const isExpanded = expandedPlayers[playerKey];

                            return (
                              <div
                                key={playerKey}
                                className="rounded-xl border border-cyan-400/20 bg-slate-900/40"
                              >
                                <button
                                  onClick={() => togglePlayerExpand(playerKey)}
                                  className="flex w-full items-center justify-between p-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-slate-950/50">
                                      <Target className="h-4 w-4 text-cyan-400" />
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm font-bold text-white">
                                        {player.ingameName}
                                      </p>
                                      {player.tag && (
                                        <p className="text-[10px] font-bold text-cyan-400">
                                          #{player.tag}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                      <span className="text-emerald-400">
                                        {stats.kills}
                                      </span>
                                      /
                                      <span className="text-red-400">
                                        {stats.deaths}
                                      </span>
                                      /
                                      <span className="text-amber-400">
                                        {stats.assists}
                                      </span>
                                      <span className="text-slate-600">|</span>
                                      <span className="text-purple-400">
                                        {stats.acs}
                                      </span>
                                    </div>
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-slate-500" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-slate-500" />
                                    )}
                                  </div>
                                </button>
                                {isExpanded && (
                                  <div className="border-t border-white/5 p-4">
                                    <div className="grid grid-cols-4 gap-3">
                                      <div className="space-y-1">
                                        <label className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase">
                                          <Target className="h-3 w-3" />
                                          Kills
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={stats.kills}
                                          onChange={(e) =>
                                            updatePlayerStat(
                                              playerKey,
                                              "kills",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-center text-lg font-bold text-white outline-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="flex items-center gap-1 text-[9px] font-bold text-red-400 uppercase">
                                          <Skull className="h-3 w-3" />
                                          Deaths
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={stats.deaths}
                                          onChange={(e) =>
                                            updatePlayerStat(
                                              playerKey,
                                              "deaths",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-center text-lg font-bold text-white outline-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="flex items-center gap-1 text-[9px] font-bold text-amber-400 uppercase">
                                          <Swords className="h-3 w-3" />
                                          Assists
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={stats.assists}
                                          onChange={(e) =>
                                            updatePlayerStat(
                                              playerKey,
                                              "assists",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-center text-lg font-bold text-white outline-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="flex items-center gap-1 text-[9px] font-bold text-purple-400 uppercase">
                                          <Medal className="h-3 w-3" />
                                          ACS
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={stats.acs}
                                          onChange={(e) =>
                                            updatePlayerStat(
                                              playerKey,
                                              "acs",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full rounded-lg border border-purple-500/30 bg-purple-500/5 px-3 py-2 text-center text-lg font-bold text-white outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {teamAPlayers.length === 0 &&
                        teamBPlayers.length === 0 && (
                          <div className="rounded-xl border border-white/5 bg-slate-900/30 p-8 text-center">
                            <Users className="mx-auto mb-3 h-8 w-8 text-slate-600" />
                            <p className="text-sm text-slate-500">
                              No players available
                            </p>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-400" />
                      <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                        Admin Notes
                      </span>
                    </div>
                    <textarea
                      value={matchEditData.notes}
                      onChange={(e) =>
                        setMatchEditData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Add private notes about this match..."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-600 transition-colors outline-none focus:border-amber-500/50"
                    />
                    <p className="mt-2 text-[10px] text-slate-500">
                      Notes are only visible to tournament administrators.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/5 bg-slate-950/30 p-8 backdrop-blur-sm">
                <div className="mb-8 flex items-center gap-3">
                  <div className="rounded-xl bg-rose-500/10 p-3 text-rose-500">
                    <Edit2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-white uppercase">
                      Edit Tournament Details
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Modify the core information of your event
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-10">
                  <div className="space-y-12">
                    {/* Top Section: Identity & Core Prizes */}
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                      {/* Left: Identity */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                            Tournament Identity
                          </h4>
                        </div>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                              Event Name
                            </label>
                            <input
                              type="text"
                              required
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-4 font-bold text-white shadow-inner transition-all outline-none placeholder:text-slate-700 focus:border-rose-500"
                              placeholder="Tournament Title"
                            />
                          </div>
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                              <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                Physical Location
                              </label>
                              <input
                                type="text"
                                value={editForm.location}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    location: e.target.value,
                                  })
                                }
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-4 font-bold text-white shadow-inner transition-all outline-none focus:border-rose-500"
                                placeholder="Online"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                Game Mode
                              </label>
                              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/5 bg-slate-900/50 p-1.5 shadow-inner">
                                {["5v5", "Deathmatch"].map((mode) => (
                                  <button
                                    key={mode}
                                    type="button"
                                    onClick={() =>
                                      setEditForm({
                                        ...editForm,
                                        gameType: mode,
                                      })
                                    }
                                    className={`rounded-xl py-3 text-[10px] font-black tracking-widest uppercase transition-all ${
                                      editForm.gameType === mode
                                        ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20"
                                        : "text-slate-500 hover:bg-white/5 hover:text-white"
                                    }`}
                                  >
                                    {mode}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Prize Core */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                            Main Prize Pool
                          </h4>
                        </div>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                              Total Prize Pool
                            </label>
                            <input
                              type="text"
                              value={editForm.prizePool}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  prizePool: e.target.value,
                                })
                              }
                              className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-4 font-bold text-white shadow-inner transition-all outline-none placeholder:text-slate-700 focus:border-rose-500"
                              placeholder="e.g. ₹10,000"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="ml-1 text-[10px] font-black tracking-widest text-emerald-500/50 uppercase">
                                Winner (1st)
                              </label>
                              <input
                                type="text"
                                value={editForm.firstPrize}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    firstPrize: e.target.value,
                                  })
                                }
                                className="w-full rounded-2xl border border-white/5 bg-slate-950 px-5 py-3.5 font-bold text-white transition-all outline-none placeholder:text-slate-700 focus:border-emerald-500"
                                placeholder="Winner Price"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="ml-1 text-[10px] font-black tracking-widest text-amber-500/50 uppercase">
                                Runner Up (2nd)
                              </label>
                              <input
                                type="text"
                                value={editForm.secondPrize}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    secondPrize: e.target.value,
                                  })
                                }
                                className="w-full rounded-2xl border border-white/5 bg-slate-950 px-5 py-3.5 font-bold text-white transition-all outline-none placeholder:text-slate-700 focus:border-amber-500"
                                placeholder="Second Price"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle Section: Technical Details & Additional Rewards */}
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                      {/* Left: Schedule & Capacity */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                            Operational Details
                          </h4>
                        </div>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                              <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                Match Date & Time
                              </label>
                              <input
                                type="datetime-local"
                                value={editForm.date}
                                onChange={(e) => {
                                  const nextDate = e.target.value;
                                  let nextCheckInStart = editForm.checkInStart;

                                  if (editForm.checkInEnabled && nextDate) {
                                    const matchDate = new Date(nextDate);
                                    const checkInDate = new Date(
                                      matchDate.getTime() - 15 * 60000,
                                    );
                                    const offset =
                                      checkInDate.getTimezoneOffset() * 60000;
                                    nextCheckInStart = new Date(
                                      checkInDate.getTime() - offset,
                                    )
                                      .toISOString()
                                      .slice(0, 16);
                                  }

                                  setEditForm({
                                    ...editForm,
                                    date: nextDate,
                                    checkInStart: nextCheckInStart,
                                  });
                                }}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-3.5 font-bold text-white [color-scheme:dark] shadow-inner transition-all outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                  Check-in System
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextEnabled =
                                      !editForm.checkInEnabled;
                                    let nextCheckInStart =
                                      editForm.checkInStart;

                                    if (nextEnabled && editForm.date) {
                                      const matchDate = new Date(editForm.date);
                                      const checkInDate = new Date(
                                        matchDate.getTime() - 15 * 60000,
                                      );
                                      const offset =
                                        checkInDate.getTimezoneOffset() * 60000;
                                      nextCheckInStart = new Date(
                                        checkInDate.getTime() - offset,
                                      )
                                        .toISOString()
                                        .slice(0, 16);
                                    }

                                    setEditForm({
                                      ...editForm,
                                      checkInEnabled: nextEnabled,
                                      checkInStart: nextCheckInStart,
                                    });
                                  }}
                                  className={`relative h-6 w-11 rounded-full transition-colors ${editForm.checkInEnabled ? "bg-emerald-500" : "bg-slate-800"}`}
                                >
                                  <div
                                    className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${editForm.checkInEnabled ? "translate-x-5" : "translate-x-0"}`}
                                  />
                                </button>
                              </div>
                              <div
                                className={`transition-all duration-300 ${editForm.checkInEnabled ? "opacity-100" : "pointer-events-none opacity-20"}`}
                              >
                                <input
                                  type="datetime-local"
                                  value={editForm.checkInStart}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      checkInStart: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-3.5 font-bold text-white [color-scheme:dark] shadow-inner transition-all outline-none focus:border-emerald-500"
                                />
                                <div className="mt-2 flex items-center justify-between px-1">
                                  <p className="text-[9px] font-medium text-slate-600 uppercase italic">
                                    Players can check-in after this time
                                  </p>
                                  <button
                                    type="button"
                                    onClick={handleSendCheckInAlert}
                                    disabled={
                                      updating ||
                                      !editForm.checkInEnabled ||
                                      !tournament.discordChannelId
                                    }
                                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[9px] font-black tracking-widest uppercase transition-all ${
                                      editForm.checkInEnabled &&
                                      tournament.discordChannelId
                                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                        : "cursor-not-allowed bg-slate-800 text-slate-500 opacity-50"
                                    }`}
                                  >
                                    <span className="text-[12px]">📢</span>
                                    {tournament.discordChannelId
                                      ? "Send Live Alert"
                                      : "Link Discord to Alert"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                              <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                Max Capacity
                              </label>
                              <input
                                type="number"
                                value={editForm.maxTeams}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    maxTeams: parseInt(e.target.value),
                                  })
                                }
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-3.5 font-bold text-white shadow-inner transition-all outline-none focus:border-blue-500"
                                placeholder="16"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                Entry Fee
                              </label>
                              <input
                                type="text"
                                value={editForm.entryFee}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    entryFee: e.target.value,
                                  })
                                }
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-3.5 font-bold text-white shadow-inner transition-all outline-none focus:border-blue-500"
                                placeholder="e.g. ₹500 or Free"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Additional Rewards */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                            Extra Rewards
                          </h4>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                              Custom Prizes
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setEditForm({
                                  ...editForm,
                                  additionalPrizes: [
                                    ...editForm.additionalPrizes,
                                    { label: "", value: "" },
                                  ],
                                })
                              }
                              className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-1.5 text-[9px] font-black tracking-widest text-rose-500 uppercase transition-all hover:bg-rose-500 hover:text-white"
                            >
                              <Plus className="h-3 w-3" /> Add Item
                            </button>
                          </div>
                          <div className="space-y-3">
                            {editForm.additionalPrizes.map((prize, idx) => (
                              <div
                                key={idx}
                                className="group animate-in slide-in-from-top-1 flex gap-2 duration-200"
                              >
                                <input
                                  type="text"
                                  value={prize.label}
                                  onChange={(e) => {
                                    const newPrizes = [
                                      ...editForm.additionalPrizes,
                                    ];
                                    newPrizes[idx].label = e.target.value;
                                    setEditForm({
                                      ...editForm,
                                      additionalPrizes: newPrizes,
                                    });
                                  }}
                                  placeholder="Title"
                                  className="flex-[1.5] rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-xs font-bold text-white transition-all outline-none focus:border-rose-500"
                                />
                                <input
                                  type="text"
                                  value={prize.value}
                                  onChange={(e) => {
                                    const newPrizes = [
                                      ...editForm.additionalPrizes,
                                    ];
                                    newPrizes[idx].value = e.target.value;
                                    setEditForm({
                                      ...editForm,
                                      additionalPrizes: newPrizes,
                                    });
                                  }}
                                  placeholder="Value"
                                  className="flex-1 rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-xs font-bold text-white transition-all outline-none focus:border-rose-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPrizes =
                                      editForm.additionalPrizes.filter(
                                        (_, i) => i !== idx,
                                      );
                                    setEditForm({
                                      ...editForm,
                                      additionalPrizes: newPrizes,
                                    });
                                  }}
                                  className="p-3 text-slate-600 transition-colors hover:text-rose-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            {editForm.additionalPrizes.length === 0 && (
                              <div className="rounded-2xl border border-dashed border-white/5 bg-slate-950/20 py-8 text-center text-slate-700">
                                <p className="text-[10px] font-bold tracking-widest uppercase">
                                  No extra rewards defined
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section: Full Width Description */}
                    <div className="space-y-8 border-t border-white/5 pt-10">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                        <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                          Tournament Description & Rules
                        </h4>
                      </div>
                      <div className="space-y-2">
                        <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                          Public Information
                        </label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          rows={10}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-6 py-5 leading-relaxed font-medium text-white shadow-inner transition-all outline-none focus:border-violet-500"
                          placeholder="Tell your players about the tournament, its rules, format, and any other relevant information..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Lobby Section */}
                  <div className="space-y-8 border-t border-white/5 pt-10">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                        Active Lobby & Match Info
                      </h4>
                    </div>

                    <div className="max-w-md space-y-2">
                      <label className="ml-1 text-[10px] font-black tracking-widest text-rose-500/70 uppercase">
                        Valorant Party Code
                      </label>
                      <div className="group relative">
                        <input
                          type="text"
                          value={editForm.valoPartyCode}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              valoPartyCode: e.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-4 font-mono text-lg font-black tracking-widest text-white shadow-inner transition-all outline-none focus:border-rose-500/50"
                          placeholder="e.g. PARTY-123"
                        />
                        <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[10px] font-black text-rose-500/20 uppercase">
                          MATCH LOBBY
                        </div>
                      </div>
                      <p className="px-1 text-[9px] font-medium text-slate-600">
                        This code will be visible to all verified participants
                        immediately. Update this when the lobby is ready.
                      </p>
                    </div>
                  </div>

                  {/* Discord Integration Section */}
                  <div className="space-y-8 border-t border-white/5 pt-10">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                        Discord Integration
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                      <div className="space-y-2">
                        <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                          Channel ID
                        </label>
                        <input
                          type="text"
                          value={editForm.discordChannelId}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              discordChannelId: e.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-3.5 font-mono text-xs font-bold text-white shadow-inner transition-all outline-none focus:border-blue-500"
                          placeholder="Text Channel ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                          Voice Channel ID
                        </label>
                        <input
                          type="text"
                          value={editForm.discordVoiceChannelId}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              discordVoiceChannelId: e.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-3.5 font-mono text-xs font-bold text-white shadow-inner transition-all outline-none focus:border-blue-500"
                          placeholder="Voice Channel ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                          Role ID
                        </label>
                        <input
                          type="text"
                          value={editForm.discordRoleId}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              discordRoleId: e.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-3.5 font-mono text-xs font-bold text-white shadow-inner transition-all outline-none focus:border-blue-500"
                          placeholder="Tournament Role ID"
                        />
                      </div>
                    </div>

                    <div className="max-w-md space-y-2">
                      <label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                        Invite URL
                      </label>
                      <input
                        type="text"
                        value={editForm.discordInviteUrl}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            discordInviteUrl: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-3.5 font-bold text-white shadow-inner transition-all outline-none focus:border-blue-500"
                        placeholder="https://discord.gg/..."
                      />
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-10">
                    <button
                      type="submit"
                      disabled={updating}
                      className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-6 text-[11px] font-black tracking-[0.2em] text-white uppercase shadow-xl shadow-emerald-900/10 transition-all hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {updating ? (
                        <LoaderIcon className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-5 w-5 transition-transform group-hover:scale-125" />
                          Save Tournament Configuration
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-white/5 bg-slate-950/30 p-8 backdrop-blur-sm">
                  <h3 className="mb-6 text-lg font-black tracking-tight text-white uppercase">
                    Danger Zone
                  </h3>
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-6">
                      <h4 className="mb-2 text-sm font-bold text-rose-500">
                        Delete Tournament
                      </h4>
                      <p className="mb-6 text-xs leading-relaxed text-slate-500">
                        Permanent deletion of this tournament, including all
                        registrations, matches, and metadata. This action cannot
                        be undone.
                      </p>
                      <div className="space-y-4">
                        <button
                          onClick={handleDelete}
                          type="button"
                          disabled={deleteStep === 2}
                          className={`flex min-w-[200px] items-center justify-center gap-2 rounded-xl px-6 py-4 text-[10px] font-black tracking-widest uppercase shadow-lg transition-all ${
                            deleteStep === 1
                              ? "animate-pulse bg-amber-500 text-slate-950 shadow-amber-900/20"
                              : deleteStep === 2
                                ? "cursor-not-allowed border border-white/5 bg-slate-900 text-slate-500"
                                : "bg-rose-600 text-white shadow-rose-900/20 hover:bg-rose-700"
                          }`}
                        >
                          {deleteStep === 0 && (
                            <>
                              <Trash2 className="h-4 w-4" /> Delete Event
                            </>
                          )}
                          {deleteStep === 1 && (
                            <>
                              <Info className="h-4 w-4" /> Click Again to
                              Confirm
                            </>
                          )}
                          {deleteStep === 2 && (
                            <LoaderIcon className="h-4 w-4 animate-spin" />
                          )}
                        </button>

                        {deleteError && (
                          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-500">
                            <X className="h-4 w-4" />
                            {deleteError}
                          </div>
                        )}
                      </div>
                    </div>

                    {(tournament.discordChannelId ||
                      tournament.discordVoiceChannelId) && (
                      <div className="mt-4 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 p-6">
                        <h4 className="mb-2 text-sm font-bold text-indigo-400">
                          Discord Channel Management
                        </h4>
                        <p className="mb-6 text-xs leading-relaxed text-slate-500">
                          Manually delete the associated Discord channels (Text
                          & Voice). This is useful if you want to keep the
                          tournament on the website but remove the Discord
                          lobby.
                        </p>
                        <div className="space-y-4">
                          <button
                            onClick={handleManualDiscordDelete}
                            type="button"
                            disabled={discordDeleteStep === 2 || updating}
                            className={`flex min-w-[200px] items-center justify-center gap-2 rounded-xl px-6 py-4 text-[10px] font-black tracking-widest uppercase shadow-lg transition-all ${
                              discordDeleteStep === 1
                                ? "animate-pulse bg-amber-500 text-slate-950 shadow-amber-900/20"
                                : discordDeleteStep === 2
                                  ? "cursor-not-allowed border border-white/5 bg-slate-900 text-slate-500"
                                  : "bg-indigo-600 text-white shadow-indigo-900/20 hover:bg-indigo-700"
                            }`}
                          >
                            {discordDeleteStep === 0 && (
                              <>
                                <Trash2 className="h-4 w-4" /> Delete Discord
                                Channels
                              </>
                            )}
                            {discordDeleteStep === 1 && (
                              <>
                                <Info className="h-4 w-4" /> Click to Confirm
                              </>
                            )}
                            {discordDeleteStep === 2 && (
                              <LoaderIcon className="h-4 w-4 animate-spin" />
                            )}
                          </button>

                          {discordDeleteError && (
                            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-500">
                              <X className="h-4 w-4" />
                              {discordDeleteError}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/5 bg-slate-950/30 p-8 backdrop-blur-sm">
                  <h3 className="mb-6 text-lg font-black tracking-tight text-white uppercase">
                    Global Info
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
                        Database ID
                      </p>
                      <div className="rounded-xl border border-white/5 bg-slate-900 p-3 font-mono text-xs text-slate-400">
                        {id}
                      </div>
                    </div>
                    <div className="space-y-2 pt-4">
                      <p className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
                        Quick Stats
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-white/5 bg-slate-900 p-4">
                          <p className="mb-1 text-[8px] font-black tracking-widest text-rose-500 uppercase">
                            Prize Pool
                          </p>
                          <p className="text-xl font-black text-white italic">
                            {tournament.prizePool}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-slate-900 p-4">
                          <p className="mb-1 text-[8px] font-black tracking-widest text-rose-500 uppercase">
                            Location
                          </p>
                          <p className="truncate text-xl font-black text-white italic">
                            {tournament.location || "Online"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Rejection Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="animate-in zoom-in-95 w-full max-w-md rounded-3xl border border-rose-500/20 bg-slate-900 p-6 shadow-2xl duration-200">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-full bg-rose-500/10 p-3 text-rose-500">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Reject Payment</h3>
                <p className="text-sm text-slate-400">
                  Select a reason for rejection
                </p>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              {REJECTION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                    rejectionReason === reason
                      ? "border-rose-500 bg-rose-500/10 text-white"
                      : "border-white/5 bg-slate-950/50 text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={rejectionReason === reason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="h-4 w-4 accent-rose-500"
                  />
                  <span className="font-medium">{reason}</span>
                </label>
              ))}

              {rejectionReason === "Other" && (
                <div className="animate-in slide-in-from-top-2 mt-2 pl-4">
                  <textarea
                    value={customRejectionReason}
                    onChange={(e) => setCustomRejectionReason(e.target.value)}
                    placeholder="Enter specific reason..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={updating}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-900/20 transition-all hover:bg-rose-500 disabled:opacity-50"
              >
                {updating ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm Rejection"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
