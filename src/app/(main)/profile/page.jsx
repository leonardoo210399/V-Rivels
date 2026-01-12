"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  getAccount,
  getMMR,
  getMMRByName,
  getMatches,
  getAccountByPuuid,
  getPlayerCard,
  getAgents,
} from "@/lib/valorant";
import { saveUserProfile, getUserProfile } from "@/lib/users";
import { account } from "@/lib/appwrite";
import {
  User,
  Trophy,
  Activity,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Sword,
  Shield,
  Crosshair,
  Zap,
  Brain,
  RefreshCw,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  MessageCircle,
} from "lucide-react";
import MatchDetailsModal from "@/components/MatchDetailsModal";
import {
  createFreeAgentPost,
  deleteFreeAgentPost,
  getUserFreeAgentPost,
  updateFreeAgentPost,
} from "@/lib/players";
import {
  Trash2,
  DollarSign,
  Crown,
  Swords,
  ArrowRight,
  Medal,
} from "lucide-react";
import Link from "next/link";
import Loader from "@/components/Loader";
import ProfileSkeleton from "@/components/ProfileSkeleton";
import { rankIcons } from "@/assets/images/ranks";
import { agentIcons } from "@/assets/images/agents";

// Fallback icon for Controller
const Cloud = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3-1.3-3-3s1.3-3 3-3 1 1.4 1 3h2c0-2.8-2.2-5-5-5S1.5 6.2 1.5 9c0 .4.1.8.2 1.1C.6 15 4.8 19 10 19h7.5c2.5 0 4.5-2 4.5-4.5S20 10 17.5 10c-.3 0-.6.1-.8.2.3-1.4 0-2.8-1.2-3.8" />
  </svg>
);

const ROLE_ICONS = {
  Duelist: Sword,
  Controller: Cloud,
  Sentinel: Shield,
  Initiator: Zap,
  Flex: Brain,
};

