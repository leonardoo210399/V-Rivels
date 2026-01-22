"use client";
import { useState, useEffect, useCallback } from "react";
import { FaDiscord } from "react-icons/fa";
import {
  Users,
  Volume2,
  ExternalLink,
  X,
  CheckCircle,
  LogIn,
  Radio,
  RefreshCw,
  Copy,
  Bell,
  BellOff,
  BarChart3,
  Link2,
  MessageCircle,
} from "lucide-react";
import { account } from "@/lib/appwrite";
import { checkDiscordMembership } from "@/lib/discord";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const DISCORD_SERVER_ID = "1463457657737449506";
const DISCORD_INVITE = "https://discord.gg/gexZcZzCHV";
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export default function DiscordWidget({
  variant = "card",
  showIframe = false,
}) {
  const [widgetData, setWidgetData] = useState(null);
  const [serverStats, setServerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWidget, setShowWidget] = useState(false);
  const [isUserMember, setIsUserMember] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const fetchWidgetData = async () => {
    try {
      const response = await fetch(
        `https://discord.com/api/guilds/${DISCORD_SERVER_ID}/widget.json`,
      );
      if (!response.ok) throw new Error("Widget not available");
      const data = await response.json();
      setWidgetData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWidgetData(), fetchServerStats()]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();

    // Load auto-refresh preference
    const savedAutoRefresh = localStorage.getItem("discord-auto-refresh");
    if (savedAutoRefresh === "true") {
      setAutoRefresh(true);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setIsLoggedIn(true);
        checkUserMembership();
      } else {
        setIsLoggedIn(false);
      }
    }
  }, [user, authLoading]);

  const fetchServerStats = async () => {
    try {
      const response = await fetch(
        `https://discord.com/api/v10/invites/gexZcZzCHV?with_counts=true&with_expiration=true`,
      );
      if (response.ok) {
        const data = await response.json();
        setServerStats({
          memberCount: data.approximate_member_count,
          onlineCount: data.approximate_presence_count,
        });
      }
    } catch (err) {
      console.log("Could not fetch server stats:", err);
    }
  };

  const checkUserMembership = async () => {
    try {
      const session = await account.getSession("current");

      if (session?.provider === "discord" && session?.providerAccessToken) {
        const { isMember } = await checkDiscordMembership(
          session.providerAccessToken,
        );
        setIsUserMember(isMember);
      } else {
        try {
          const identities = await account.listIdentities();
          const discord = identities.identities?.find(
            (id) => id.provider === "discord",
          );
          if (discord?.providerAccessToken) {
            const { isMember } = await checkDiscordMembership(
              discord.providerAccessToken,
            );
            setIsUserMember(isMember);
          }
        } catch (e) {
          // No identities or error - that's fine
        }
      }
    } catch (e) {
      setIsLoggedIn(false);
    }
  };

  const handleToggleAutoRefresh = () => {
    const newValue = !autoRefresh;
    setAutoRefresh(newValue);
    localStorage.setItem("discord-auto-refresh", String(newValue));
  };

  // Floating button variant
  if (variant === "floating") {
    return (
      <>
        <button
          onClick={() => setShowWidget(!showWidget)}
          className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 transition-all duration-300 hover:scale-110 hover:bg-indigo-500 hover:shadow-indigo-600/50 active:scale-95"
          title="Toggle Discord Widget"
        >
          {showWidget ? (
            <X className="h-6 w-6 transition-transform duration-200" />
          ) : (
            <FaDiscord className="h-7 w-7 transition-transform duration-200" />
          )}
          {!showWidget && widgetData && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold">
              {widgetData.presence_count}
            </span>
          )}
        </button>

        {showWidget && (
          <div className="animate-in slide-in-from-bottom-4 fade-in fixed right-6 bottom-24 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl duration-300">
            <WidgetContent
              data={widgetData}
              serverStats={serverStats}
              loading={loading}
              error={error}
              onRefresh={fetchData}
              refreshing={refreshing}
              autoRefresh={autoRefresh}
              onToggleAutoRefresh={handleToggleAutoRefresh}
              isUserMember={isUserMember}
              isLoggedIn={isLoggedIn}
            />
          </div>
        )}
      </>
    );
  }

  // Card variant
  if (variant === "card") {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/10">
        <WidgetContent
          data={widgetData}
          serverStats={serverStats}
          loading={loading}
          error={error}
          onRefresh={fetchData}
          refreshing={refreshing}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={handleToggleAutoRefresh}
          isUserMember={isUserMember}
          isLoggedIn={isLoggedIn}
        />
      </div>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <a
        href={DISCORD_INVITE}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-2.5 transition-all duration-300 hover:scale-105 hover:border-indigo-500/40 hover:bg-indigo-500/20"
      >
        <FaDiscord className="h-5 w-5 text-indigo-400 transition-transform duration-300 group-hover:scale-110" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Join Discord</span>
          {widgetData && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              {widgetData.presence_count} online
            </span>
          )}
        </div>
      </a>
    );
  }

  // Iframe variant
  if (variant === "iframe") {
    return (
      <iframe
        src={`https://discord.com/widget?id=${DISCORD_SERVER_ID}&theme=dark`}
        width="350"
        height="500"
        allowTransparency={true}
        frameBorder="0"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        className="rounded-2xl border border-white/10"
      />
    );
  }

  return null;
}

