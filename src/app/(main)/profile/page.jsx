"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAccount, getMMR, getMatches, getPlayerCard } from "@/lib/valorant";
import { saveUserProfile } from "@/lib/users";
import { account } from "@/lib/appwrite";
import {
  User,
  Trophy,
  Activity,
  TrendingUp,
  UserPlus,
  Sword,
  Shield,
  Zap,
  Brain,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import MatchDetailsModal from "@/components/MatchDetailsModal";
import Link from "next/link";
import { getUserFreeAgentPost, updateFreeAgentPost } from "@/lib/players";
import { checkDiscordMembership } from "@/lib/discord";
import Loader from "@/components/Loader";
import ProfileSkeleton from "@/components/ProfileSkeleton";
import { useProfileData, useScoutingReport } from "./hooks";
import {
  ProfileHero,
  CareerOverview,
  MatchHistory,
  RankIntelligence,
  DiscordCard,
  ScoutingReportModal,
  LinkAccountForm,
} from "./components";

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

  // Use Custom Hooks
  const {
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
    loading: profileLoading,
    setLoading,
    mmrLoading,
    matchesLoading,
    refetchMatches,
    riotId,
    setRiotId,
    riotTag,
    setRiotTag,
    region,
    setRegion,
    userPost,
    setUserPost,
    hasLinkedAccount,
    setHasLinkedAccount,
    profileFetchFailed,
  } = useProfileData(user, authLoading);

  // LocalStorage key constant (must match the one in useProfileData)
  const LINKED_ACCOUNT_KEY = "vra_account_linked";

  // Custom Notification State
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const notify = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  const {
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
  } = useScoutingReport({ user, userPost, setUserPost, notify, mmrData });

  const [linkingLoading, setLinkingLoading] = useState(false); // For local actions like linking
  const [error, setError] = useState(null);

  // Modal State
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("All");

  // Discord State
  const [discordIdentity, setDiscordIdentity] = useState(null);
  const [discordProfile, setDiscordProfile] = useState(null);
  const [isInDiscordServer, setIsInDiscordServer] = useState(null);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const membershipCheckedRef = useRef(false); // Prevent duplicate API calls

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

            // Check Discord server membership (only if not already checked)
            if (!membershipCheckedRef.current) {
              membershipCheckedRef.current = true;
              setCheckingMembership(true);
              try {
                const { isMember } = await checkDiscordMembership(
                  session.providerAccessToken,
                );
                setIsInDiscordServer(isMember);
              } catch (e) {
                console.error("Failed to check Discord membership:", e);
                membershipCheckedRef.current = false; // Allow retry on error
              } finally {
                setCheckingMembership(false);
              }
            }
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

              // Also sync to Player Finder post if it exists
              try {
                const userPost = await getUserFreeAgentPost(user.$id);
                if (userPost) {
                  await updateFreeAgentPost(userPost.$id, {
                    discordTag: discordTag,
                    discordUsername: displayName,
                  });
                }
              } catch (syncErr) {
                console.error(
                  "Failed to sync Discord to Player Finder:",
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
      // Check for Discord Identity
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

  // Fetch Discord Profile when Identity is found (membership check is done in checkDiscordSession)
  useEffect(() => {
    if (discordIdentity && discordIdentity.providerAccessToken) {
      const accessToken = discordIdentity.providerAccessToken;

      // Fetch Discord Profile
      fetch("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setDiscordProfile(data);
        })
        .catch((err) => console.error("Failed to fetch Discord profile:", err));

      // Only check membership if it hasn't been checked yet (prevents duplicate calls)
      if (
        !membershipCheckedRef.current &&
        isInDiscordServer === null &&
        !checkingMembership
      ) {
        membershipCheckedRef.current = true;
        setCheckingMembership(true);
        checkDiscordMembership(accessToken)
          .then(({ isMember }) => {
            setIsInDiscordServer(isMember);
          })
          .catch((err) => {
            console.error("Failed to check Discord membership:", err);
            membershipCheckedRef.current = false; // Allow retry on error
          })
          .finally(() => {
            setCheckingMembership(false);
          });
      }
    }
  }, [discordIdentity]);

  const handleLinkAccount = async (e) => {
    e.preventDefault();
    setLinkingLoading(true);
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

        // Match history will be handled by the useProfileData hook's
        // background prefetch loop once the profile is set.

        // 3. Save to Appwrite
        const profileData = {
          puuid: accountData.data.puuid,
          email: user.email,
          ingameName: accountData.data.name,
          tag: accountData.data.tag,
          region: region, // Save the manually selected region
          card: accountData.data.card || null, // Save card ID for leaderboard
          createdTimestamp: new Date().toISOString(),
          totalEarnings: 0,
          tournamentsWon: 0,
          matchesWon: 0,
          runnerUp: 0,
        };

        try {
          console.log("Saving profile to Appwrite:", profileData);
          const savedProfile = await saveUserProfile(user.$id, profileData);
          console.log("Profile saved successfully:", savedProfile);
          setPlatformProfile(profileData);

          // Mark as linked in localStorage so form never shows again
          if (typeof window !== "undefined") {
            localStorage.setItem(`${LINKED_ACCOUNT_KEY}_${user.$id}`, "true");
            setHasLinkedAccount(true);
          }
        } catch (saveError) {
          console.error("Failed to save profile to Appwrite:", saveError);
          setError("Failed to save profile. Please try again.");
          return;
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLinkingLoading(false);
    }
  };

  if (authLoading || !user) {
    return <Loader />;
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden px-4 py-4 pt-24 text-slate-200 md:px-12 md:py-12 md:pt-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 px-1">
          <div className="flex min-w-0 flex-col">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
              <span className="text-[10px] font-black tracking-[0.4em] text-rose-500 uppercase">
                Operations Center
              </span>
            </div>
            <h1 className="group relative cursor-default text-3xl font-black tracking-tight whitespace-nowrap text-white uppercase selection:bg-rose-500 selection:text-white">
              My Profile
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="h-0.5 w-8 rounded-full bg-rose-600" />
                <div className="h-0.5 w-1.5 rounded-full bg-slate-800" />
              </div>
            </h1>
          </div>
          <div className="flex items-center justify-end gap-4 md:w-auto">
            {valProfile && (!userPost || showForm) && (
              <button
                onClick={() => setShowForm(!showForm)}
                className={`flex w-auto items-center gap-1.5 rounded-lg px-3 py-1.5 text-[9px] font-black tracking-widest uppercase shadow-lg transition-all md:gap-2 md:rounded-xl md:px-6 md:py-2.5 md:text-xs ${showForm ? "border border-white/5 bg-slate-800 text-white" : "bg-rose-600 text-white shadow-rose-600/20 hover:bg-rose-700"}`}
              >
                {showForm ? (
                  "Cancel"
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Looking for Team</span>
                    <span className="inline sm:hidden">Find Team</span>
                  </>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Player Finder Form Modal */}
        <ScoutingReportModal
          isOpen={showForm && !!valProfile}
          onClose={() => setShowForm(false)}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handlePost}
          userPost={userPost}
          mmrData={mmrData}
          availableAgents={availableAgents}
          posting={posting}
        />

        {profileLoading && !valProfile ? (
          <ProfileSkeleton />
        ) : !valProfile && hasLinkedAccount ? (
          // User has previously linked but profile fetch failed - show error state, not the form
          <div className="group relative mx-auto my-8 max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 p-8 text-center shadow-2xl backdrop-blur-xl md:p-10">
            <div className="absolute top-0 right-0 h-48 w-48 translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-600/10 blur-[80px]" />
            <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-600/5 blur-[80px]" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-6 rounded-2xl border border-white/5 bg-slate-950 p-4 shadow-inner">
                <AlertCircle className="h-10 w-10 text-amber-500" />
              </div>
              <h2 className="mb-2 text-xl font-black tracking-tighter text-white uppercase md:text-2xl">
                Loading Your Profile
              </h2>
              <p className="mb-6 max-w-xs text-xs text-slate-400 md:text-sm">
                {profileFetchFailed
                  ? "We couldn't load your profile due to a network issue. Please check your connection and try again."
                  : "Please wait while we fetch your profile data..."}
              </p>
              {profileFetchFailed && (
                <button
                  onClick={() => window.location.reload()}
                  className="group relative overflow-hidden rounded-xl bg-rose-600 px-6 py-3 text-xs font-black text-white shadow-xl shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5" />
                    Retry Loading
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : !valProfile ? (
          <LinkAccountForm
            riotId={riotId}
            setRiotId={setRiotId}
            riotTag={riotTag}
            setRiotTag={setRiotTag}
            region={region}
            setRegion={setRegion}
            onSubmit={handleLinkAccount}
            loading={linkingLoading}
            error={error}
          />
        ) : (
          <div className="grid w-full max-w-full gap-6 md:grid-cols-3">
            {/* Main Stats Card */}
            <div className="order-1 col-span-1 min-w-0 space-y-6 md:order-none md:col-span-2">
              {/* Premium Profile Hero */}
              <ProfileHero
                valProfile={valProfile}
                cardData={cardData}
                mmrData={mmrData}
                region={region}
              />
            </div>

            {/* Career Overview + Match History - order-3 on mobile */}
            <div className="order-3 col-span-1 min-w-0 space-y-6 md:order-none md:col-span-2">
              {/* Platform Intelligence Section */}
              <CareerOverview platformProfile={platformProfile} />

              {/* Match History */}
              <MatchHistory
                matches={matches}
                matchesLoading={matchesLoading}
                valProfile={valProfile}
                onMatchClick={(match) => {
                  setSelectedMatch(match);
                  setIsModalOpen(true);
                }}
                onRefetch={refetchMatches}
              />
            </div>

            {/* Sidebar Stats */}
            <div className="order-2 space-y-6 md:order-none md:col-start-3 md:row-span-2 md:row-start-1">
              {/* Rank Display Card */}
              <RankIntelligence mmrData={mmrData} mmrLoading={mmrLoading} />

              {/* Discord Integration Card */}
              <DiscordCard
                discordIdentity={discordIdentity}
                discordProfile={discordProfile}
                isInServer={isInDiscordServer}
                checkingMembership={checkingMembership}
                onUnlink={async () => {
                  try {
                    await unlinkDiscord(discordIdentity.$id);
                    setDiscordIdentity(null);
                    setIsInDiscordServer(null);
                    notify("Discord account unlinked successfully.");
                  } catch (e) {
                    notify("Failed to unlink Discord.", "error");
                  }
                }}
                onConnect={loginWithDiscord}
              />

              {/* Active Player Finder Ad - Relocated below Rank */}
              {!showForm && userPost && (
                <div className="animate-in fade-in slide-in-from-top-4 rounded-2xl border border-rose-500/10 bg-rose-600/5 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-rose-500/10 p-2.5">
                      <UserPlus className="h-5 w-5 text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm leading-none font-bold text-white">
                          Scouting Report
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
                  This will permanently remove your Player Finder listing. You
                  can always create a new one later.
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