export default function ProfilePage() {
  const {
    user,
    loading: authLoading,
    loginWithDiscord,
    unlinkDiscord,
  } = useAuth();
  const router = useRouter();

  // State for Valorant Data
  const [valProfile, setValProfile] = useState(null);
  const [platformProfile, setPlatformProfile] = useState(null);
  const [mmrData, setMmrData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mmrLoading, setMmrLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State for linking account
  const [riotId, setRiotId] = useState("");
  const [riotTag, setRiotTag] = useState("");
  const [region, setRegion] = useState("ap");

  // Modal State
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("All");

  // Discord State
  const [discordIdentity, setDiscordIdentity] = useState(null);
  const [discordProfile, setDiscordProfile] = useState(null);

  // Team Finder State
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [formData, setFormData] = useState({
    role: "Duelist",
    description: "",
    mainAgent: "",
    secondaryAgents: [],
  });
  const [userPost, setUserPost] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);

  // Custom Notification State
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const notify = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  // Check for Discord Session on Load and Save Data
  useEffect(() => {
    const checkDiscordSession = async () => {
      if (!user) return;

      try {
        const session = await account.getSession("current");
        if (session.provider === "discord") {
          // Fetch Discord User Data using the provider access token
          const res = await fetch("https://discord.com/api/users/@me", {
            headers: {
              Authorization: `Bearer ${session.providerAccessToken}`,
            },
          });

          if (res.ok) {
            const discordUser = await res.json();
            const discordTag =
              discordUser.discriminator === "0"
                ? discordUser.username
                : `${discordUser.username}#${discordUser.discriminator}`;

            const displayName = discordUser.global_name || discordUser.username;

            // Update if data is missing or different
            if (
              platformProfile &&
              (platformProfile.discordId !== discordUser.id ||
                platformProfile.discordTag !== discordTag ||
                platformProfile.discordUsername !== displayName)
            ) {
              console.log("Saving Discord Profile:", discordTag, displayName);

              const updatedProfile = {
                ...platformProfile,
                discordId: discordUser.id,
                discordTag: discordTag, // e.g., n3mo4179
                discordUsername: displayName, // e.g., n3mo (the bold name)
              };

              // We need to re-save the profile with the new data
              await saveUserProfile(user.$id, {
                discordId: discordUser.id,
                discordTag: discordTag,
                discordUsername: displayName,
              });

              setPlatformProfile(updatedProfile);

              // Also sync to Team Finder post if it exists
              try {
                const userPost = await getUserFreeAgentPost(user.$id);
                if (userPost) {
                  await updateFreeAgentPost(userPost.$id, {
                    discordTag: discordTag,
                    discordUsername: displayName,
                  });
                  console.log("Synced Discord to Team Finder Post");
                }
              } catch (syncErr) {
                console.error(
                  "Failed to sync Discord to Team Finder:",
                  syncErr,
                );
              }

              notify(`Connected Discord: ${discordTag}`);
            }
          }
        }
      } catch (e) {
        // Not a discord session or error fetching, ignore
      }
    };

    // Slight delay to ensure profile is loaded or just run it
    if (user && platformProfile) {
      checkDiscordSession();
    }
  }, [user, platformProfile]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      // Load existing linked profile if available
      const loadProfile = async () => {
        setLoading(true);
        try {
          const profile = await getUserProfile(user.$id);
          if (profile) {
            setPlatformProfile(profile);
            setRiotId(profile.ingameName);
            setRiotTag(profile.tag);
            setRegion(profile.region || "ap");

            // We know the user has a linked account, so we can stop showing the "Link Account" form
            // and show the skeleton while we fetch the rest
            // (LATER: we could even set a "placeholder" valProfile here if we wanted)

            // Prioritize fetching by PUUID if it exists
            const accountDataPromise = profile.puuid
              ? getAccountByPuuid(profile.puuid)
              : getAccount(profile.ingameName, profile.tag);

            const accountData = await accountDataPromise;

            if (accountData.data) {
              setValProfile(accountData.data);

              // 1. Fetch Card Data (independent)
              if (accountData.data.card) {
                getPlayerCard(accountData.data.card)
                  .then((cardRes) => setCardData(cardRes?.data))
                  .catch((e) => console.error("Card fetch failed:", e));
              }

              // 2. Fetch Stats (MMR/Matches)
              const region = profile.region || accountData.data.region || "ap";
              const puuid = accountData.data.puuid;

              setMmrLoading(true);
              getMMR(puuid, region)
                .then((res) => setMmrData(res.data))
                .catch(async () => {
                  console.error(
                    "MMR fetch by PUUID failed for profile, trying Name/Tag fallback...",
                  );
                  const fallbackRes = await getMMRByName(
                    region,
                    accountData.data.name,
                    accountData.data.tag,
                  ).catch(() => null);
                  if (fallbackRes) setMmrData(fallbackRes.data);
                })
                .finally(() => setMmrLoading(false));

              setMatchesLoading(true);
              getMatches(puuid, region)
                .then((res) => setMatches(res.data))
                .catch(() => setMatches([]))
                .finally(() => setMatchesLoading(false));

              // 3. Fetch Team Finder Post
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
              // Handle case where linked account is no longer found
              setValProfile(null);
            }
          }
        } catch (err) {
          console.error("Failed to load existing profile", err);
        } finally {
          setLoading(false);
        }
      };
      loadProfile();

      // Load Agents
      getAgents()
        .then((res) => setAvailableAgents(res.data))
        .catch(console.error);
      // Check for Discord Identity
      const checkDiscord = async () => {
        try {
          // Try to list identities (Appwrite 1.4+)
          const identities = await account.listIdentities();
          const discord = identities.identities.find(
            (id) => id.provider === "discord",
          );
          if (discord) setDiscordIdentity(discord);
        } catch (e) {
          // Fallback for older SDK/Server versions or if permission denied,
          // check if user object has it (sometimes returned in account.get)
          if (user?.identities) {
            const discord = user.identities.find(
              (id) => id.provider === "discord",
            );
            if (discord) setDiscordIdentity(discord);
          }
        }
      };
      checkDiscord();
    }
  }, [user, authLoading, router]);

  // Fetch Discord Profile when Identity is found
  useEffect(() => {
    if (discordIdentity && discordIdentity.providerAccessToken) {
      fetch("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${discordIdentity.providerAccessToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setDiscordProfile(data);
        })
        .catch((err) => console.error("Failed to fetch Discord profile:", err));
    }
  }, [discordIdentity]);

  const handleLinkAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const accountData = await getAccount(riotId, riotTag);
      if (accountData.data) {
        setValProfile(accountData.data);

        // 1. Fetch Card Data
        if (accountData.data.card) {
          getPlayerCard(accountData.data.card)
            .then((cardRes) => setCardData(cardRes?.data))
            .catch((e) => console.error("Card fetch failed:", e));
        }

        // 2. Fetch extra stats
        // We use the USER SELECTED region here
        const puuid = accountData.data.puuid;

        getMMR(puuid, region)
          .then((res) => setMmrData(res.data))
          .catch(async () => {
            console.error(
              "MMR fetch by PUUID failed for linked account, trying Name/Tag fallback...",
            );
            const fallbackRes = await getMMRByName(
              region,
              accountData.data.name,
              accountData.data.tag,
            ).catch(() => null);
            if (fallbackRes) setMmrData(fallbackRes.data);
          });

        getMatches(puuid, region)
          .then((res) => setMatches(res.data))
          .catch(() => setMatches([]));

        // 3. Save to Appwrite
        const profileData = {
          puuid: accountData.data.puuid,
          email: user.email,
          ingameName: accountData.data.name,
          tag: accountData.data.tag,
          region: region, // Save the manually selected region
          card: accountData.data.card, // Save card ID for leaderboard
          level: accountData.data.account_level, // Save level for leaderboard
          createdTimestamp: new Date().toISOString(),
          totalEarnings: 0,
          tournamentsWon: 0,
          matchesWon: 0,
          runnerUp: 0,
        };
        await saveUserProfile(user.$id, profileData);
        setPlatformProfile(profileData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        // Update existing
        post = await updateFreeAgentPost(userPost.$id, postData);
        notify("Scouting Report updated successfully!");
      } else {
        // Create new
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
      notify("Failed to remove ad: " + error.message, "error");
    }
  };

  if (authLoading || !user) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
              <span className="text-[10px] font-black tracking-[0.4em] text-rose-500 uppercase">
                Operations Center
              </span>
            </div>
            <h1 className="group relative cursor-default text-3xl font-black tracking-tight text-white uppercase selection:bg-rose-500 selection:text-white">
              My Profile
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="h-0.5 w-8 rounded-full bg-rose-600" />
                <div className="h-0.5 w-1.5 rounded-full bg-slate-800" />
              </div>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {valProfile && (!userPost || showForm) && (
              <button
                onClick={() => setShowForm(!showForm)}
                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 font-bold shadow-lg transition-all ${showForm ? "border border-white/5 bg-slate-800 text-white" : "bg-rose-600 text-white shadow-rose-600/20 hover:bg-rose-700"}`}
              >
                {showForm ? (
                  "Cancel"
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Post Ad</span>
                  </>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Team Finder Form Integration */}
        {showForm && valProfile && (
          <div className="animate-in fade-in slide-in-from-top-4 mb-12 rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-10 flex flex-col items-center gap-3 text-center">
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 shadow-lg shadow-rose-500/5">
                <UserPlus className="h-8 w-8 text-rose-500" />
              </div>
              <div>
                <h2 className="mb-1 text-2xl font-black tracking-tight text-white uppercase">
                  {userPost ? "Update Scouting Report" : "List on Team Finder"}
                </h2>
                <p className="text-xs font-bold tracking-[0.3em] text-slate-500 uppercase">
                  {userPost
                    ? "Keep your profile fresh and active"
                    : "Find teams or recruit players"}
                </p>
              </div>
            </div>

            <form
              onSubmit={handlePost}
              className="mx-auto max-w-4xl space-y-12"
            >
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Preferred Role
                  </label>
                  <div className="group relative">
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-slate-950 p-4 pr-10 font-black tracking-wider text-white uppercase transition-all outline-none group-hover:bg-slate-900 focus:border-rose-500"
                    >
                      {Object.keys(ROLE_ICONS).map((r) => (
                        <option key={r} value={r} className="bg-slate-950">
                          {r}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-hover:text-white" />
                  </div>
                </div>

                <div className="flex items-end">
                  <div className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-slate-950 p-4 opacity-60">
                    {mmrData?.current_data?.images?.small && (
                      <img
                        src={
                          typeof rankIcons[mmrData.current_data.currenttier] ===
                          "object"
                            ? rankIcons[mmrData.current_data.currenttier]?.src
                            : rankIcons[mmrData.current_data.currenttier] ||
                              mmrData.current_data.images.small
                        }
                        alt=""
                        className="h-8 w-8 object-contain"
                      />
                    )}
                    <div>
                      <p className="mb-1 text-[10px] leading-none font-black tracking-widest text-slate-500 uppercase">
                        Auto-Synced Rank
                      </p>
                      <p className="text-sm font-bold text-white uppercase">
                        {mmrData?.current_data?.currenttierpatched ||
                          "Unranked"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agent Selection */}
              <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                <div className="flex flex-col items-center">
                  <label className="mb-4 block flex w-full items-center justify-between border-b border-white/5 pb-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                    Main Agent
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-400 normal-case">
                      Your star pick
                    </span>
                  </label>
                  <div className="grid grid-cols-5 justify-center gap-3 sm:grid-cols-6">
                    {availableAgents.map((agent) => (
                      <button
                        key={agent.uuid}
                        type="button"
                        onClick={() => {
                          const updatedSecondary =
                            formData.secondaryAgents.filter(
                              (a) => a !== agent.displayName,
                            );
                          setFormData({
                            ...formData,
                            mainAgent: agent.displayName,
                            secondaryAgents: updatedSecondary,
                          });
                        }}
                        className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-300 ${formData.mainAgent === agent.displayName ? "z-10 scale-110 border-rose-500 shadow-2xl shadow-rose-500/40" : "border-white/5 opacity-30 hover:scale-105 hover:opacity-100"}`}
                        title={agent.displayName}
                      >
                        <img
                          src={
                            typeof agentIcons[agent.displayName] === "object"
                              ? agentIcons[agent.displayName]?.src
                              : agentIcons[agent.displayName] ||
                                agent.displayIcon
                          }
                          alt={agent.displayName}
                          className="h-full w-full object-cover"
                        />
                        {formData.mainAgent === agent.displayName && (
                          <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20">
                            <div className="absolute bottom-0 w-full rounded bg-rose-500 px-1 py-0.5 text-center text-[8px] font-black text-white">
                              MAIN
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <label className="mb-4 block flex w-full items-center justify-between border-b border-white/5 pb-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                    Secondary Agents
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-400 normal-case">
                      Select multiple
                    </span>
                  </label>
                  <div className="grid grid-cols-5 justify-center gap-3 sm:grid-cols-6">
                    {availableAgents.map((agent) => (
                      <button
                        key={agent.uuid}
                        type="button"
                        onClick={() => {
                          if (agent.displayName === formData.mainAgent) return;
                          const current = formData.secondaryAgents;
                          if (current.includes(agent.displayName)) {
                            setFormData({
                              ...formData,
                              secondaryAgents: current.filter(
                                (a) => a !== agent.displayName,
                              ),
                            });
                          } else if (current.length < 5) {
                            setFormData({
                              ...formData,
                              secondaryAgents: [...current, agent.displayName],
                            });
                          }
                        }}
                        className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-300 ${formData.secondaryAgents.includes(agent.displayName) ? "z-10 scale-105 border-rose-400 shadow-xl shadow-rose-400/20" : "border-white/5 opacity-30 hover:scale-105 hover:opacity-100"}`}
                        title={agent.displayName}
                      >
                        <img
                          src={
                            typeof agentIcons[agent.displayName] === "object"
                              ? agentIcons[agent.displayName]?.src
                              : agentIcons[agent.displayName] ||
                                agent.displayIcon
                          }
                          alt={agent.displayName}
                          className="h-full w-full object-cover"
                        />
                        {formData.secondaryAgents.includes(
                          agent.displayName,
                        ) && (
                          <div className="absolute top-0 right-0 p-1">
                            <div className="h-2 w-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Scouting Report / Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Tell teams about your playstyle, availability, and main agents..."
                  className="h-32 w-full rounded-xl border border-white/10 bg-slate-950 p-4 text-sm text-white transition-all outline-none placeholder:text-slate-700 focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex flex-col items-center gap-6 border-t border-white/5 pt-4">
                <div className="flex w-full items-center gap-4">
                  <button
                    type="submit"
                    disabled={
                      posting ||
                      !formData.mainAgent ||
                      formData.secondaryAgents.length === 0 ||
                      !formData.description.trim()
                    }
                    className="flex flex-1 items-center justify-center gap-3 rounded-2xl border border-transparent bg-rose-600 py-4 text-sm font-black tracking-[0.2em] text-white uppercase shadow-xl shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-[0.98] active:shadow-none disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    {posting ? (
                      <Loader fullScreen={false} size="sm" />
                    ) : (
                      <UserPlus className="h-5 w-5" />
                    )}
                    {userPost
                      ? "Update Scouting Report"
                      : "Publish Scouting Report"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-2xl bg-slate-800 px-8 py-4 text-sm font-black tracking-[0.2em] text-white uppercase transition-all hover:bg-rose-700 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {loading && !valProfile ? (
          <ProfileSkeleton />
        ) : !valProfile ? (
          <div className="group relative mx-auto my-12 max-w-4xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 p-12 text-center shadow-2xl backdrop-blur-xl md:p-20">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-600/10 blur-[120px]" />
            <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-600/5 blur-[120px]" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-8 rounded-[2rem] border border-white/5 bg-slate-950 p-6 shadow-inner">
                <UserPlus className="h-16 w-16 animate-pulse text-rose-500" />
              </div>

              <h2 className="mb-4 text-4xl font-black tracking-tighter text-white uppercase md:text-5xl">
                Complete Your Profile
              </h2>
              <p className="mb-12 max-w-sm text-sm text-slate-400 md:text-base">
                Link your Valorant account to track your stats, join
                tournaments, and appear on the leaderboard.
              </p>

              <form
                onSubmit={handleLinkAccount}
                className="w-full max-w-lg space-y-6"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="md:col-span-3">
                    <label className="mb-2 ml-1 block text-left text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      Riot ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TenZ"
                      value={riotId}
                      onChange={(e) => setRiotId(e.target.value)}
                      className="w-full rounded-2xl border border-white/5 bg-slate-950 px-6 py-4 font-bold text-white transition-all placeholder:text-slate-700 focus:border-rose-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 ml-1 block text-left text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      Tag
                    </label>
                    <input
                      type="text"
                      placeholder="#NA1"
                      value={riotTag}
                      onChange={(e) => setRiotTag(e.target.value)}
                      className="w-full rounded-2xl border border-white/5 bg-slate-950 px-6 py-4 text-center font-black text-white transition-all placeholder:text-slate-700 focus:border-rose-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="mb-2 ml-1 block text-left text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Server Region
                  </label>
                  <div className="group relative">
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-2xl border border-white/5 bg-slate-950 px-6 py-4 font-bold text-white transition-all focus:border-rose-500 focus:outline-none"
                      required
                    >
                      <option value="ap">Asia Pacific (AP)</option>
                      <option value="eu">Europe (EU)</option>
                      <option value="na">North America (NA)</option>
                      <option value="kr">Korea (KR)</option>
                      <option value="br">Brazil (BR)</option>
                      <option value="latam">Latin America (LATAM)</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-6 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-hover:text-white" />
                  </div>
                </div>

                {error && (
                  <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-left text-xs font-bold text-rose-500">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-2xl bg-rose-600 py-5 text-sm font-black text-white shadow-2xl shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <Loader fullScreen={false} size="sm" />
                    ) : (
                      <>
                        <span>Link My Account</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Stats Card */}
            <div className="col-span-2 space-y-6">
              {/* Premium Profile Hero - Redesigned */}
              <div className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-sm transition-all duration-500 hover:border-white/10">
                {/* Immersive Background */}
                <div className="absolute inset-0 overflow-hidden">
                  {cardData?.wideArt ? (
                    <>
                      <img
                        src={cardData.wideArt}
                        className="h-full w-full object-cover opacity-100 transition-transform duration-700 group-hover:scale-105"
                        alt=""
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-blue-500/10" />
                  )}
                </div>

                <div className="relative z-10 flex flex-col items-center gap-10 p-8 md:flex-row md:p-12">
                  {/* Card Display */}
                  <div className="group/card relative">
                    <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-2 border-white/10 shadow-2xl transition-transform duration-500 group-hover/card:scale-105 group-hover/card:-rotate-1 md:h-32 md:w-32">
                      {cardData?.smallArt ? (
                        <img
                          src={cardData?.smallArt}
                          alt="Player Card"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full animate-pulse bg-slate-800" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
                        <div className="rounded-md bg-rose-600/90 px-1.5 py-0.5 text-center text-[8px] font-black text-white">
                          LVL {valProfile.account_level}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="mb-1 flex items-center justify-center gap-2 md:justify-start">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      <span className="text-[8px] font-black tracking-widest text-emerald-500 uppercase">
                        Platform Verified Player
                      </span>
                    </div>
                    <div className="mb-4 flex items-end justify-center gap-1 md:justify-start">
                      <h2 className="text-5xl leading-none font-black tracking-tighter text-white uppercase">
                        {valProfile.name}
                      </h2>
                      <span className="mb-1 text-xl font-bold text-slate-500/50">
                        #{valProfile.tag}
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                      <div className="group/stat flex items-center gap-3 rounded-2xl border border-white/5 bg-black/40 px-5 py-2.5 backdrop-blur-xl transition-all hover:bg-black/60">
                        <Activity className="h-4 w-4 text-rose-500 transition-transform group-hover/stat:scale-110" />
                        <div>
                          <p className="mb-1 text-[9px] leading-none font-black tracking-widest text-slate-500 uppercase">
                            Current Tier
                          </p>
                          <p className="text-xs font-black text-white uppercase">
                            {mmrData?.current_data?.currenttierpatched ||
                              "Unranked"}
                          </p>
                        </div>
                      </div>

                      <div className="group/stat flex items-center gap-3 rounded-2xl border border-white/5 bg-black/40 px-5 py-2.5 backdrop-blur-xl transition-all hover:bg-black/60">
                        <Trophy className="h-4 w-4 text-yellow-500 transition-transform group-hover/stat:scale-110" />
                        <div>
                          <p className="mb-1 text-[9px] leading-none font-black tracking-widest text-slate-500 uppercase">
                            Peak Rating
                          </p>
                          <p className="text-xs font-black text-white uppercase">
                            {mmrData?.highest_rank?.patched_tier || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="group/stat flex items-center gap-3 rounded-2xl border border-white/5 bg-black/40 px-5 py-2.5 backdrop-blur-xl transition-all hover:bg-black/60">
                        <Zap className="h-4 w-4 text-blue-500 transition-transform group-hover/stat:scale-110" />
                        <div>
                          <p className="mb-1 text-[9px] leading-none font-black tracking-widest text-slate-500 uppercase">
                            Region
                          </p>
                          <p className="text-xs font-black text-white uppercase">
                            {valProfile.region?.toUpperCase() ||
                              region?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Intelligence Section - Relocated to Main Column */}
              <div className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 p-8 backdrop-blur-sm">
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-rose-600/5 blur-[100px] transition-all duration-700 group-hover:bg-rose-600/10" />

                <div className="relative z-10">
                  <div className="mb-8">
                    <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-white uppercase">
                      <Trophy className="h-6 w-6 text-rose-500" />
                      Career Overview
                    </h3>
                    <p className="mt-1 ml-10 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
                      Platform Achievements & Earnings
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Primary Stat - Earnings */}
                    <div className="group/box flex flex-col justify-center rounded-3xl border border-white/5 bg-slate-950/80 p-6 transition-all duration-300 hover:border-emerald-500/30 md:col-span-1">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                          Total Earnings
                        </span>
                        <div className="rounded-lg bg-emerald-500/10 p-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                      </div>
                      <div className="font-mono text-3xl font-black tracking-tighter text-white">
                        ₹
                        {(platformProfile?.totalEarnings || 0).toLocaleString()}
                      </div>
                    </div>

                    {/* Secondary Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-3">
                      <div className="group/box rounded-3xl border border-white/5 bg-slate-950/80 p-5 transition-all duration-300 hover:border-amber-500/30">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                            Titles
                          </span>
                          <Crown className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <div className="mt-2 text-2xl leading-none font-black text-white">
                          {platformProfile?.tournamentsWon || 0}
                        </div>
                      </div>

                      <div className="group/box rounded-3xl border border-white/5 bg-slate-950/80 p-5 transition-all duration-300 hover:border-slate-400/30">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                            Finals
                          </span>
                          <Medal className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div className="mt-2 text-2xl leading-none font-black text-white">
                          {platformProfile?.runnerUp || 0}
                        </div>
                      </div>

                      <div className="group/box col-span-2 rounded-3xl border border-white/5 bg-slate-950/80 p-5 transition-all duration-300 hover:border-rose-500/30 md:col-span-1">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                            Victories
                          </span>
                          <Swords className="h-3.5 w-3.5 text-rose-500" />
                        </div>
                        <div className="mt-2 text-2xl leading-none font-black text-white">
                          {platformProfile?.matchesWon || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match History - Redesigned */}
              <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 p-8">
                  <div>
                    <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-white uppercase">
                      <Activity className="h-6 w-6 text-rose-500" />
                      In Game Record
                    </h3>
                    <p className="mt-1 ml-9 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
                      Recent Match Performance
                    </p>
                  </div>

                  <div className="flex rounded-2xl border border-white/5 bg-slate-950/80 p-1.5">
                    {["All", "Competitive", "Unrated"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-xl px-6 py-2 text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
                          activeTab === tab
                            ? "bg-rose-600 text-white shadow-xl shadow-rose-600/20"
                            : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="custom-scrollbar max-h-[800px] space-y-2 overflow-y-auto p-2">
                  {matchesLoading ? (
                    <div className="space-y-4 p-6">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-32 animate-pulse rounded-3xl border border-white/5 bg-slate-950/50"
                        />
                      ))}
                    </div>
                  ) : matches.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="mb-4 inline-flex rounded-full border border-white/5 bg-slate-950 p-6">
                        <Search className="h-10 w-10 text-slate-700" />
                      </div>
                      <p className="text-sm font-black tracking-widest text-slate-500 uppercase">
                        No Missions Recorded
                      </p>
                    </div>
                  ) : (
                    matches
                      .filter(
                        (m) =>
                          activeTab === "All" || m.metadata.mode === activeTab,
                      )
                      .map((match) => {
                        const allPlayers = match.players?.all_players || [];
                        const me = allPlayers.find(
                          (p) => p.puuid === valProfile.puuid,
                        );
                        if (!me) return null;

                        const myTeam = me.team?.toLowerCase();
                        const teamData = match.teams?.[myTeam] || {};
                        const hasWon = teamData.has_won || false;
                        const roundsWon = teamData.rounds_won || 0;
                        const roundsLost = teamData.rounds_lost || 0;
                        const isDraw = roundsWon === roundsLost;

                        // Calculate ACS (Average Combat Score) if available
                        const acs = Math.round(
                          me.stats.score / match.metadata.rounds_played,
                        );

                        return (
                          <div
                            key={match.metadata.matchid}
                            onClick={() => {
                              setSelectedMatch(match);
                              setIsModalOpen(true);
                            }}
                            className="group relative flex cursor-pointer items-stretch gap-6 overflow-hidden rounded-3xl border border-white/5 bg-slate-950/40 p-4 transition-all duration-300 hover:bg-slate-900/60"
                          >
                            {/* Status Edge Glow */}
                            <div
                              className={`absolute inset-y-0 left-0 w-1 ${hasWon ? "bg-emerald-500 shadow-[2px_0_10px_rgba(16,185,129,0.5)]" : isDraw ? "bg-slate-400 shadow-[2px_0_10px_rgba(148,163,184,0.5)]" : "bg-rose-500 shadow-[2px_0_10px_rgba(244,63,94,0.5)]"}`}
                            />

                            {/* Agent Section */}
                            <div className="relative shrink-0">
                              <div
                                className={`h-20 w-20 overflow-hidden rounded-2xl border border-white/10 transition-colors group-hover:border-white/20 md:h-24 md:w-24 ${hasWon ? "bg-emerald-950/20" : isDraw ? "bg-slate-900/40" : "bg-rose-950/20"}`}
                              >
                                <img
                                  src={
                                    typeof agentIcons[me.character] === "object"
                                      ? agentIcons[me.character]?.src
                                      : agentIcons[me.character] ||
                                        me.assets.agent.small
                                  }
                                  alt={me.character}
                                  className="h-full w-full object-cover p-1 transition-transform duration-500 group-hover:scale-110"
                                />
                              </div>
                              <div className="absolute -bottom-2 -left-2 rounded-lg border border-white/10 bg-slate-950 px-2 py-0.5">
                                <span className="text-[9px] font-black text-white">
                                  LVL {me.level}
                                </span>
                              </div>
                            </div>

                            {/* Match Details */}
                            <div className="flex flex-1 flex-col justify-center">
                              <div className="mb-2 flex items-center gap-3">
                                <h4 className="text-lg font-black tracking-tight text-white uppercase transition-colors group-hover:text-rose-500 md:text-xl">
                                  {match.metadata.map}
                                </h4>
                                <span className="rounded-md border border-white/5 bg-white/5 px-2 py-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                  {match.metadata.mode}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                    KDA
                                  </span>
                                  <p className="font-mono text-sm font-black text-white">
                                    {me.stats.kills}{" "}
                                    <span className="font-normal text-slate-600">
                                      /
                                    </span>{" "}
                                    {me.stats.deaths}{" "}
                                    <span className="font-normal text-slate-600">
                                      /
                                    </span>{" "}
                                    {me.stats.assists}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                    ACS
                                  </span>
                                  <p className="font-mono text-sm font-black text-white">
                                    {acs}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Score Section */}
                            <div className="flex flex-col items-end justify-center rounded-2xl border border-white/5 bg-black/20 px-4 md:px-8">
                              <p
                                className={`mb-1 text-[10px] font-black tracking-[0.2em] ${hasWon ? "text-emerald-400" : isDraw ? "text-slate-400" : "text-rose-400"}`}
                              >
                                {hasWon
                                  ? "VICTORY"
                                  : isDraw
                                    ? "DRAW"
                                    : "DEFEAT"}
                              </p>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-white tabular-nums md:text-3xl">
                                  {roundsWon}
                                </span>
                                <span className="text-lg font-bold text-slate-600">
                                  :
                                </span>
                                <span className="text-xl font-bold text-slate-500 tabular-nums">
                                  {roundsLost}
                                </span>
                              </div>
                            </div>

                            {/* Hover Arrow */}
                            <div className="hidden w-12 items-center justify-center text-slate-700 transition-colors group-hover:text-white md:flex">
                              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Stats - Redesigned */}
            <div className="space-y-6">
              {/* Rank Display Card */}
              <div className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 p-8 backdrop-blur-sm transition-all duration-500 hover:border-white/10">
                {/* Background Rank Glow */}
                <div
                  className={`absolute -top-24 -right-24 h-64 w-64 opacity-10 blur-[100px] transition-opacity duration-700 group-hover:opacity-20 ${
                    mmrData?.current_data?.currenttierpatched?.includes(
                      "Platinum",
                    )
                      ? "bg-cyan-500"
                      : mmrData?.current_data?.currenttierpatched?.includes(
                            "Diamond",
                          )
                        ? "bg-purple-500"
                        : mmrData?.current_data?.currenttierpatched?.includes(
                              "Ascendant",
                            )
                          ? "bg-emerald-500"
                          : mmrData?.current_data?.currenttierpatched?.includes(
                                "Immortal",
                              )
                            ? "bg-rose-500"
                            : mmrData?.current_data?.currenttierpatched?.includes(
                                  "Radiant",
                                )
                              ? "bg-yellow-500"
                              : "bg-slate-500"
                  }`}
                />

                <div className="relative z-10">
                  <div className="mb-8 flex items-center justify-between">
                    <h3 className="flex items-center gap-3 text-xs font-black tracking-[0.3em] text-slate-500 uppercase">
                      <Activity className="h-4 w-4" />
                      Rank Intelligence
                    </h3>
                  </div>

                  {mmrData?.current_data?.currenttierpatched ? (
                    <div className="flex flex-col items-center">
                      {/* Strategic Peak Rank Header */}
                      {mmrData?.highest_rank?.patched_tier && (
                        <div className="mb-8 w-full">
                          <div className="group/peak relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-amber-600/5 p-4 transition-all duration-500 hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                            <div className="absolute -top-4 -right-4 opacity-10 transition-opacity group-hover:opacity-20">
                              <Trophy className="h-16 w-16 text-yellow-500" />
                            </div>
                            <div className="relative z-10 flex items-center justify-between">
                              <div>
                                <p className="mb-1 text-[8px] font-black tracking-[0.3em] text-yellow-500/70 uppercase">
                                  Career Achievement
                                </p>
                                <h5 className="flex items-center gap-2 text-sm font-black tracking-tight text-white uppercase">
                                  <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                                  Peak: {mmrData.highest_rank.patched_tier}
                                </h5>
                              </div>
                              <img
                                src={
                                  typeof rankIcons[
                                    mmrData.highest_rank.tier
                                  ] === "object"
                                    ? rankIcons[mmrData.highest_rank.tier]?.src
                                    : rankIcons[mmrData.highest_rank.tier] ||
                                      mmrData.highest_rank.images?.small
                                }
                                alt="Peak Rank"
                                className="h-10 w-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-transform group-hover/peak:scale-110"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="group/rank relative mb-8">
                        <div
                          className={`absolute inset-0 scale-125 rounded-full opacity-20 blur-[40px] transition-all duration-700 ${
                            mmrData.current_data.currenttierpatched?.includes(
                              "Platinum",
                            )
                              ? "bg-cyan-500"
                              : mmrData.current_data.currenttierpatched?.includes(
                                    "Diamond",
                                  )
                                ? "bg-purple-500"
                                : mmrData.current_data.currenttierpatched?.includes(
                                      "Ascendant",
                                    )
                                  ? "bg-emerald-500"
                                  : mmrData.current_data.currenttierpatched?.includes(
                                        "Immortal",
                                      )
                                    ? "bg-rose-500"
                                    : mmrData.current_data.currenttierpatched?.includes(
                                          "Radiant",
                                        )
                                      ? "bg-yellow-500"
                                      : "bg-slate-500"
                          }`}
                        />

                        <img
                          src={
                            typeof rankIcons[
                              mmrData.current_data.currenttier
                            ] === "object"
                              ? rankIcons[mmrData.current_data.currenttier]?.src
                              : rankIcons[mmrData.current_data.currenttier] ||
                                mmrData.current_data.images?.large ||
                                mmrData.current_data.images?.small
                          }
                          alt="Rank"
                          className="relative z-10 h-32 w-32 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform duration-700 group-hover/rank:scale-110"
                        />

                        {mmrData.current_data.mmr_change_to_last_game !==
                          undefined && (
                          <div
                            className={`absolute -right-2 -bottom-1 z-20 rounded-xl border-2 px-2 py-1 text-[9px] font-black shadow-xl transition-all group-hover/rank:-translate-x-1 ${
                              mmrData.current_data.mmr_change_to_last_game >= 0
                                ? "border-emerald-500/50 bg-slate-950 text-emerald-400"
                                : "border-rose-500/50 bg-slate-950 text-rose-400"
                            }`}
                          >
                            {mmrData.current_data.mmr_change_to_last_game >= 0
                              ? "▲"
                              : "▼"}{" "}
                            {Math.abs(
                              mmrData.current_data.mmr_change_to_last_game,
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mb-6 w-full space-y-3 text-center">
                        <div className="pt-1">
                          <p className="mb-2 text-[9px] leading-none font-black tracking-[0.2em] text-slate-500 uppercase">
                            Current Standing
                          </p>
                          <h4 className="mb-4 text-3xl font-black tracking-tighter text-white transition-colors group-hover:text-rose-500">
                            {mmrData.current_data.currenttierpatched}
                          </h4>

                          {/* RR Progress Bar - Correctly associated with Rank */}
                          <div className="space-y-1.5 px-4">
                            <div className="flex items-end justify-between px-1">
                              <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">
                                Rating Progress
                              </span>
                              <p className="text-[10px] font-black text-white tabular-nums">
                                {mmrData.current_data.ranking_in_tier}
                                <span className="ml-0.5 text-[8px] text-slate-500">
                                  RR
                                </span>
                              </p>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950 p-[1px]">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  mmrData.current_data.currenttierpatched?.includes(
                                    "Platinum",
                                  )
                                    ? "bg-cyan-500"
                                    : mmrData.current_data.currenttierpatched?.includes(
                                          "Diamond",
                                        )
                                      ? "bg-purple-500"
                                      : mmrData.current_data.currenttierpatched?.includes(
                                            "Ascendant",
                                          )
                                        ? "bg-emerald-500"
                                        : "bg-rose-500"
                                }`}
                                style={{
                                  width: `${mmrData.current_data.ranking_in_tier}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ELO Performance - High Weight */}
                      <div className="mb-2 grid w-full grid-cols-1 gap-4">
                        <div className="group/elo relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/80 p-6">
                          <div className="absolute top-0 right-0 rotate-12 p-4 opacity-5">
                            <Activity className="h-16 w-16" />
                          </div>
                          <div className="relative z-10">
                            <p className="mb-1.5 text-[9px] font-black tracking-widest text-slate-500 uppercase">
                              Intelligence Score
                            </p>
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono text-4xl font-black tracking-tighter text-white transition-colors group-hover:text-rose-500">
                                {mmrData.current_data.elo}
                              </span>
                              <span className="text-[10px] font-bold tracking-[0.2em] text-slate-600 uppercase">
                                ELO
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : mmrLoading ? (
                    <div className="flex animate-pulse flex-col items-center py-10">
                      <div className="mb-8 h-40 w-40 rounded-full bg-slate-800/50" />
                      <div className="mb-4 h-10 w-48 rounded-xl bg-slate-800/50" />
                      <div className="h-4 w-32 rounded-lg bg-slate-800/50" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                      <img
                        src={
                          typeof rankIcons[0] === "object"
                            ? rankIcons[0]?.src
                            : rankIcons[0]
                        }
                        alt="Unranked"
                        className="mb-6 h-24 w-24 grayscale"
                      />
                      <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                        Rank Unavailable
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Discord Integration Card */}
              <div className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#5865F2]/10 p-8 transition-all duration-500 hover:bg-[#5865F2]/20">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="60"
                    height="60"
                    viewBox="0 0 127.14 96.36"
                    className="fill-white"
                  >
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c1.24-23.23-13.26-47.57-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                  </svg>
                </div>

                <div className="relative z-10">
                  <div className="mb-6">
                    <h3 className="flex items-center gap-3 text-xs font-black tracking-[0.3em] text-[#5865F2] uppercase">
                      Community
                    </h3>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-[#5865F2] p-3 shadow-lg shadow-[#5865F2]/30">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 127.14 96.36"
                        className="fill-white"
                      >
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c1.24-23.23-13.26-47.57-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                      </svg>
                    </div>

                    {discordIdentity ? (
                      <>
                        {discordProfile?.avatar ? (
                          <img
                            src={`https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`}
                            alt="Discord Avatar"
                            className="mb-4 h-16 w-16 rounded-full border-2 border-[#5865F2] shadow-lg"
                          />
                        ) : null}
                        <h4 className="mb-0 px-2 text-xl font-black break-all text-white">
                          {discordProfile?.global_name ||
                            discordProfile?.username ||
                            discordIdentity.providerInfo?.global_name ||
                            discordIdentity.providerInfo?.name ||
                            "Linked User"}
                        </h4>
                        <p className="mb-4 px-2 text-[10px] font-bold tracking-wider text-slate-500">
                          @
                          {discordProfile?.username ||
                            discordIdentity.providerInfo?.username ||
                            discordIdentity.providerEmail?.split("@")[0]}
                        </p>
                        <p className="mb-3 flex items-center gap-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                          <CheckCircle className="h-3 w-3" />
                          Linked Successfully
                        </p>
                        <button
                          onClick={async () => {
                            try {
                              await unlinkDiscord(discordIdentity.$id);
                              setDiscordIdentity(null);
                              notify("Discord account unlinked successfully.");
                            } catch (e) {
                              notify("Failed to unlink Discord.", "error");
                            }
                          }}
                          className="text-[10px] font-black tracking-widest text-slate-500 uppercase transition-all hover:text-rose-500"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <>
                        <h4 className="mb-2 text-lg font-black text-white">
                          Connect Discord
                        </h4>
                        <p className="mb-6 text-xs text-slate-400">
                          Link your account to verify your identity and find
                          teammates.
                        </p>
                        <button
                          onClick={loginWithDiscord}
                          className="group relative flex items-center gap-2 rounded-xl bg-[#5865F2] px-6 py-3 text-xs font-black tracking-wider text-white uppercase transition-all hover:bg-[#4752C4] hover:shadow-lg hover:shadow-[#5865F2]/20"
                        >
                          Connect Now
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Team Finder Ad - Relocated below Rank */}
              {!showForm && userPost && (
                <div className="animate-in fade-in slide-in-from-top-4 rounded-2xl border border-rose-500/10 bg-rose-600/5 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-rose-500/10 p-2.5">
                      <UserPlus className="h-5 w-5 text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm leading-none font-bold text-white">
                          Team Finder Ad
                        </h3>
                        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-white uppercase">
                          LIVE
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                        Listed as {userPost.role}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (userPost) {
                          setFormData({
                            role: userPost.role,
                            description: userPost.description,
                            mainAgent: userPost.mainAgent || "",
                            secondaryAgents: userPost.secondaryAgents || [],
                          });
                        }
                        setShowForm(true);
                      }}
                      className="rounded-lg bg-slate-800 px-3 py-2 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[10px] font-black tracking-widest text-rose-500 uppercase transition-all hover:bg-rose-500/20"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <MatchDetailsModal
        match={selectedMatch}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        puuid={valProfile?.puuid}
      />

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="animate-in fade-in fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm duration-300">
          <div className="animate-in zoom-in-95 w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl duration-300">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full border border-rose-500/20 bg-rose-500/10 p-4">
                <AlertCircle className="h-8 w-8 text-rose-500" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-black tracking-tight text-white uppercase">
                  Are you sure?
                </h3>
                <p className="text-sm text-slate-400">
                  This will permanently remove your Team Finder listing. You can
                  always create a new one later.
                </p>
              </div>
              <div className="mt-4 flex w-full gap-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-black tracking-widest text-white uppercase transition-all hover:bg-rose-700 active:scale-95"
                >
                  Remove
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 rounded-xl bg-slate-800 py-3 text-xs font-black tracking-widest text-white uppercase transition-all hover:bg-slate-700 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {notification.show && (
        <div className="animate-in slide-in-from-bottom-5 fixed bottom-8 left-1/2 z-[300] -translate-x-1/2 duration-500">
          <div
            className={`flex items-center gap-3 rounded-2xl border px-6 py-4 shadow-2xl backdrop-blur-xl ${
              notification.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : notification.type === "error"
                  ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                  : "border-white/10 bg-slate-800/80 text-white"
            }`}
          >
            {notification.type === "success" && (
              <CheckCircle className="h-5 w-5" />
            )}
            {notification.type === "error" && <XCircle className="h-5 w-5" />}
            {notification.type === "info" && <Info className="h-5 w-5" />}
            <span className="pt-0.5 text-sm leading-none font-black tracking-widest uppercase">
              {notification.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