// Toast notification component
function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="animate-in slide-in-from-top-4 fade-in fixed top-20 right-4 z-[100] flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
      <CheckCircle className="h-4 w-4" />
      {message}
    </div>
  );
}

// Widget content component
function WidgetContent({
  data,
  serverStats,
  loading,
  error,
  onRefresh,
  refreshing,
  autoRefresh,
  onToggleAutoRefresh,
  isUserMember = false,
  isLoggedIn = null,
}) {
  const [hoveredMember, setHoveredMember] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showStatsModal, setShowStatsModal] = useState(false);

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(DISCORD_INVITE);
      showNotification("Invite link copied!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleJoinVoiceChannel = (channelId, channelName) => {
    // Open Discord to join voice channel
    window.open(
      `discord://discord.com/channels/${DISCORD_SERVER_ID}/${channelId}`,
      "_blank",
    );
    showNotification(`Opening ${channelName}...`);
  };

  const handleViewMemberProfile = (memberId, username) => {
    // Open Discord to view member profile
    window.open(`discord://discord.com/users/${memberId}`, "_blank");
    showNotification(`Opening ${username}'s profile...`);
  };

  const handleOpenChannel = (type) => {
    const channelMap = {
      announcements: "1234567890", // Replace with actual channel ID
      general: "1234567890", // Replace with actual channel ID
    };
    window.open(
      `discord://discord.com/channels/${DISCORD_SERVER_ID}/${channelMap[type]}`,
      "_blank",
    );
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <FaDiscord className="mx-auto mb-3 h-10 w-10 text-slate-600" />
        <p className="text-sm text-slate-400">Widget unavailable</p>
        <a
          href={DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-500"
        >
          Join Discord <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  // Get members in voice channels (excluding bots)
  const getMembersInChannel = (channelId) => {
    const bots = ["Jockie Music (1)", "MEE6", "mee6", "Chip", "chip"];
    return (
      data?.members?.filter(
        (m) => m.channel_id === channelId && !bots.includes(m.username),
      ) || []
    );
  };

  return (
    <>
      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}

      <div className="animate-in fade-in duration-500">
        {/* Header with Server Stats */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-indigo-500 p-4">
          {/* Animated background effect */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]" />
          </div>

          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <FaDiscord className="animate-in zoom-in h-8 w-8 text-white duration-300" />
                  <div className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">
                    {data?.name || "VRivals Arena"}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-white/80">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    {data?.presence_count || 0} Online
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyInvite}
                  className="rounded-lg bg-white/10 p-1.5 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white/20"
                  title="Copy invite link"
                >
                  <Copy className="h-3.5 w-3.5 text-white" />
                </button>
                <button
                  onClick={onToggleAutoRefresh}
                  className={`rounded-lg p-1.5 backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
                    autoRefresh
                      ? "bg-emerald-500/30 text-emerald-400"
                      : "bg-white/10 text-white/70"
                  }`}
                  title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
                >
                  {autoRefresh ? (
                    <Bell className="h-3.5 w-3.5" />
                  ) : (
                    <BellOff className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="rounded-lg bg-white/10 p-1.5 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white/20 disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-white ${refreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Server Stats Grid */}
            {serverStats && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowStatsModal(true)}
                  className="rounded-lg bg-white/10 p-2 text-left backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20"
                  title="Click for details"
                >
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-white/80" />
                    <span className="text-[10px] font-medium text-white/70 uppercase">
                      Members
                    </span>
                  </div>
                  <p className="mt-0.5 text-lg font-black text-white">
                    {serverStats.memberCount?.toLocaleString() || "N/A"}
                  </p>
                </button>

                <button
                  onClick={() => setShowStatsModal(true)}
                  className="rounded-lg bg-white/10 p-2 text-left backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20"
                  title="Click for details"
                >
                  <div className="flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
                    <span className="text-[10px] font-medium text-white/70 uppercase">
                      Active
                    </span>
                  </div>
                  <p className="mt-0.5 text-lg font-black text-emerald-400">
                    {serverStats.onlineCount?.toLocaleString() ||
                      data?.presence_count ||
                      "N/A"}
                  </p>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="border-b border-white/5 bg-slate-800/30 p-2">
          <p className="mb-1.5 text-center text-[9px] font-bold tracking-wider text-slate-500 uppercase">
            Quick Access
          </p>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => window.open(DISCORD_INVITE, "_blank")}
              className="flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-1.5 text-[10px] font-medium text-indigo-400 transition-all hover:scale-105 hover:bg-indigo-500/20"
              title="Open Discord Server"
            >
              <Link2 className="h-3 w-3" />
              Server
            </button>
            <button
              onClick={() => handleOpenChannel("announcements")}
              className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-1.5 text-[10px] font-medium text-blue-400 transition-all hover:scale-105 hover:bg-blue-500/20"
              title="View Announcements"
            >
              <MessageCircle className="h-3 w-3" />
              Announcements
            </button>
            <button
              onClick={() =>
                window.open("https://discord.gg/tXs3KEg526", "_blank")
              }
              className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1.5 text-[10px] font-medium text-emerald-400 transition-all hover:scale-105 hover:bg-emerald-500/20"
              title="General Chat"
            >
              <MessageCircle className="h-3 w-3" />
              General
            </button>
            <button
              onClick={() =>
                window.open("https://discord.gg/DHYd3ykmdh", "_blank")
              }
              className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1.5 text-[10px] font-medium text-amber-400 transition-all hover:scale-105 hover:bg-amber-500/20"
              title="Find Teammates"
            >
              <Users className="h-3 w-3" />
              Find Teammates
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="custom-scrollbar max-h-80 overflow-y-auto p-3">
          {/* Voice Channels with Enhanced Visualization */}
          {data?.channels?.filter((c) => c.id).length > 0 && (
            <div className="mb-4">
              <p className="mb-2 flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                <Volume2 className="h-3 w-3" />
                Voice Channels
                <span className="ml-auto text-[9px] font-normal text-slate-600 normal-case">
                  Click to join
                </span>
              </p>
              <div className="space-y-2">
                {data.channels
                  .filter((c) => c.id)
                  .slice(0, 3)
                  .map((channel) => {
                    const membersInChannel = getMembersInChannel(channel.id);
                    const isActive = membersInChannel.length > 0;

                    return (
                      <button
                        key={channel.id}
                        onClick={() =>
                          handleJoinVoiceChannel(channel.id, channel.name)
                        }
                        className={`group relative w-full overflow-hidden rounded-lg bg-slate-800/50 px-3 py-2.5 transition-all duration-300 ${
                          isActive
                            ? "border border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50 hover:bg-indigo-500/15"
                            : "hover:scale-105 hover:bg-slate-800/70"
                        } cursor-pointer`}
                        title={`Click to join ${channel.name}`}
                      >
                        {/* Active channel pulse effect */}
                        {isActive && (
                          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-indigo-500/10 to-transparent opacity-50" />
                        )}

                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Volume2
                                className={`h-4 w-4 transition-colors duration-300 ${
                                  isActive
                                    ? "text-indigo-400"
                                    : "text-slate-500 group-hover:text-indigo-400"
                                }`}
                              />
                              {isActive && (
                                <span className="absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                              )}
                            </div>
                            <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                              {channel.name}
                            </span>
                          </div>

                          {isActive ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-indigo-400">
                                {membersInChannel.length}
                              </span>
                              {/* Show avatars of members in channel */}
                              <div className="flex -space-x-2">
                                {membersInChannel
                                  .slice(0, 3)
                                  .map((member, idx) => (
                                    <img
                                      key={member.id}
                                      src={member.avatar_url}
                                      alt={member.username}
                                      className="h-5 w-5 rounded-full border-2 border-slate-800 transition-transform duration-200 group-hover:scale-110"
                                      style={{
                                        animationDelay: `${idx * 100}ms`,
                                      }}
                                      title={member.username}
                                    />
                                  ))}
                                {membersInChannel.length > 3 && (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-800 bg-slate-700 text-[8px] font-bold text-white">
                                    +{membersInChannel.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <ExternalLink className="h-3 w-3 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
                          )}
                        </div>

                        {/* Animated sound waves for active channels */}
                        {isActive && (
                          <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5 opacity-50">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className="animate-sound-wave w-0.5 rounded-full bg-indigo-400"
                                style={{
                                  height: "12px",
                                  animationDelay: `${i * 0.15}s`,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Online Members with Enhanced Animations */}
          <div>
            <p className="mb-2 flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
              <Users className="h-3 w-3" />
              Online Members ({data?.members?.length || 0})
              <span className="ml-auto text-[9px] font-normal text-slate-600 normal-case">
                Click to view
              </span>
            </p>
            <div className="space-y-1">
              {data?.members
                ?.sort((a, b) => {
                  // List of bot usernames to move to the end
                  const bots = [
                    "Jockie Music (1)",
                    "MEE6",
                    "Jockie Music (1)",
                    "mee6",
                  ];
                  const aIsBot = bots.includes(a.username);
                  const bIsBot = bots.includes(b.username);

                  // If a is bot and b is not, move a down
                  if (aIsBot && !bIsBot) return 1;
                  // If b is bot and a is not, move b down
                  if (!aIsBot && bIsBot) return -1;
                  // Otherwise maintain original order
                  return 0;
                })
                .slice(0, 8)
                .map((member, index) => (
                  <button
                    key={member.id}
                    onClick={() =>
                      handleViewMemberProfile(member.id, member.username)
                    }
                    onMouseEnter={() => setHoveredMember(member.id)}
                    onMouseLeave={() => setHoveredMember(null)}
                    className="group animate-in slide-in-from-left flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-all duration-200 hover:scale-105 hover:bg-slate-800/70"
                    style={{ animationDelay: `${index * 50}ms` }}
                    title={`Click to view ${member.username}'s profile`}
                  >
                    <div className="relative">
                      <img
                        src={member.avatar_url}
                        alt={member.username}
                        className="h-8 w-8 rounded-full transition-all duration-300 group-hover:ring-2 group-hover:ring-indigo-500/50"
                      />
                      <span
                        className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-slate-900 transition-all duration-300 ${
                          member.status === "online"
                            ? "bg-emerald-500"
                            : member.status === "idle"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        } ${hoveredMember === member.id ? "scale-125" : ""}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-medium text-slate-200 transition-colors duration-200 group-hover:text-white">
                        {member.username}
                      </span>
                      {member.game && (
                        <span className="block truncate text-[10px] text-indigo-400 transition-all duration-200">
                          Playing {member.game.name}
                        </span>
                      )}
                    </div>
                    {/* Activity indicator */}
                    <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <ExternalLink className="h-3 w-3 text-indigo-400" />
                    </div>
                  </button>
                ))}
              {data?.members?.length > 8 && (
                <p className="py-2 text-center text-xs text-slate-500 transition-colors duration-200 hover:text-slate-400">
                  +{data.members.length - 8} more online
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {!isUserMember && (
          <div className="border-t border-white/5 p-3">
            {isLoggedIn === false ? (
              <Link
                href="/login"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-3 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-indigo-600/20 transition-all duration-300 hover:scale-105 hover:shadow-indigo-600/40 active:scale-95"
              >
                <LogIn className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
                Login & Join Discord
              </Link>
            ) : (
              <a
                href={data?.instant_invite || DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-3 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-indigo-600/20 transition-all duration-300 hover:scale-105 hover:shadow-indigo-600/40 active:scale-95"
              >
                Join Server
                <ExternalLink className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Stats Modal */}
      {showStatsModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowStatsModal(false)}
        >
          <div
            className="animate-in zoom-in w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <BarChart3 className="h-5 w-5 text-indigo-400" />
                Server Statistics
              </h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="rounded-lg p-1 transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-slate-800/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Total Members</span>
                  <span className="text-lg font-bold text-white">
                    {serverStats?.memberCount?.toLocaleString() || "N/A"}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-800/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Online Now</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {serverStats?.onlineCount?.toLocaleString() ||
                      data?.presence_count ||
                      "N/A"}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-800/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">In Voice</span>
                  <span className="text-lg font-bold text-indigo-400">
                    {data?.members?.filter((m) => m.channel_id).length || 0}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-800/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Active Channels
                  </span>
                  <span className="text-lg font-bold text-purple-400">
                    {data?.channels?.filter((c) => {
                      const members =
                        data?.members?.filter((m) => m.channel_id === c.id) ||
                        [];
                      return members.length > 0;
                    }).length || 0}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowStatsModal(false)}
              className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-bold text-white transition-all hover:bg-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Inject custom styles only in browser
if (typeof window !== "undefined") {
  const styleId = "discord-widget-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(99, 102, 241, 0.5);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(99, 102, 241, 0.7);
      }
      
      @keyframes sound-wave {
        0%, 100% { height: 8px; }
        50% { height: 16px; }
      }
      
      .animate-sound-wave {
        animation: sound-wave 1s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }
}
