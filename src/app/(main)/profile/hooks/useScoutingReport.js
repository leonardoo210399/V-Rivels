import { useState } from "react";
import { getUserProfile } from "@/lib/users";
import {
  createFreeAgentPost,
  deleteFreeAgentPost,
  updateFreeAgentPost,
} from "@/lib/players";

/**
 * Custom hook to manage scouting report form state and submission
 */
export function useScoutingReport({ user, userPost, setUserPost, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    role: "Duelist",
    description: "",
    mainAgent: "",
    secondaryAgents: [],
  });

  const handlePost = async (e) => {
    e.preventDefault();
    if (!user) return notify("Please login first", "error");
    setPosting(true);

    try {
      const profile = await getUserProfile(user.$id);
      if (!profile || !profile.ingameName) {
        notify("Please link your Riot Account in your Profile first.", "error");
        setPosting(false);
        return;
      }

      if (!formData.mainAgent) {
        notify("Please select a Main Agent.", "error");
        setPosting(false);
        return;
      }

      if (formData.secondaryAgents.length === 0) {
        notify("Please select at least one Secondary Agent.", "error");
        setPosting(false);
        return;
      }

      const postData = {
        userId: user.$id,
        ingameName: profile.ingameName,
        tag: profile.tag,
        role: formData.role,
        region: profile.region || "ap",
        description: formData.description,
        mainAgent: formData.mainAgent,
        secondaryAgents: formData.secondaryAgents,
        discordTag: profile.discordTag || null,
        discordUsername: profile.discordUsername || null,
      };

      let post;
      if (userPost) {
        post = await updateFreeAgentPost(userPost.$id, postData);
        notify("Scouting Report updated successfully!");
      } else {
        post = await createFreeAgentPost(postData);
        notify("Scouting Report is now live!");
      }

      setShowForm(false);
      setFormData({
        role: "Duelist",
        description: "",
        mainAgent: "",
        secondaryAgents: [],
      });
      setUserPost(post);
    } catch (error) {
      notify("Failed to post: " + error.message, "error");
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!userPost) return;
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteFreeAgentPost(userPost.$id);
      setUserPost(null);
      setShowConfirmModal(false);
      notify("Ad removed successfully.");
    } catch (error) {
      notify("Failed to delete: " + error.message, "error");
    }
  };

  // Pre-populate form when editing existing post
  const editPost = (post) => {
    if (post) {
      setFormData({
        role: post.role || "Duelist",
        description: post.description || "",
        mainAgent: post.mainAgent || "",
        secondaryAgents: post.secondaryAgents || [],
      });
    }
    setShowForm(true);
  };

  return {
    showForm,
    setShowForm,
    posting,
    formData,
    setFormData,
    showConfirmModal,
    setShowConfirmModal,
    handlePost,
    handleDeletePost,
    confirmDelete,
    editPost,
  };
}
