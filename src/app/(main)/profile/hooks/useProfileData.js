import { useState, useEffect } from "react";
import {
  getAccount,
  getMMR,
  getMMRByName,
  getMatches,
  getAccountByPuuid,
  getPlayerCard,
  getAgents,
} from "@/lib/valorant";
import { getUserProfile } from "@/lib/users";
import { getUserFreeAgentPost } from "@/lib/players";

/**
 * Custom hook to manage profile data fetching
 * Encapsulates all Valorant API and profile data loading logic
 */
export function useProfileData(user, authLoading) {
  // Valorant profile state
  const [valProfile, setValProfile] = useState(null);
  const [platformProfile, setPlatformProfile] = useState(null);
  const [mmrData, setMmrData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [cardData, setCardData] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [mmrLoading, setMmrLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Form state for linking
  const [riotId, setRiotId] = useState("");
  const [riotTag, setRiotTag] = useState("");
  const [region, setRegion] = useState("ap");

  // Player Finder post
  const [userPost, setUserPost] = useState(null);
  const [formData, setFormData] = useState({
    role: "Duelist",
    description: "",
    mainAgent: "",
    secondaryAgents: [],
  });

  // Load profile data
  useEffect(() => {
    if (authLoading || !user) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const profile = await getUserProfile(user.$id);
        if (profile) {
          setPlatformProfile(profile);
          setRiotId(profile.ingameName);
          setRiotTag(profile.tag);
          setRegion(profile.region || "ap");

          // Fetch account data
          const accountDataPromise = profile.puuid
            ? getAccountByPuuid(profile.puuid)
            : getAccount(profile.ingameName, profile.tag);

          const accountData = await accountDataPromise;

          if (accountData.data) {
            setValProfile(accountData.data);

            // Fetch Card Data
            if (accountData.data.card) {
              getPlayerCard(accountData.data.card)
                .then((cardRes) => setCardData(cardRes?.data))
                .catch((e) => console.error("Card fetch failed:", e));
            }

            // Fetch MMR
            const playerRegion = profile.region || accountData.data.region || "ap";
            const puuid = accountData.data.puuid;

            setMmrLoading(true);
            getMMR(puuid, playerRegion)
              .then((res) => setMmrData(res.data))
              .catch(async () => {
                console.error("MMR fetch by PUUID failed, trying fallback...");
                const fallbackRes = await getMMRByName(
                  playerRegion,
                  accountData.data.name,
                  accountData.data.tag
                ).catch(() => null);
                if (fallbackRes) setMmrData(fallbackRes.data);
              })
              .finally(() => setMmrLoading(false));

            // Fetch Matches
            setMatchesLoading(true);
            getMatches(puuid, playerRegion)
              .then((res) => setMatches(res.data))
              .catch(() => setMatches([]))
              .finally(() => setMatchesLoading(false));

            // Fetch Player Finder Post
            getUserFreeAgentPost(user.$id)
              .then((post) => {
                setUserPost(post);
                if (post) {
                  setFormData({
                    role: post.role || "Duelist",
                    description: post.description || "",
                    mainAgent: post.mainAgent || "",
                    secondaryAgents: post.secondaryAgents || [],
                  });
                }
              })
              .catch(() => setUserPost(null));
          } else {
            setValProfile(null);
          }
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    // Load Agents
    getAgents()
      .then((res) => setAvailableAgents(res.data))
      .catch(console.error);
  }, [user, authLoading]);

  return {
    // Profile data
    valProfile,
    setValProfile,
    platformProfile,
    setPlatformProfile,
    mmrData,
    setMmrData,
    matches,
    cardData,
    setCardData,
    availableAgents,

    // Loading states  
    loading,
    setLoading,
    mmrLoading,
    matchesLoading,

    // Form state
    riotId,
    setRiotId,
    riotTag,
    setRiotTag,
    region,
    setRegion,

    // Player Finder
    userPost,
    setUserPost,
    formData,
    setFormData,
  };
}
