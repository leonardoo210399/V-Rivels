"use client";
import { useState, useEffect } from "react";
import { FaDiscord } from "react-icons/fa";
import {
  Users,
  Volume2,
  ExternalLink,
  X,
  CheckCircle,
  LogIn,
} from "lucide-react";
import { account } from "@/lib/appwrite";
import { checkDiscordMembership } from "@/lib/discord";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const DISCORD_SERVER_ID = "1463457657737449506";
const DISCORD_INVITE = "https://discord.gg/gexZcZzCHV";

export default function DiscordWidget({
  variant = "card",
  showIframe = false,
}) {
  const [widgetData, setWidgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWidget, setShowWidget] = useState(false);
  const [isUserMember, setIsUserMember] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = checking, true/false = result
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    fetchWidgetData();
  }, []);

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

  const checkUserMembership = async () => {
    try {
      const session = await account.getSession("current");

      if (session?.provider === "discord" && session?.providerAccessToken) {
        const { isMember } = await checkDiscordMembership(
          session.providerAccessToken,
        );
        setIsUserMember(isMember);
      } else {
        // Check if user has Discord identity linked (even if logged in via Google)
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
      // User not logged in
      setIsLoggedIn(false);
    }
  };

  // Floating button variant (bottom-right corner)
  if (variant === "floating") {
    return (
      <>
        {/* Floating Button */}
        <button
          onClick={() => setShowWidget(!showWidget)}
          className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 transition-all hover:scale-110 hover:bg-indigo-500 active:scale-95"
        >
          {showWidget ? (
            <X className="h-6 w-6" />
          ) : (
            <FaDiscord className="h-7 w-7" />
          )}
          {!showWidget && widgetData && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold">
              {widgetData.presence_count}
            </span>
          )}
        </button>

        {/* Popup Widget */}
        {showWidget && (
          <div className="animate-in slide-in-from-bottom-4 fixed right-6 bottom-24 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <WidgetContent
              data={widgetData}
              loading={loading}
              error={error}
              onRefresh={fetchWidgetData}
              isUserMember={isUserMember}
              isLoggedIn={isLoggedIn}
            />
          </div>
        )}
      </>
    );
  }

  // Card variant (inline)
  if (variant === "card") {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <WidgetContent
          data={widgetData}
          loading={loading}
          error={error}
          onRefresh={fetchWidgetData}
          isUserMember={isUserMember}
          isLoggedIn={isLoggedIn}
        />
      </div>
    );
  }

  // Compact variant (just shows online count)
  if (variant === "compact") {
    return (
      <a
        href={DISCORD_INVITE}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-2.5 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/20"
      >
        <FaDiscord className="h-5 w-5 text-indigo-400" />
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

  // Iframe variant (embeds Discord's official widget)
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

// Widget content component
function WidgetContent({
  data,
  loading,
  error,
  onRefresh,
  isUserMember = false,
  isLoggedIn = null,
}) {
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

  return (
    <div>
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-indigo-500 p-4">
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaDiscord className="h-8 w-8 text-white" />
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
        </div>
      </div>

      {/* Members List */}
      <div className="max-h-64 overflow-y-auto p-3">
        {/* Voice Channels */}
        {data?.channels?.filter((c) => c.id).length > 0 && (
          <div className="mb-3">
            <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
              Voice Channels
            </p>
            <div className="space-y-1">
              {data.channels
                .filter((c) => c.id)
                .slice(0, 3)
                .map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-2"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs font-medium text-slate-300">
                      {channel.name}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Online Members */}
        <div>
          <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
            Online Members
          </p>
          <div className="space-y-1">
            {data?.members?.slice(0, 8).map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-800/50"
              >
                <div className="relative">
                  <img
                    src={member.avatar_url}
                    alt={member.username}
                    className="h-7 w-7 rounded-full"
                  />
                  <span
                    className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 ${
                      member.status === "online"
                        ? "bg-emerald-500"
                        : member.status === "idle"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                  />
                </div>
                <span className="truncate text-sm font-medium text-slate-200">
                  {member.username}
                </span>
              </div>
            ))}
            {data?.members?.length > 8 && (
              <p className="py-2 text-center text-xs text-slate-500">
                +{data.members.length - 8} more online
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Show based on login/member status */}
      {!isUserMember && (
        <div className="border-t border-white/5 p-3">
          {isLoggedIn === false ? (
            // Not logged in - show login prompt
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login & Join Discord
            </Link>
          ) : (
            // Logged in but not a member - show join server
            <a
              href={data?.instant_invite || DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500"
            >
              Join Server
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
