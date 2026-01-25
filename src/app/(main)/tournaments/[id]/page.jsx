"use client";
import { useEffect, useState, use } from "react";
import {
  getTournament,
  registerForTournament,
  getRegistrations,
  deleteTournament,
  checkInForTournament,
} from "@/lib/tournaments";
import {
  createPaymentRequest,
  getPaymentRequestsForUser,
} from "@/lib/payment_requests";
import {
  deleteTournamentChannelsAction,
  addMemberToTournamentChannelsAction,
} from "@/app/actions/discord";
import { getMatches } from "@/lib/brackets";
import CompleteBracket from "@/components/CompleteBracket";
import CompleteStandings from "@/components/CompleteStandings";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile } from "@/lib/users";
import { getAccount } from "@/lib/valorant";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Trophy,
  Users,
  AlertCircle,
  CheckCircle,
  Trash2,
  UserCheck,
  UserX,
  ShieldCheck,
  ChevronLeft,
  ExternalLink,
  Info,
  RotateCcw,
} from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import Loader from "@/components/Loader";
import DeathmatchStandings from "@/components/DeathmatchStandings";
import UPIPaymentModal from "@/components/UPIPaymentModal";
import { account } from "@/lib/appwrite";
import { checkDiscordMembership, DISCORD_INVITE_URL } from "@/lib/discord";
const RichText = ({ text }) => {
  if (!text) return null;

  // Group lines into paragraphs/sections
  const lines = text.split("\n");

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Check for bullet points
        const isBullet =
          trimmed.startsWith("•") ||
          trimmed.startsWith("- ") ||
          trimmed.startsWith("* ");
        let content = isBullet ? trimmed.replace(/^[•\-*]\s*/, "") : trimmed;

        // Handle bold text within the line
        const parts = content.split(/(\*\*.*?\*\*)/g);
        const formattedContent = parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <span key={j} className="font-black text-white">
                {part.slice(2, -2)}
              </span>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div
              key={i}
              className="group flex items-start gap-3 pl-2 md:gap-4 md:pl-4"
            >
              <div className="mt-2 h-1 w-1 shrink-0 rounded-full bg-rose-500 transition-transform group-hover:scale-150" />
              <p className="text-xs leading-relaxed opacity-80 transition-opacity group-hover:opacity-100 md:text-sm">
                {formattedContent}
              </p>
            </div>
          );
        }

        // Check if line is a header (starts with all caps keyword or is all caps)
        const isHeader =
          !isBullet &&
          ((trimmed === trimmed.toUpperCase() && trimmed.length > 3) ||
            /^[A-Z\s]{4,}:/.test(trimmed));

        return (
          <p
            key={i}
            className={`text-xs leading-relaxed transition-all md:text-sm ${
              isHeader
                ? "mb-1 inline-block border-b border-white/5 pt-4 pb-2 text-[10px] font-black tracking-[0.15em] text-white uppercase"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            {formattedContent}
          </p>
        );
      })}
    </div>
  );
};

export default function TournamentDetailPage({ params }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState([
    { name: "", tag: "", verified: false, loading: false },
    { name: "", tag: "", verified: false, loading: false },
    { name: "", tag: "", verified: false, loading: false },
    { name: "", tag: "", verified: false, loading: false },
    { name: "", tag: "", verified: false, loading: false },
  ]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null);

  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Discord membership check
  const [isInDiscord, setIsInDiscord] = useState(null); // null = loading, true/false = result
  const [hasDiscordLinked, setHasDiscordLinked] = useState(null); // null = loading, true/false = result
  const [checkingDiscord, setCheckingDiscord] = useState(false);

  // Helper to create a map of ID -> Participant Name
  const parseMetadata = (metadata) => {
    try {
      return typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    } catch (e) {
      return null;
    }
  };

  const parsePrizes = (prizes) => {
    try {
      return typeof prizes === "string" ? JSON.parse(prizes) : [];
    } catch (e) {
      return [];
    }
  };

  const participantMap = registrations
    ? registrations.reduce((acc, r) => {
        acc[r.$id] = r.teamName
          ? { name: r.teamName }
          : r.metadata
            ? { name: parseMetadata(r.metadata)?.playerName || "Unknown" }
            : { name: "Player" };
        return acc;
      }, {})
    : {};

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch Tournament details first (usually public)
        const tData = await getTournament(id);

        // 2. Fetch Registrations and Matches (might be restricted)
        let regs = { documents: [] };
        let matchData = [];

        try {
          const [r, m] = await Promise.all([
            getRegistrations(id),
            getMatches(id),
          ]);
          regs = r;
          matchData = m;
        } catch (secondaryError) {
          console.warn(
            "Failed to load registrations/matches (likely permission denied):",
            secondaryError,
          );
          // We continue with empty regs/matches to at least show the tournament page
        }

        setTournament(tData);
        setRegistrations(regs.documents);
        setMatches(matchData);

        if (user) {
          try {
            const [profile, payReq] = await Promise.all([
              getUserProfile(user.$id),
              getPaymentRequestsForUser(id, user.$id),
            ]);
            setUserProfile(profile);
            setPaymentRequest(payReq);
          } catch (profileError) {
            console.warn(
              "Failed to load user profile or payment request:",
              profileError,
            );
          }
        }
      } catch (error) {
        console.error("Failed to load tournament", error);
        // Demo Fallback
        setTournament({
          $id: id,
          name: "Demo Tournament",
          date: new Date(Date.now() + 86400000).toISOString(),
          prizePool: "$1,000",
          maxTeams: 16,
          gameType: "5v5",
          status: "scheduled",
          description:
            "This is a demo tournament description since we couldn't connect to the database.",
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, user]);

  // Check Discord membership function (can be called manually)
  const recheckDiscord = async () => {
    if (!user) {
      setIsInDiscord(null);
      setHasDiscordLinked(null);
      return;
    }

    setCheckingDiscord(true);
    try {
      const session = await account.getSession("current");
      if (session?.provider === "discord" && session?.providerAccessToken) {
        setHasDiscordLinked(true);
        const { isMember } = await checkDiscordMembership(
          session.providerAccessToken,
        );
        setIsInDiscord(isMember);
      } else {
        // User is logged in but not via Discord or no Discord linked
        // Check if they have Discord identity linked
        try {
          const identities = await account.listIdentities();
          const discord = identities.identities?.find(
            (id) => id.provider === "discord",
          );
          if (discord?.providerAccessToken) {
            setHasDiscordLinked(true);
            const { isMember } = await checkDiscordMembership(
              discord.providerAccessToken,
            );
            setIsInDiscord(isMember);
          } else {
            setHasDiscordLinked(false); // No Discord linked at all
            setIsInDiscord(false);
          }
        } catch (e) {
          setHasDiscordLinked(false);
          setIsInDiscord(false);
        }
      }
    } catch (e) {
      console.error("Discord check failed:", e);
      setHasDiscordLinked(false);
      setIsInDiscord(false);
    } finally {
      setCheckingDiscord(false);
    }
  };

  // Check Discord membership when user is logged in
  useEffect(() => {
    recheckDiscord();
  }, [user]);

  const verifyMember = async (index) => {
    const member = members[index];
    if (!member.name || !member.tag) return;

    const newMembers = [...members];
    newMembers[index].loading = true;
    setMembers(newMembers);

    try {
      // Tag needs to be handled without the # if the input includes it, or just pass it as is.
      // Usually its Name + Tag (e.g. TenZ #NA1)
      const cleanTag = member.tag.startsWith("#")
        ? member.tag.substring(1)
        : member.tag;
      await getAccount(member.name, cleanTag);
      newMembers[index].verified = true;
      newMembers[index].tag = cleanTag; // Normalize tag
    } catch (err) {
      alert(`Account ${member.name}#${member.tag} not found!`);
      newMembers[index].verified = false;
    } finally {
      newMembers[index].loading = false;
      setMembers([...newMembers]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (tournament.gameType === "5v5") {
      if (!teamName) {
        setError("Team name is required");
        return;
      }
      const unverified = members.find((m) => !m.verified);
      if (unverified) {
        setError("Please verify all team members first");
        return;
      }

      // Check for duplicate players
      const uniqueTags = new Set(
        members.map((m) => `${m.name.toLowerCase()}#${m.tag.toLowerCase()}`),
      );
      if (uniqueTags.size !== members.length) {
        setError("All team members must be unique.");
        return;
      }
    } else if (!userProfile) {
      setError(
        "Please link your Valorant account in your profile first to register for DM.",
      );
      return;
    }

    setError(null);

    // Prepare metadata for registration
    const metadata = {
      members:
        tournament.gameType === "5v5"
          ? members.map((m) => ({ name: m.name, tag: m.tag }))
          : null,
      playerName:
        tournament.gameType !== "5v5"
          ? `${userProfile.ingameName}#${userProfile.tag}`
          : null,
      playerCard: userProfile?.card || null,
      puuid: userProfile?.puuid || null,
    };

    const registrationData = {
      name: tournament.gameType === "5v5" ? teamName : userProfile.ingameName,
      metadata,
    };

    // Check if tournament has entry fee
    const entryFee = parseFloat(tournament.entryFee) || 0;
    if (entryFee > 0) {
      // Show payment modal
      setPendingPaymentData(registrationData);
      setShowPaymentModal(true);
    } else {
      // Free tournament - register directly
      await completeRegistration(registrationData, null, "free");
    }
  };

  const completeRegistration = async (
    registrationData,
    transactionId,
    paymentStatus = "pending",
  ) => {
    setRegistering(true);
    try {
      await registerForTournament(id, user.$id, registrationData.name, {
        metadata: JSON.stringify(registrationData.metadata),
        transactionId: transactionId || null,
        paymentStatus: paymentStatus,
      });
      setSuccess(true);
      setShowPaymentModal(false);
      setPendingPaymentData(null);

      // Auto-add to Discord Channels (if applicable)
      if (
        userProfile?.discordId &&
        (tournament.discordChannelId || tournament.discordVoiceChannelId)
      ) {
        try {
          await addMemberToTournamentChannelsAction(
            [tournament.discordChannelId, tournament.discordVoiceChannelId],
            userProfile.discordId,
          );
        } catch (discordErr) {
          console.warn("Failed to add user to discord channels:", discordErr);
        }
      }

      // Refresh registrations
      const regs = await getRegistrations(id);
      setRegistrations(regs.documents);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handlePaymentComplete = async (transactionId) => {
    if (!pendingPaymentData) return;
    setRegistering(true);
    try {
      await createPaymentRequest(
        id,
        user.$id,
        pendingPaymentData.name,
        pendingPaymentData.metadata,
        transactionId,
      );
      setSuccess(true);
      setShowPaymentModal(false);
      setPendingPaymentData(null);
      // Refresh payment request
      const payReq = await getPaymentRequestsForUser(id, user.$id);
      setPaymentRequest(payReq);
    } catch (err) {
      setError(err.message);
      // alert(err.message); // Removed in favor of inline modal error
    } finally {
      setRegistering(false);
    }
  };

  const handleRetryPayment = () => {
    if (!paymentRequest) return;
    try {
      const meta = JSON.parse(paymentRequest.metadata);
      setPendingPaymentData({
        name: paymentRequest.teamName,
        metadata: meta,
      });
      setShowPaymentModal(true);
    } catch (e) {
      console.error("Failed to parse metadata for retry", e);
      alert(
        "Could not load previous details. Please refresh and try registering again.",
      );
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    if (
      !confirm(
        "Are you sure you want to delete this tournament? This action cannot be undone.",
      )
    )
      return;

    setDeleting(true);
    try {
      // 1. Delete Discord Channels if they exist
      if (tournament.discordChannelId || tournament.discordVoiceChannelId) {
        try {
          const result = await deleteTournamentChannelsAction([
            tournament.discordChannelId,
            tournament.discordVoiceChannelId,
          ]);
          if (result && result.error) {
            const proceed = confirm(
              `Discord Channel Deletion Failed: ${result.error}\n\nDo you want to delete the tournament anyway? (Channels will remain manually)`,
            );
            if (!proceed) {
              setDeleting(false);
              return;
            }
          }
        } catch (discordErr) {
          console.warn("Failed to delete discord channels:", discordErr);
          // Proceed anyway
        }
      }

      // 2. Delete from DB
      await deleteTournament(id);
      router.push("/tournaments");
    } catch (err) {
      console.error("Failed to delete tournament", err);
      alert("Failed to delete tournament");
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!tournament)
    return (
      <div className="p-8 text-center text-white">Tournament not found</div>
    );

  const userRegistration = registrations.find((r) => r.userId === user?.$id);
  const isRegistered = !!userRegistration;
  const isCheckedIn = userRegistration?.checkedIn;
  const isPaymentPending =
    !isRegistered && paymentRequest?.paymentStatus === "pending";
  const isPaymentRejected =
    !isRegistered && paymentRequest?.paymentStatus === "rejected";
  const isFull = registrations.length >= tournament.maxTeams;

  // Check-in logic: Use specific checkInStart time if available
  const now = new Date();
  const checkInTime = new Date(tournament.checkInStart || tournament.date);
  const canCheckIn = now >= checkInTime;

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await checkInForTournament(userRegistration.$id);

      // Failsafe: Try to add to Discord again (in case they joined server late)
      if (
        userProfile?.discordId &&
        (tournament.discordChannelId || tournament.discordVoiceChannelId)
      ) {
        try {
          await addMemberToTournamentChannelsAction(
            [tournament.discordChannelId, tournament.discordVoiceChannelId],
            userProfile.discordId,
          );
        } catch (e) {
          console.warn("Discord Add Retry Skipped");
        }
      }

      // Refresh data
      const regs = await getRegistrations(id);
      setRegistrations(regs.documents);
    } catch (e) {
      alert("Check-in failed: " + e.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const scrollToBracket = () => {
    const element = document.getElementById(
      tournament.gameType === "Deathmatch"
        ? "tournament-standings"
        : "tournament-map",
    );
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Header - Responsive */}
      <section className="relative h-[32vh] min-h-[240px] w-full overflow-hidden border-b border-white/5 pt-14 md:h-[45vh] md:min-h-[400px] md:pt-16">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2000&auto=format&fit=crop"
            alt="Operations Center"
            className="h-full w-full translate-y-[-10%] scale-105 object-cover opacity-40 transition-transform duration-700 hover:scale-100"
          />
          {/* Tactical Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-20 container mx-auto flex h-full flex-col justify-end px-4 pb-8 md:px-6 md:pb-16">
          <div className="max-w-5xl space-y-4 md:space-y-8">
            <div className="space-y-2 md:space-y-4">
              <p className="pl-1 text-[10px] font-black tracking-[0.3em] text-rose-500/80 uppercase md:text-xs md:tracking-[0.4em]">
                Tournament Entry
              </p>
              <h1 className="special-font text-2xl leading-[0.9] font-black tracking-tight text-white uppercase drop-shadow-2xl filter sm:text-3xl md:text-6xl lg:text-8xl">
                {tournament.name}
              </h1>
            </div>

            {/* Status Badges - Scrollable on mobile */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-black tracking-[0.15em] uppercase shadow-lg backdrop-blur-md md:gap-2 md:px-4 md:py-1.5 md:text-[10px] md:tracking-[0.2em] ${
                  tournament.status === "scheduled" || !tournament.status
                    ? "border border-cyan-500/30 bg-cyan-500/20 text-cyan-400 shadow-cyan-500/10"
                    : tournament.status === "ongoing"
                      ? "animate-pulse border border-amber-500/30 bg-amber-500/20 text-amber-400 shadow-amber-500/20"
                      : tournament.status === "completed"
                        ? "border border-rose-500/30 bg-rose-500/20 text-rose-400"
                        : "border border-slate-500/30 bg-slate-500/20 text-slate-400"
                }`}
              >
                <div
                  className={`h-1 w-1 rounded-full md:h-1.5 md:w-1.5 ${
                    tournament.status === "scheduled" || !tournament.status
                      ? "bg-cyan-400"
                      : tournament.status === "ongoing"
                        ? "bg-amber-400"
                        : tournament.status === "completed"
                          ? "bg-rose-400"
                          : "bg-slate-400"
                  }`}
                />
                <span className="hidden sm:inline">
                  {tournament.status === "scheduled" || !tournament.status
                    ? "SCHEDULED / UPCOMING"
                    : tournament.status === "ongoing"
                      ? "ONGOING (LIVE)"
                      : "COMPLETED / PAST"}
                </span>
                <span className="sm:hidden">
                  {tournament.status === "scheduled" || !tournament.status
                    ? "UPCOMING"
                    : tournament.status === "ongoing"
                      ? "LIVE"
                      : "COMPLETED"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/20 px-2.5 py-1 text-[8px] font-black tracking-[0.15em] text-rose-400 uppercase shadow-lg backdrop-blur-md md:gap-2 md:px-4 md:py-1.5 md:text-[10px] md:tracking-[0.2em]">
                <Trophy className="h-2.5 w-2.5 md:h-3 md:w-3" />
                {tournament.gameType}
              </div>

              {tournament.bracketGenerated && (
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-[8px] font-black tracking-[0.15em] text-emerald-400 uppercase shadow-lg backdrop-blur-md md:gap-2 md:px-4 md:py-1.5 md:text-[10px] md:tracking-[0.2em]">
                  <div className="h-1 w-1 animate-pulse rounded-full bg-emerald-400 md:h-1.5 md:w-1.5" />
                  {tournament.gameType === "Deathmatch"
                    ? "Standings Live"
                    : "Bracket Live"}
                </div>
              )}
            </div>
          </div>

          {/* Scroll Indicator - Hidden on mobile */}
          <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-bounce flex-col items-center gap-2 opacity-30 md:flex">
            <div className="flex h-8 w-5 justify-center rounded-full border-2 border-white pt-2">
              <div className="h-2 w-1 rounded-full bg-white" />
            </div>
            <span className="text-[8px] font-black tracking-[0.3em] text-white uppercase">
              Scroll
            </span>
          </div>
        </div>
      </section>

      <div className="relative z-30 mx-auto -mt-6 max-w-6xl px-4 py-6 md:-mt-10 md:px-6 md:py-12">
        <button
          onClick={() => router.back()}
          className="group mt-2 mb-4 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase transition-all hover:text-white md:mt-5 md:mb-5"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="hidden sm:inline">Back to Tournaments</span>
          <span className="sm:hidden">Back</span>
        </button>

        {/* Main Grid - Stack on mobile */}
        <div className="grid gap-6 md:gap-12 lg:grid-cols-3">
          {/* Main Content */}
          <div className="order-2 space-y-6 md:space-y-8 lg:order-1 lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl md:p-8">
              {/* Tab Navigation - Scrollable */}
              <div className="mb-6 flex items-center justify-between gap-2 overflow-x-auto border-b border-white/10 [-ms-overflow-style:'none'] [scrollbar-width:'none'] md:mb-8 [&::-webkit-scrollbar]:hidden">
                <div className="flex shrink-0 gap-3 md:gap-4">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`pb-3 text-[10px] font-black tracking-[0.15em] whitespace-nowrap uppercase transition-all md:pb-4 md:text-xs md:tracking-[0.2em] ${activeTab === "overview" ? "border-b-2 border-rose-500 text-white" : "text-slate-500 hover:text-white"}`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("participants")}
                    className={`pb-3 text-[10px] font-black tracking-[0.15em] whitespace-nowrap uppercase transition-all md:pb-4 md:text-xs md:tracking-[0.2em] ${activeTab === "participants" ? "border-b-2 border-rose-500 text-white" : "text-slate-500 hover:text-white"}`}
                  >
                    Participants
                  </button>
                </div>

                {tournament.bracketGenerated && (
                  <button
                    onClick={scrollToBracket}
                    className="group mb-3 flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-[8px] font-black tracking-widest whitespace-nowrap text-rose-500 uppercase shadow-lg shadow-rose-500/5 transition-all hover:bg-rose-500 hover:text-white md:mb-4 md:gap-2 md:rounded-xl md:px-4 md:py-2 md:text-[10px]"
                  >
                    <span className="hidden sm:inline">
                      {tournament.gameType === "Deathmatch"
                        ? "View Standings"
                        : "View Tournament Map"}
                    </span>
                    <span className="sm:hidden">
                      {tournament.gameType === "Deathmatch"
                        ? "Standings"
                        : "Bracket"}
                    </span>
                    <ChevronLeft className="h-3 w-3 -rotate-90 transition-transform group-hover:translate-y-0.5" />
                  </button>
                )}
              </div>

              {activeTab === "overview" && (
                <div className="space-y-8 text-slate-300 md:space-y-12">
                  <div className="space-y-4 md:space-y-6">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-white md:text-xl">
                      <div className="h-1.5 w-1.5 rounded-full bg-rose-500 md:h-2 md:w-2" />
                      Tournament Brief
                    </h2>
                    <div className="mt-2">
                      <RichText text={tournament.description} />
                      {!tournament.description && (
                        <p className="text-xs italic opacity-50 md:text-sm">
                          No description provided for this tournament.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 border-t border-white/5 pt-6 sm:grid-cols-2 md:gap-8 md:pt-8">
                    <div className="space-y-3 md:space-y-4">
                      <h3 className="text-[10px] font-black tracking-[0.2em] text-rose-500 uppercase">
                        Event Format
                      </h3>
                      <ul className="space-y-2 md:space-y-3">
                        <li className="flex items-center gap-2 text-xs opacity-70 transition-opacity hover:opacity-100 md:gap-3 md:text-sm">
                          <div className="h-1 w-1 rounded-full bg-rose-500" />
                          {tournament.gameType === "Deathmatch"
                            ? "Free-for-all (FFA)"
                            : "Single Elimination"}
                        </li>
                        <li className="flex items-center gap-2 text-xs opacity-70 transition-opacity hover:opacity-100 md:gap-3 md:text-sm">
                          <div className="h-1 w-1 rounded-full bg-rose-500" />
                          {tournament.gameType === "Deathmatch"
                            ? "Score limit: 40 kills or 10 mins"
                            : "Initial rounds: BO1"}
                        </li>
                        <li className="flex items-center gap-2 text-xs opacity-70 transition-opacity hover:opacity-100 md:gap-3 md:text-sm">
                          <div className="h-1 w-1 rounded-full bg-rose-500" />
                          {tournament.gameType === "Deathmatch"
                            ? "All Weapons Allowed"
                            : "Map Veto System"}
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                      <h3 className="text-[10px] font-black tracking-[0.2em] text-rose-500 uppercase">
                        Quick Rules
                      </h3>
                      <ul className="space-y-2 md:space-y-3">
                        <li className="flex items-center gap-2 text-xs opacity-70 transition-opacity hover:opacity-100 md:gap-3 md:text-sm">
                          <div className="h-1 w-1 rounded-full bg-rose-500" />
                          Check-in 15m before start
                        </li>
                        <li className="flex items-center gap-2 text-xs opacity-70 transition-opacity hover:opacity-100 md:gap-3 md:text-sm">
                          <div className="h-1 w-1 rounded-full bg-rose-500" />
                          Party Code via Discord
                        </li>
                        <li className="flex items-center gap-2 text-xs opacity-70 transition-opacity hover:opacity-100 md:gap-3 md:text-sm">
                          <div className="h-1 w-1 rounded-full bg-rose-500" />
                          Strict Anti-Cheat Policy
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "participants" && (
                <div className="animate-in fade-in space-y-4 duration-500">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-3">
                    {registrations.length > 0 ? (
                      registrations.map((reg) => (
                        <div
                          key={reg.$id}
                          className="rounded-xl border border-white/5 bg-slate-950/50 p-3 transition-all hover:border-rose-500/20 md:rounded-2xl md:p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-rose-500/10 p-1.5 md:p-2">
                              <Users className="h-3.5 w-3.5 text-rose-500 md:h-4 md:w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold tracking-tight text-white uppercase md:text-sm">
                                {reg.teamName ||
                                  parseMetadata(reg.metadata)?.playerName ||
                                  "Unknown"}
                              </p>
                              <p className="text-[9px] font-medium tracking-[0.1em] text-slate-500 uppercase md:text-[10px]">
                                Registered{" "}
                                {new Date(reg.$createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center text-[10px] font-black tracking-widest text-slate-600 uppercase md:py-12">
                        No participants yet
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info & Registration - First on mobile */}
          <div className="order-1 space-y-4 md:space-y-6 lg:order-2">
            {/* Quick Stats */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl md:p-6">
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex w-full flex-col gap-3">
                    <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#11141a] p-4 md:rounded-2xl md:p-6">
                      <div className="absolute top-0 left-0 h-full w-1 bg-rose-500" />
                      <p className="mb-1 text-[9px] font-black tracking-[0.2em] text-rose-500/60 uppercase md:mb-2 md:text-[10px]">
                        Prize Pool
                      </p>
                      <p className="text-2xl leading-none font-black tracking-tight text-white italic md:text-4xl">
                        ₹{tournament.prizePool}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:grid-cols-1 md:gap-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="rounded-lg border border-white/5 bg-slate-950 p-2.5 text-rose-500 shadow-lg shadow-rose-500/5 md:rounded-xl md:p-3">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase md:text-[10px]">
                        Schedule
                      </p>
                      <p
                        className="truncate text-xs font-bold tracking-tight text-white uppercase md:text-sm"
                        suppressHydrationWarning
                      >
                        {new Date(tournament.date).toLocaleDateString()} @{" "}
                        {new Date(tournament.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="rounded-lg border border-white/5 bg-slate-950 p-2.5 text-rose-500 shadow-lg shadow-rose-500/5 md:rounded-xl md:p-3">
                      <Users className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <div>
                      <p className="mb-0.5 text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase md:text-[10px]">
                        Participants
                      </p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white md:text-sm">
                          {registrations.length} / {tournament.maxTeams}
                        </p>
                        <span
                          className={`text-[9px] font-black tracking-widest uppercase md:text-[10px] ${
                            tournament.maxTeams - registrations.length <= 2
                              ? "text-rose-500"
                              : "text-emerald-500"
                          }`}
                        >
                          ({tournament.maxTeams - registrations.length} LEFT)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="rounded-lg border border-white/5 bg-slate-950 p-2.5 text-rose-500 shadow-lg shadow-rose-500/5 md:rounded-xl md:p-3">
                      <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <div>
                      <p className="mb-0.5 text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase md:text-[10px]">
                        Location
                      </p>
                      <p className="text-xs font-bold tracking-tight text-white uppercase md:text-sm">
                        {tournament.location || "Online"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prize Breakdown Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl md:p-6">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-black tracking-[0.2em] text-white uppercase md:mb-6 md:text-sm">
                <Trophy className="h-3.5 w-3.5 text-amber-500 md:h-4 md:w-4" />
                Prizes
              </h3>
              <div className="space-y-3 md:space-y-4">
                <div className="group flex items-center justify-between rounded-lg border border-emerald-500/10 bg-gradient-to-r from-emerald-500/10 to-transparent p-3 transition-transform hover:scale-[1.02] md:rounded-xl md:p-4">
                  <div>
                    <p className="text-[8px] font-black tracking-widest text-emerald-500 uppercase md:text-[9px]">
                      1st Place
                    </p>
                    <p className="text-lg font-black text-white italic md:text-xl">
                      ₹{tournament.firstPrize}
                    </p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 md:h-8 md:w-8">
                    <Trophy className="h-3.5 w-3.5 text-emerald-500 md:h-4 md:w-4" />
                  </div>
                </div>

                <div className="group flex items-center justify-between rounded-lg border border-amber-500/10 bg-gradient-to-r from-amber-500/10 to-transparent p-3 transition-transform hover:scale-[1.02] md:rounded-xl md:p-4">
                  <div>
                    <p className="text-[8px] font-black tracking-widest text-amber-500 uppercase md:text-[9px]">
                      2nd Place
                    </p>
                    <p className="text-lg font-black text-white italic md:text-xl">
                      ₹{tournament.secondPrize}
                    </p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 md:h-8 md:w-8">
                    <Trophy className="h-3.5 w-3.5 text-amber-500 md:h-4 md:w-4" />
                  </div>
                </div>

                {parsePrizes(tournament.additionalPrizes).map((prize, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/50 p-3 transition-all hover:border-rose-500/20 md:rounded-xl md:p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] font-black tracking-widest text-slate-500 uppercase md:text-[9px]">
                        {prize.label || "Special"}
                      </p>
                      <p className="truncate text-base font-black text-white italic md:text-lg">
                        ₹{prize.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Registration Card */}
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-4 backdrop-blur-xl md:p-6">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-black tracking-[0.2em] text-white uppercase md:mb-4 md:text-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-rose-500 md:h-4 md:w-4" />
                Entry Details
              </h3>

              <div className="group relative mb-5 overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 p-5 text-center transition-all hover:bg-slate-950/80 md:mb-6 md:p-6">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl transition-all group-hover:bg-rose-500/20" />
                <p className="mb-2 text-[10px] font-black tracking-[0.2em] text-rose-500/80 uppercase md:text-xs">
                  {tournament.gameType === "Deathmatch"
                    ? "INDIVIDUAL ENTRY"
                    : "TEAM REGISTRATION"}
                </p>
                <div className="relative inline-flex items-baseline gap-1">
                  <span className="text-xl font-bold text-white/50 md:text-2xl">
                    ₹
                  </span>
                  <p className="text-4xl font-black tracking-tighter text-white italic drop-shadow-lg md:text-5xl">
                    {tournament.entryFee}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-[9px] font-bold tracking-widest text-slate-500 uppercase md:text-[10px]">
                  <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  Instant Activation
                </div>
              </div>
              {tournament.checkInEnabled && (
                <div className="mb-4 space-y-2 rounded-lg border border-amber-500/10 bg-amber-500/5 p-3 md:mb-6 md:rounded-xl md:p-4">
                  <p className="flex items-center gap-2 text-[9px] font-black tracking-widest text-amber-500/80 uppercase md:text-[10px]">
                    <AlertCircle className="h-3 w-3" />
                    Pre-Match Check-in Required
                  </p>
                  <p className="text-[10px] font-bold text-white md:text-xs">
                    {tournament.checkInStart
                      ? new Date(tournament.checkInStart).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Check-in time 15 min before match"}
                  </p>
                </div>
              )}
              {!user ? (
                <div className="py-3 text-center md:py-4">
                  <p className="mb-3 text-xs text-slate-400 md:mb-4 md:text-sm">
                    Please sign in to register for this tournament.
                  </p>
                  <button
                    onClick={() => router.push("/login")}
                    className="font-anton w-full rounded-lg bg-white px-4 py-2.5 text-[10px] font-black tracking-widest text-slate-950 uppercase transition-all hover:bg-slate-200 md:rounded-xl md:px-6 md:py-3 md:text-xs"
                  >
                    Log In
                  </button>
                </div>
              ) : isRegistered ? (
                <div className="flex flex-col gap-3 md:gap-4">
                  <div
                    className={`flex items-center gap-2 rounded-lg border p-3 md:rounded-xl md:p-4 ${isCheckedIn ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"}`}
                  >
                    {isCheckedIn ? (
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                    ) : (
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                    <span className="text-[10px] font-bold tracking-wide uppercase md:text-xs">
                      {isCheckedIn ? "Checked In!" : "Registered"}
                    </span>
                  </div>

                  {!isCheckedIn && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleCheckIn}
                        disabled={checkingIn || !canCheckIn}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none md:rounded-xl md:py-4 md:text-xs"
                      >
                        {checkingIn ? (
                          <Loader fullScreen={false} size="sm" />
                        ) : !canCheckIn ? (
                          `Check-in opens at ${new Date(tournament.checkInStart || tournament.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        ) : (
                          "Check In Now"
                        )}
                      </button>
                      {!canCheckIn && (
                        <p className="text-center text-[9px] text-slate-500 md:text-[10px]">
                          Check-in will be enabled automatically at the
                          scheduled time.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Discord Lobby Button */}
                  {tournament.discordInviteUrl && (
                    <div className="flex flex-col gap-2">
                      <p className="mt-2 text-[9px] font-black tracking-widest text-slate-500 uppercase md:text-[10px]">
                        Discord Access
                      </p>
                      <a
                        href={tournament.discordInviteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5865F2] py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-[#5865F2]/20 transition-all hover:bg-[#4752C4] md:rounded-xl md:py-4 md:text-sm"
                      >
                        <FaDiscord className="h-4 w-4" />
                        Join Tournament Lobby
                      </a>
                    </div>
                  )}
                </div>
              ) : isPaymentPending ? (
                <div className="flex flex-col gap-3 md:gap-4">
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-500 md:rounded-xl md:p-4">
                    <div className="relative">
                      <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                      <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[10px] font-black tracking-widest uppercase md:text-xs">
                        Verification Pending
                      </p>
                      <p className="text-[9px] leading-tight font-medium opacity-80 md:text-[10px]">
                        We are verifying your payment. Status will update
                        shortly.
                      </p>
                    </div>
                  </div>
                </div>
              ) : isPaymentRejected ? (
                <div className="flex flex-col gap-3 md:gap-4">
                  <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-rose-500 md:rounded-xl md:p-4">
                    <UserX className="h-4 w-4 md:h-5 md:w-5" />
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[10px] font-black tracking-widest uppercase md:text-xs">
                        Payment Rejected
                      </p>
                      <p className="text-[9px] leading-tight font-medium opacity-80 md:text-[10px]">
                        {paymentRequest?.rejectionReason ||
                          "Your payment was rejected. Please contact support."}
                      </p>

                      <button
                        onClick={handleRetryPayment}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-[10px] font-bold text-rose-500 transition-all hover:bg-rose-500 hover:text-white md:text-xs"
                      >
                        <RotateCcw className="h-3 w-3 md:h-4 md:w-4" />
                        Retry / Fix Payment
                      </button>
                      <Link
                        href="/support"
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/5 bg-slate-900 px-4 py-2 text-[10px] font-bold text-slate-400 transition-all hover:bg-slate-800 hover:text-white md:text-xs"
                      >
                        <Info className="h-3 w-3 md:h-4 md:w-4" />
                        Help / Support
                      </Link>
                    </div>
                  </div>
                </div>
              ) : isFull ? (
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-rose-500 md:rounded-xl md:p-4">
                  <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-[9px] font-black tracking-widest uppercase md:text-[10px]">
                    Entry Limit Reached
                  </span>
                </div>
              ) : tournament.status && tournament.status !== "scheduled" ? (
                <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-slate-900 p-3 text-slate-500 md:rounded-xl md:p-4">
                  <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-[9px] font-black tracking-widest uppercase md:text-[10px]">
                    Live / Completed
                  </span>
                </div>
              ) : checkingDiscord ? (
                <div className="flex items-center justify-center gap-4 rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl md:p-8">
                  <div className="relative">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500/20 border-t-rose-500" />
                    <div className="absolute inset-0 animate-ping rounded-full bg-rose-500/10" />
                  </div>
                  <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase md:text-xs">
                    Scanning Tactical Comms...
                  </span>
                </div>
              ) : hasDiscordLinked === false ? (
                <div className="group relative overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 backdrop-blur-xl transition-all hover:bg-rose-500/[0.08] md:p-6">
                  {/* Atmospheric background elements */}
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-rose-500/20 blur-[40px] transition-all group-hover:bg-rose-500/30" />
                  <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-rose-500/5 blur-[40px]" />

                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.1)] transition-transform group-hover:scale-110">
                        <FaDiscord className="h-7 w-7 text-rose-500" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black tracking-[0.25em] text-rose-500 uppercase md:text-xs">
                          IDENTITY LINK
                        </h4>
                        <p className="text-base font-black tracking-tight text-white italic md:text-lg">
                          Connect Discord
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] leading-relaxed font-medium text-slate-400 md:text-xs">
                      Join the battle. We need your Discord profile to grant you
                      private access to match lobbies and voice comms.
                    </p>

                    <Link
                      href="/profile"
                      className="group/btn relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-rose-600 py-4 text-xs font-black tracking-[0.2em] text-white uppercase shadow-[0_8px_20px_rgba(225,29,72,0.3)] transition-all hover:bg-rose-500 hover:shadow-[0_12px_24px_rgba(225,29,72,0.5)] md:text-[13px]"
                    >
                      <FaDiscord className="relative z-10 h-5 w-5 transition-transform group-hover/btn:scale-125" />
                      <span className="relative z-10">Link in Profile</span>
                    </Link>
                  </div>
                </div>
              ) : isInDiscord === false ? (
                <div className="flex flex-col gap-4">
                  <div className="group relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 backdrop-blur-xl transition-all hover:bg-amber-500/[0.08] md:p-6">
                    {/* Atmospheric background elements */}
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-500/20 blur-[40px] transition-all group-hover:bg-amber-500/30" />

                    <div className="relative z-10 space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-transform group-hover:scale-110">
                          <FaDiscord className="h-7 w-7 text-amber-500" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black tracking-[0.25em] text-amber-500 uppercase md:text-xs">
                            MISSING ACCESS
                          </h4>
                          <p className="text-base font-black tracking-tight text-white italic md:text-lg">
                            Join Our Server
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] leading-relaxed font-medium text-slate-400 md:text-xs">
                        You've linked your account! Now join the official
                        VRivals Arena server to unlock your private match
                        lobbies.
                      </p>

                      <a
                        href={DISCORD_INVITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/btn relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-amber-600 py-4 text-xs font-black tracking-[0.2em] text-white uppercase shadow-[0_8px_20px_rgba(217,119,6,0.3)] transition-all hover:bg-amber-500 hover:shadow-[0_12px_24px_rgba(217,119,6,0.5)] md:text-[13px]"
                      >
                        <FaDiscord className="relative z-10 h-5 w-5 transition-transform group-hover/btn:scale-125" />
                        <span className="relative z-10">
                          Join VRivals Server
                        </span>
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={recheckDiscord}
                    disabled={checkingDiscord}
                    className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 transition-all hover:text-white disabled:opacity-50"
                  >
                    <RotateCcw
                      className={`h-3 w-3 ${checkingDiscord ? "animate-spin" : ""}`}
                    />
                    {checkingDiscord
                      ? "Checking..."
                      : "Already joined? Click to refresh"}
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleRegister}
                  className="space-y-4 md:space-y-6"
                >
                  {success ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 font-bold text-emerald-500 md:rounded-xl md:p-4">
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-[9px] font-black tracking-widest uppercase md:text-[10px]">
                        Success!
                      </span>
                    </div>
                  ) : (
                    <>
                      {tournament.gameType === "5v5" ? (
                        <div className="space-y-4 md:space-y-6">
                          <div>
                            <label className="mb-2 block text-[9px] font-black tracking-widest text-slate-500 uppercase md:text-[10px]">
                              Team Name
                            </label>
                            <input
                              type="text"
                              value={teamName}
                              onChange={(e) => setTeamName(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-xs text-white transition-all focus:border-rose-500 focus:outline-none md:rounded-xl md:px-4 md:py-3 md:text-sm"
                              placeholder="Enter team name"
                              required
                            />
                          </div>

                          <div className="space-y-2 md:space-y-3">
                            <label className="block text-[9px] font-black tracking-widest text-slate-500 uppercase md:text-[10px]">
                              Roster (5)
                            </label>
                            {members.map((member, index) => (
                              <div
                                key={index}
                                className="flex gap-1.5 md:gap-2"
                              >
                                <input
                                  type="text"
                                  placeholder="Name"
                                  value={member.name}
                                  onChange={(e) => {
                                    const n = [...members];
                                    n[index].name = e.target.value;
                                    n[index].verified = false;
                                    setMembers(n);
                                  }}
                                  className="min-w-0 flex-1 rounded-lg border border-white/5 bg-slate-950 px-2.5 py-2 text-[11px] text-white placeholder:text-slate-800 focus:border-rose-500 focus:outline-none md:px-3 md:text-xs"
                                  required
                                />
                                <input
                                  type="text"
                                  placeholder="Tag"
                                  value={member.tag}
                                  onChange={(e) => {
                                    const n = [...members];
                                    n[index].tag = e.target.value;
                                    n[index].verified = false;
                                    setMembers(n);
                                  }}
                                  className="w-14 rounded-lg border border-white/5 bg-slate-950 px-2 py-2 text-center text-[11px] text-white placeholder:text-slate-800 focus:border-rose-500 focus:outline-none md:w-16 md:px-3 md:text-xs"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => verifyMember(index)}
                                  disabled={
                                    member.loading ||
                                    !member.name ||
                                    !member.tag
                                  }
                                  className={`flex shrink-0 items-center justify-center rounded-lg px-2 py-2 transition-all ${
                                    member.verified
                                      ? "bg-emerald-500/20 text-emerald-500"
                                      : "border border-white/5 bg-slate-900 text-slate-600 hover:text-white"
                                  }`}
                                >
                                  {member.loading ? (
                                    <Loader fullScreen={false} size="sm" />
                                  ) : member.verified ? (
                                    <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                  ) : (
                                    <UserCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 rounded-lg border border-white/5 bg-slate-950/50 p-3 text-center md:rounded-xl md:p-4">
                          <p className="text-[10px] text-slate-500 md:text-xs">
                            Solo registration for:
                          </p>
                          {userProfile ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 md:px-4 md:py-1.5">
                              <div className="h-1 w-1 rounded-full bg-rose-500 md:h-1.5 md:w-1.5" />
                              <span className="text-[10px] font-bold text-white md:text-xs">
                                {userProfile.ingameName}{" "}
                                <span className="text-slate-500">
                                  #{userProfile.tag}
                                </span>
                              </span>
                            </div>
                          ) : (
                            <p className="text-[9px] font-black tracking-widest text-rose-400 uppercase md:text-[10px]">
                              Link account in profile
                            </p>
                          )}
                        </div>
                      )}
                      {error && (
                        <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-[9px] text-rose-500 md:p-3 md:text-[10px]">
                          {error}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={
                          registering ||
                          (tournament.gameType === "5v5" &&
                            members.some((m) => !m.verified))
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-rose-900/20 transition-all hover:bg-rose-700 disabled:opacity-50 md:rounded-xl md:py-4 md:text-xs"
                      >
                        {registering ? (
                          <Loader fullScreen={false} size="sm" />
                        ) : (
                          "Confirm Entry"
                        )}
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Bracket / Standings Section */}
      {tournament.bracketGenerated && (
        <div className="scroll-mt-24 pb-12 md:pb-20">
          {tournament.gameType === "Deathmatch" ? (
            <CompleteStandings
              registrations={registrations}
              tournament={tournament}
              matches={matches}
            />
          ) : (
            <div
              id="tournament-map"
              className="container mx-auto mt-8 px-4 md:mt-12 md:px-6"
            >
              <CompleteBracket
                matches={matches}
                participants={participantMap}
                tournament={tournament}
              />
            </div>
          )}
        </div>
      )}

      {/* UPI Payment Modal */}
      <UPIPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPendingPaymentData(null);
          setError(null); // Clear error on close
        }}
        tournamentName={tournament.name}
        entryFee={tournament.entryFee}
        onPaymentComplete={handlePaymentComplete}
        isProcessing={registering}
        error={error} // Pass the error state
      />
    </div>
  );
}
