import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  updateTournament,
  deleteTournament,
} from "@/lib/tournaments";
import { 
  deleteTournamentChannelsAction, 
  sendTournamentMessageAction 
} from "@/app/actions/discord";
import { createBracket, deleteMatches, revertTournamentStats } from "@/lib/brackets";

export function useTournamentActions(id, tournament, setTournament, registrations, matches, loadData) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [startStep, setStartStep] = useState(0);
  const [startError, setStartError] = useState(null);
  const [resetStep, setResetStep] = useState(0);
  const [resetError, setResetError] = useState(null);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteError, setDeleteError] = useState(null);
  const [discordDeleteStep, setDiscordDeleteStep] = useState(0);
  const [discordDeleteError, setDiscordDeleteError] = useState(null);
  
  // DM Party Code is often used when starting the tournament
  const [dmPartyCode, setDmPartyCode] = useState("");

  const handleStartTournament = async (matchFormat = "BO1") => {
    if (tournament.bracketGenerated || matches.length > 0) {

      toast.error(
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
        dmPartyCode,
        matchFormat,
      );
      await updateTournament(id, { bracketGenerated: true, status: "ongoing" });

      // Send Discord notification if party code exists
      if (dmPartyCode && tournament.discordChannelId) {
        let message = "";
        if (tournament.gameType === "Deathmatch") {
          message = `📢 **DEATHMATCH ARENA READY!**\n\n🔑 **Lobby Code:** \`${dmPartyCode}\`\n\n*All participants, please join the lobby immediately!*`;
        } else {
          message = `📢 **MATCH LOBBY READY!**\n\n🔑 **Lobby Code:** \`${dmPartyCode}\`\n\n*Please join the lobby immediately!*`;
        }
        
        try {
          await sendTournamentMessageAction(
            tournament.discordChannelId,
            message,
            tournament.discordRoleId
          );
        } catch (discordErr) {
          console.warn("Discord notification failed:", discordErr);
        }
      }

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
      setTimeout(() => setResetStep(0), 3000); 
      return;
    }

    setResetStep(2);
    setResetError(null);
    setUpdating(true);

    try {
      await revertTournamentStats(id);
      await deleteMatches(id);
      await updateTournament(id, { bracketGenerated: false, status: "scheduled" });
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

    // Delete Discord Channels if they exist
    if (tournament.discordChannelId || tournament.discordVoiceChannelId) {
      try {
        const result = await deleteTournamentChannelsAction(
          [tournament.discordChannelId, tournament.discordVoiceChannelId],
          tournament.discordRoleId,
        );
        if (result && result.error) {
          toast.error(`Discord Deletion Failed: ${result.error}`);
          // Proceeding to delete tournament anyway as this is a force cancel?
          // Actually, if discord fails we probably want to warn user but since this is 'deleteStep' logic
          // which seems to be a custom stepper, it might be better to just show toast.
          // Since I can't easily wait for user input in this loop without breaking function structure too much,
          // I'll just assume failure here stops the process or we ignore it.
          // The original code used confirm to ask "Delete anyway?".
          // I will use a toast that says "Discord deletion failed. Retry or manually delete?" and stop.
          setDeleteStep(0);
          setUpdating(false);
          return;
        }
      } catch (discordErr) {
        console.warn("Failed to delete discord channels:", discordErr);
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

  const handleManualDiscordDelete = async () => {
    if (!tournament.discordChannelId && !tournament.discordVoiceChannelId) {
      toast.error("No Discord channel IDs found for this tournament.");
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
        const updateData = {};
        if (tournament.discordChannelId) updateData.discordChannelId = null;
        if (tournament.discordVoiceChannelId) updateData.discordVoiceChannelId = null;
        if (tournament.discordRoleId) updateData.discordRoleId = null;

        await updateTournament(id, updateData);
        setTournament((prev) => ({
          ...prev,
          discordChannelId: null,
          discordVoiceChannelId: null,
          discordRoleId: null,
        }));

        toast.success("Discord Channels Deleted successfully!");
        setDiscordDeleteStep(0);
      }
    } catch (error) {
      setDiscordDeleteError(error.message);
      setDiscordDeleteStep(0);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveSettings = async (editFormData) => {
    setUpdating(true);
    try {
      const dataToUpdate = {
        ...editFormData,
        date: editFormData.date ? new Date(editFormData.date).toISOString() : null,
        checkInStart: editFormData.checkInStart ? new Date(editFormData.checkInStart).toISOString() : null,
        additionalPrizes: JSON.stringify(editFormData.additionalPrizes),
      };

      if (dataToUpdate.checkInStart !== tournament.checkInStart) {
        dataToUpdate.checkInAlertSent = false;
      }

      await updateTournament(id, dataToUpdate);

      setTournament((prev) => ({ ...prev, ...dataToUpdate }));

      toast.success("Tournament updated successfully!");
    } catch (e) {
      toast.error("Failed to update tournament: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  return {
    updating,
    setUpdating,
    startStep,
    startError,
    resetStep,
    resetError,
    deleteStep,
    deleteError,
    discordDeleteStep,
    discordDeleteError,
    dmPartyCode,
    setDmPartyCode,
    
    handleStartTournament,
    handleResetBracket,
    handleDelete,
    handleManualDiscordDelete,
    handleSaveSettings,
  };
}
