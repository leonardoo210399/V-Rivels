import { useState, useEffect, useMemo } from "react";
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
// LocalStorage key for tracking linked account status
const LINKED_ACCOUNT_KEY = "vra_account_linked";

export function useProfileData(user, authLoading) {
  // Valorant profile state
  const [valProfile, setValProfile] = useState(null);
  const [platformProfile, setPlatformProfile] = useState(null);
  const [mmrData, setMmrData] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);
  
  // Match cache: dictionary of mode -> matches[]
  const [matchCache, setMatchCache] = useState({});

  // Consolidate matches from all modes into a single sorted list
  const matches = useMemo(() => {
    // 1. Flatten all match arrays into one
    const allMatches = Object.values(matchCache).flat();
    
    // 2. Efficient deduplication using a Map
    const seen = new Map();
    allMatches.forEach(m => {
      const id = m?.metadata?.matchid;
      if (id && !seen.has(id)) {
        seen.set(id, m);
      }
    });

    // 3. Robust chronological sort (newest first)
    return Array.from(seen.values()).sort((a, b) => {
      const timeA = Number(a?.metadata?.game_start || 0);
      const timeB = Number(b?.metadata?.game_start || 0);
      return timeB - timeA;
    });
  }, [matchCache]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [mmrLoading, setMmrLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Track if user has previously linked their account (persisted in localStorage)
  const [hasLinkedAccount, setHasLinkedAccount] = useState(false);
  // Track if profile fetch failed (for showing appropriate error state)
  const [profileFetchFailed, setProfileFetchFailed] = useState(false);

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

  // Check localStorage on mount to see if user has previously linked account
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const linkedFlag = localStorage.getItem(`${LINKED_ACCOUNT_KEY}_${user.$id}`);
      if (linkedFlag === "true") {
        setHasLinkedAccount(true);
      }
    }
  }, [user]);

  // Function to get cache key
  const getCacheKey = (mode) => `vra_matches_${valProfile?.puuid}_${mode || "all"}`;

  // Function to load matches with caching
  const refetchMatches = async (mode = "", force = false, isBackground = false) => {
    if (!valProfile?.puuid || !region || mode === "all") return;

    const cacheKey = getCacheKey(mode);
    
    // 1. Check if we have it in state cache first (unless forced)
    if (!force && matchCache[mode]) {
      return; 
    }

    // 2. Check sessionStorage if not in state
    if (!force) {
      const stored = sessionStorage.getItem(cacheKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setMatchCache(prev => ({ ...prev, [mode]: parsed }));
          return;
        } catch (e) {
          sessionStorage.removeItem(cacheKey);
        }
      }
    }
    
    // Only show loading if not a background prefetch
    if (!isBackground) setMatchesLoading(true);
    
    try {
      // API limit is 10 for v3, so we use 10
      const res = await getMatches(valProfile.puuid, region, 10, mode);
      const newMatches = res.data || [];
      
      // Update cache
      setMatchCache(prev => ({ ...prev, [mode]: newMatches }));
      
      // Update persistent session cache with protection
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(newMatches));
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('vra_matches_')) sessionStorage.removeItem(key);
          });
          try { sessionStorage.setItem(cacheKey, JSON.stringify(newMatches)); } catch (retryError) {}
        }
      }
    } catch (err) {
      console.error(`Failed to fetch ${mode || 'all'} matches:`, err);
    } finally {
      if (!isBackground) setMatchesLoading(false);
    }
  };

  // Load profile data
  useEffect(() => {
    if (authLoading || !user) return;

    const loadProfile = async () => {
      setLoading(true);
      setProfileFetchFailed(false);
      try {
        const profile = await getUserProfile(user.$id);
        if (profile) {
          setPlatformProfile(profile);
          setRiotId(profile.ingameName);
          setRiotTag(profile.tag);
          
          if (typeof window !== "undefined") {
            localStorage.setItem(`${LINKED_ACCOUNT_KEY}_${user.$id}`, "true");
            setHasLinkedAccount(true);
          }
          const playerRegion = profile.region || "ap";
          setRegion(playerRegion);

          const accountDataPromise = profile.puuid
            ? getAccountByPuuid(profile.puuid)
            : getAccount(profile.ingameName, profile.tag);

          const accountData = await accountDataPromise;

          if (accountData.data) {
            setValProfile(accountData.data);

            if (accountData.data.card) {
              getPlayerCard(accountData.data.card)
                .then((cardRes) => setCardData(cardRes?.data))
                .catch((e) => console.error("Card fetch failed:", e));
            }

            const puuid = accountData.data.puuid;

            setMmrLoading(true);
            getMMR(puuid, playerRegion)
              .then((res) => setMmrData(res.data))
              .catch(async () => {
                const fallbackRes = await getMMRByName(
                  playerRegion,
                  accountData.data.name,
                  accountData.data.tag
                ).catch(() => null);
                if (fallbackRes) setMmrData(fallbackRes.data);
              })
              .finally(() => setMmrLoading(false));

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
        setProfileFetchFailed(true);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    getAgents()
      .then((res) => setAvailableAgents(res.data))
      .catch(console.error);
  }, [user, authLoading]);

  // Secondary effect to trigger initial match load and background prefetch others
  useEffect(() => {
    if (valProfile?.puuid && region) {
      const allModes = ["competitive", "unrated", "swiftplay", "deathmatch", "custom"];
      
      const loadAllAndPrefetch = async () => {
        for (const mode of allModes) {
          const isFirst = mode === allModes[0];
          await refetchMatches(mode, false, !isFirst);
        }
      };
      
      loadAllAndPrefetch();
    }
  }, [valProfile?.puuid, region]);

  return {
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
    loading,
    setLoading,
    mmrLoading,
    matchesLoading,
    refetchMatches,
    hasLinkedAccount,
    setHasLinkedAccount,
    profileFetchFailed,
    riotId,
    setRiotId,
    riotTag,
    setRiotTag,
    region,
    setRegion,
    userPost,
    setUserPost,
    formData,
    setFormData,
  };
}
