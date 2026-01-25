"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFreeAgents, deleteFreeAgentPost } from "@/lib/players";
import { getUserProfile } from "@/lib/users";
import {
  getAccount,
  getMMR,
  getMMRByName,
  getPlayerCard,
  getAgents,
} from "@/lib/valorant";
import {
  Trash2,
  Sword,
  Shield,
  Crosshair,
  Zap,
  Brain,
  RefreshCw,
  UserPlus,
  MessageCircle,
  ChevronDown,
  Activity,
} from "lucide-react";
import Loader from "@/components/Loader";
import DualRangeSlider from "@/components/DualRangeSlider";
import Link from "next/link";
import { rankIcons } from "@/assets/images/ranks";
import { agentIcons } from "@/assets/images/agents";
import { ScoutingReportModal } from "../profile/components";
import { useProfileData, useScoutingReport } from "../profile/hooks";
import { CheckCircle, XCircle, Info, AlertCircle } from "lucide-react";

// Fallback icon
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

// Global Memory Cache
const GLOBAL_CACHE = {
  valorantAgents: null,
  playerProfiles: new Map(), // key: name#tag
};

export default function PlayerFinderPage() {
  const { user, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use Profile hooks to manage the scouting report
  const {
    valProfile,
    mmrData,
    availableAgents: modalAgents,
    userPost,
    setUserPost,
  } = useProfileData(user, authLoading);

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const notify = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  const { showForm, setShowForm, posting, formData, setFormData, handlePost } =
    useScoutingReport({ user, userPost, setUserPost, notify, mmrData });

  const [availableAgents, setAvailableAgents] = useState([]);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState([]); // Array for multi-select
  const [regionFilter, setRegionFilter] = useState([]); // Array for multi-select
  const [mainAgentFilter, setMainAgentFilter] = useState("All Agents");
  const [discordFilter, setDiscordFilter] = useState(false); // New Discord Filter
  // const [eloFilter, setEloFilter] = useState("All Ranks"); // Replaced by Range
  const [eloRange, setEloRange] = useState({ min: 0, max: 2000 }); // Max Elo roughly 2000+? adjustable

  useEffect(() => {
    loadAgents();
  }, [userPost]);

  useEffect(() => {
    if (GLOBAL_CACHE.valorantAgents) {
      setAvailableAgents(GLOBAL_CACHE.valorantAgents);
    } else {
      getAgents()
        .then((res) => {
          GLOBAL_CACHE.valorantAgents = res.data;
          setAvailableAgents(res.data);
        })
        .catch(console.error);
    }
  }, []);

  const loadAgents = async () => {
    try {
      const data = await getFreeAgents();
      setAgents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const RoleIcon = ({ role }) => {
    const Icon = ROLE_ICONS[role] || Crosshair;
    return <Icon className="h-4 w-4" />;
  };

  const filteredAgents = agents.filter((agent) => {
    // Handle mainAgent being either a string or an array of strings
    const mainAgentSearchMatch = Array.isArray(agent.mainAgent)
      ? agent.mainAgent.some((m) =>
          m?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : agent.mainAgent?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSearch =
      agent.ingameName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mainAgentSearchMatch;

    // Multi-select logic: if array is empty, match all. Else check inclusion.
    const matchesRole =
      roleFilter.length === 0 || roleFilter.includes(agent.role);

    const matchesRegion =
      regionFilter.length === 0 ||
      regionFilter.includes(agent.region?.toLowerCase());

    const matchesMainAgent =
      mainAgentFilter === "All Agents" ||
      (Array.isArray(agent.mainAgent)
        ? agent.mainAgent.some(
            (m) => m?.toLowerCase() === mainAgentFilter.toLowerCase(),
          )
        : agent.mainAgent?.toLowerCase() === mainAgentFilter.toLowerCase());

    const matchesDiscord =
      !discordFilter || agent.discordTag || agent.discordUsername;

    // Note: Elo filtering is not fully supported as rank is not in DB.
    // We would need to fetch all ranks to filter accurately, which is too expensive.
    // For now, this filter might be visual or client-side only if we lift state later.
    const matchesElo = true;

    return (
      matchesSearch &&
      matchesRole &&
      matchesRegion &&
      matchesMainAgent &&
      matchesDiscord &&
      matchesElo
    );
  });

  const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(true); // Default open
  const [isRegionFilterOpen, setIsRegionFilterOpen] = useState(false);
  const [isMainAgentFilterOpen, setIsMainAgentFilterOpen] = useState(false);
  const [isEloFilterOpen, setIsEloFilterOpen] = useState(false);
  const [isSocialFilterOpen, setIsSocialFilterOpen] = useState(true); // Default open
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false); // Collapsible on mobile

  const handleEloChange = useCallback(({ min, max }) => {
    setEloRange((prev) => {
      if (prev.min === min && prev.max === max) return prev;
      return { min, max };
    });
  }, []);

  const toggleRole = (role) => {
    setRoleFilter((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const toggleRegion = (region) => {
    setRegionFilter((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region],
    );
  };

  // Custom Checkbox Component
  const Checkbox = ({ checked }) => (
    <div
      className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
        checked
          ? "border-rose-500 bg-rose-500 text-white"
          : "border-slate-600 bg-transparent"
      }`}
    >
      {checked && <div className="h-2 w-2 rounded-full bg-white" />}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-6 border-b border-white/5 pb-8 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 px-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <h2 className="text-[11px] font-black tracking-[0.3em] text-rose-500 uppercase">
                Operations Center
              </h2>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic md:text-4xl">
              <span className="text-rose-500 underline decoration-rose-500/30 underline-offset-8">
                Player
              </span>{" "}
              Finder
            </h1>
            <p className="mt-4 text-xs font-bold tracking-widest text-slate-500 uppercase">
              Agent Directory • Active Listings
            </p>
          </div>
          <button
            onClick={() => {
              if (!user)
                return notify("Please login to post a listing", "error");
              if (!valProfile)
                return notify(
                  "Please link your Riot account in your Profile first",
                  "error",
                );
              setShowForm(true);
            }}
            className="group flex w-full items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 px-8 py-4 text-[11px] font-black tracking-[0.2em] text-white uppercase shadow-2xl shadow-rose-600/30 transition-all hover:scale-[1.02] hover:from-rose-500 hover:to-rose-600 active:scale-95 md:w-auto"
          >
            <UserPlus className="h-5 w-5" />
            {userPost ? "Update Your Listing" : "Post Your Listing"}
          </button>
        </div>

        {/* Layout Container */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Mobile Search (Visible only on mobile) */}
          <div className="relative lg:hidden">
            <input
              type="text"
              placeholder="Search by name or agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-4 pl-12 text-sm text-white transition-all outline-none focus:border-rose-500 focus:shadow-[0_0_20px_rgba(244,63,94,0.1)]"
            />
            <Crosshair className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-500" />
          </div>

          {/* Sidebar Filters (Desktop: Left, Mobile: Top Stack) */}
          <aside className="w-full shrink-0 space-y-4 lg:w-64">
            <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-6 backdrop-blur-sm">
              <div
                className={`${isMobileFiltersOpen ? "mb-6 border-b pb-4" : "mb-0 border-none pb-0"} flex cursor-pointer items-center justify-between border-white/10 lg:mb-6 lg:cursor-default lg:border-none lg:pb-0`}
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-widest text-white uppercase">
                    Filters
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform lg:hidden ${isMobileFiltersOpen ? "rotate-180" : ""}`}
                  />
                </div>
                {(roleFilter.length > 0 ||
                  regionFilter.length > 0 ||
                  discordFilter ||
                  mainAgentFilter !== "All Agents" ||
                  eloRange.min > 0 ||
                  eloRange.max < 2000) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoleFilter([]);
                      setRegionFilter([]);
                      setMainAgentFilter("All Agents");
                      setDiscordFilter(false);
                      setEloRange({ min: 0, max: 2000 });
                    }}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-400 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div
                className={`flex flex-col gap-6 ${isMobileFiltersOpen ? "flex" : "hidden lg:flex"}`}
              >
                {/* Role Filter (Accordion) */}
                <div className="border-b border-white/5 pb-6">
                  <button
                    onClick={() => setIsRoleFilterOpen(!isRoleFilterOpen)}
                    className="flex w-full items-center justify-between text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-white"
                  >
                    <span>Role</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isRoleFilterOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isRoleFilterOpen && (
                    <div className="mt-4 space-y-2">
                      {/* "All Roles" logic isn't strictly needed for UI if we trust the "empty = all" logic,
                           but showing it or just the options is fine. Reference suggests checking "All" or specific items.
                           For simplicity in multi-select, usually "All" clears the specific selections.
                       */}
                      {Object.keys(ROLE_ICONS).map((role) => {
                        const Icon = ROLE_ICONS[role];
                        const isSelected = roleFilter.includes(role);
                        return (
                          <button
                            key={role}
                            onClick={() => toggleRole(role)}
                            className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-all hover:bg-white/5 ${
                              isSelected ? "text-white" : "text-slate-400"
                            }`}
                          >
                            <Checkbox checked={isSelected} />
                            <Icon
                              className={`h-4 w-4 ${isSelected ? "text-rose-500" : "text-slate-500"}`}
                            />
                            <span>{role}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Main Agent Filter (Accordion) */}
                <div className="border-b border-white/5 pb-6">
                  <button
                    onClick={() =>
                      setIsMainAgentFilterOpen(!isMainAgentFilterOpen)
                    }
                    className="flex w-full items-center justify-between text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-white"
                  >
                    <span>Main Agent</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isMainAgentFilterOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isMainAgentFilterOpen && (
                    <div className="mt-4">
                      <button
                        onClick={() => setMainAgentFilter("All Agents")}
                        className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-all hover:bg-white/5 ${
                          mainAgentFilter === "All Agents"
                            ? "text-rose-500"
                            : "text-slate-400"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border ${mainAgentFilter === "All Agents" ? "border-rose-500 bg-rose-500" : "border-slate-600"}`}
                        >
                          {mainAgentFilter === "All Agents" && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </span>
                        All Agents
                      </button>

                      <div className="custom-scrollbar mt-2 max-h-60 space-y-1 overflow-y-auto pr-2">
                        {availableAgents
                          .sort((a, b) =>
                            a.displayName.localeCompare(b.displayName),
                          )
                          .map((agent) => {
                            const isSelected =
                              mainAgentFilter === agent.displayName;
                            return (
                              <button
                                key={agent.uuid}
                                onClick={() =>
                                  setMainAgentFilter(agent.displayName)
                                }
                                className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-all hover:bg-white/5 ${
                                  isSelected ? "text-white" : "text-slate-400"
                                }`}
                              >
                                <span
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? "border-rose-500 bg-rose-500" : "border-slate-600"}`}
                                >
                                  {isSelected && (
                                    <div className="h-2 w-2 rounded-full bg-white" />
                                  )}
                                </span>
                                {agent.displayIcon && (
                                  <img
                                    src={agent.displayIcon}
                                    alt=""
                                    className="h-5 w-5 rounded-full object-cover"
                                  />
                                )}
                                <span className="truncate">
                                  {agent.displayName}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Elo Filter (Accordion) */}
                <div className="border-b border-white/5 pb-6">
                  <button
                    onClick={() => setIsEloFilterOpen(!isEloFilterOpen)}
                    className="flex w-full items-center justify-between text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-white"
                  >
                    <span>Rank / Elo</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isEloFilterOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isEloFilterOpen && (
                    <div className="mt-6 px-2">
                      <DualRangeSlider
                        min={0}
                        max={2000}
                        initialMin={eloRange.min}
                        initialMax={eloRange.max}
                        onChange={handleEloChange}
                      />
                      <div className="mt-4 flex justify-between text-[10px] font-bold text-slate-500">
                        <span>0 Elo</span>
                        <span>2000+ Elo</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Region Filter (Accordion) */}
                <div className="border-b border-white/5 pb-6">
                  <button
                    onClick={() => setIsRegionFilterOpen(!isRegionFilterOpen)}
                    className="flex w-full items-center justify-between text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-white"
                  >
                    <span>Region</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isRegionFilterOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isRegionFilterOpen && (
                    <div className="mt-4 space-y-2">
                      {[
                        { value: "ap", label: "Asia Pacific" },
                        { value: "eu", label: "Europe" },
                        { value: "na", label: "North America" },
                        { value: "kr", label: "Korea" },
                        { value: "latam", label: "LATAM" },
                        { value: "br", label: "Brazil" },
                      ].map((option) => {
                        const isSelected = regionFilter.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            onClick={() => toggleRegion(option.value)}
                            className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-all hover:bg-white/5 ${
                              isSelected ? "text-white" : "text-slate-400"
                            }`}
                          >
                            <Checkbox checked={isSelected} />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Socials Filter (Accordion) */}
                <div className="pb-2">
                  <button
                    onClick={() => setIsSocialFilterOpen(!isSocialFilterOpen)}
                    className="flex w-full items-center justify-between text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-white"
                  >
                    <span>Socials</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isSocialFilterOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isSocialFilterOpen && (
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => setDiscordFilter(!discordFilter)}
                        className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-all hover:bg-white/5 ${
                          discordFilter ? "text-white" : "text-slate-400"
                        }`}
                      >
                        <Checkbox checked={discordFilter} />
                        <span>Discord Available</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content (Search + Grid) */}
          <main className="flex-1">
            <div className="relative mb-6 hidden lg:block">
              <input
                type="text"
                placeholder="Search by name or agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-4 pl-12 text-sm text-white transition-all outline-none focus:border-rose-500 focus:shadow-[0_0_20px_rgba(244,63,94,0.1)]"
              />
              <Crosshair className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-500" />
            </div>

            {loading ? (
              <Loader fullScreen={false} />
            ) : filteredAgents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 py-24 text-center">
                <p className="mb-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                  No Results Found
                </p>
                <p className="mb-6 text-sm text-slate-600">
                  Try adjusting your filters or search terms.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter([]);
                    setRegionFilter([]);
                    setMainAgentFilter("All Agents");
                    setDiscordFilter(false);
                    setEloRange({ min: 0, max: 2000 });
                  }}
                  className="mx-auto flex items-center justify-center gap-2 text-xs font-black tracking-widest text-rose-500 uppercase hover:text-rose-400"
                >
                  <RefreshCw className="h-3 w-3" />
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-2">
                {filteredAgents.map((agent) => (
                  <AgentCard
                    key={agent.$id}
                    agent={agent}
                    currentUser={user}
                    RoleIcon={RoleIcon}
                    availableAgents={availableAgents}
                    eloRange={eloRange}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
      {/* Player Finder Form Modal */}
      <ScoutingReportModal
        isOpen={showForm && !!valProfile}
        onClose={() => setShowForm(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handlePost}
        userPost={userPost}
        mmrData={mmrData}
        availableAgents={modalAgents}
        posting={posting}
      />

      {/* Notification UI */}
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

function AgentCard({
  agent,
  currentUser,
  RoleIcon,
  availableAgents,
  eloRange,
}) {
  const [valData, setValData] = useState(null);
  const [discordProfile, setDiscordProfile] = useState({
    tag: agent.discordTag,
    username: agent.discordUsername,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const executeFetch = async () => {
      const name = agent.tag
        ? agent.ingameName
        : agent.ingameName?.split("#")[0];
      const tag = agent.tag || agent.ingameName?.split("#")[1];
      const cacheKey = `${name}#${tag}`.toLowerCase();

      // 1. Check Memory Cache
      if (GLOBAL_CACHE.playerProfiles.has(cacheKey)) {
        setValData(GLOBAL_CACHE.playerProfiles.get(cacheKey));
        setLoading(false);
        return;
      }

      // 2. Fetch if not cached
      setLoading(true);
      try {
        if (!name || !tag) return;

        const accountRes = await getAccount(name, tag);
        if (accountRes.data) {
          let cardData = null;
          let mmrData = null;

          // Fetch Card Assets
          if (accountRes.data.card) {
            try {
              const cardRes = await getPlayerCard(accountRes.data.card);
              cardData = cardRes.data;
            } catch (e) {
              console.warn("Card asset fetch failed:", e);
            }
          }

          // Fetch MMR/Rank
          try {
            const region = agent.region || accountRes.data.region || "ap";
            const mmrRes = await getMMR(accountRes.data.puuid, region);
            mmrData = mmrRes.data;
          } catch (e) {
            try {
              const region = agent.region || accountRes.data.region || "ap";
              const mmrRes = await getMMRByName(region, name, tag);
              mmrData = mmrRes.data;
            } catch (e2) {
              console.warn("MMR fallback failed:", e2);
            }
          }

          const finalData = {
            account: accountRes.data,
            mmr: mmrData,
            card: cardData,
          };

          // Update State & Cache
          setValData(finalData);
          GLOBAL_CACHE.playerProfiles.set(cacheKey, finalData);
        }

        // 2.5 Fallback Discord Check (for old posts)
        if (!agent.discordTag && agent.userId) {
          const profile = await getUserProfile(agent.userId);
          if (profile?.discordTag) {
            setDiscordProfile({
              tag: profile.discordTag,
              username: profile.discordUsername,
            });
          }
        }
      } catch (e) {
        console.error("AgentCard profile fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    executeFetch();
  }, [agent.ingameName]);

  // Client-side Elo Filtering
  // Only filter if we have fetched the Elo data successfully
  // If still loading or no Elo data found, we keep the card visible to be safe
  const currentElo = valData?.mmr?.current_data?.elo;
  if (!loading && currentElo !== undefined && currentElo !== null) {
    if (currentElo < eloRange.min || currentElo > eloRange.max) {
      return null;
    }
  }

  const rankDisplay =
    valData?.mmr?.current_data?.currenttierpatched || "Unranked";
  const currentTier = valData?.mmr?.current_data?.currenttier;
  const rankImage =
    typeof rankIcons[currentTier] === "object"
      ? rankIcons[currentTier]?.src
      : rankIcons[currentTier] ||
        valData?.mmr?.current_data?.images?.large ||
        valData?.mmr?.current_data?.images?.small;
  const wideCard = valData?.card?.wideArt;
  const playerCard = valData?.card?.smallArt;

  return (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-b-4 border-white/10 bg-slate-900/50 p-6 transition-all hover:bg-slate-900/80"
      style={{
        borderBottomColor: rankDisplay?.includes("Platinum")
          ? "#22d3ee"
          : rankDisplay?.includes("Diamond")
            ? "#c084fc"
            : rankDisplay?.includes("Ascendant")
              ? "#10b981"
              : rankDisplay?.includes("Gold")
                ? "#facc15"
                : "#475569",
      }}
    >
      {/* Wide Card Background */}
      {wideCard && (
        <div
          className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center opacity-[0.10] transition-opacity duration-500 group-hover:scale-100 group-hover:opacity-[0.20]"
          style={{ backgroundImage: `url(${wideCard})` }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

      {/* Large Decorative Rank Icon */}
      {!loading && rankImage && (
        <div className="pointer-events-none absolute -top-2 -right-2 opacity-100 transition-all duration-1000 group-hover:scale-110 group-hover:rotate-12 group-hover:opacity-60">
          <img src={rankImage} alt="" className="h-32 w-32 object-contain" />
        </div>
      )}

      <div className="relative z-10 mb-6 flex items-start gap-4">
        {/* Player Card Thumbnail */}
        <div className="relative flex shrink-0 flex-col items-center">
          <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-slate-950 bg-slate-800 shadow-xl">
            {loading ? (
              <div className="flex h-full w-full items-center justify-center bg-slate-900">
                <Loader fullScreen={false} size="sm" />
              </div>
            ) : playerCard ? (
              <img
                src={playerCard}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-700">
                <Crosshair className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* Level Badge - Relocated here */}
          {!loading && valData?.account?.account_level && (
            <div className="mt-2 flex h-5.5 w-full items-center justify-center rounded border border-white/10 bg-rose-600 shadow-lg shadow-rose-600/20">
              <span className="text-[9px] leading-none font-black tracking-widest text-white uppercase">
                lvl {valData.account.account_level}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden pt-0.5">
          <h3 className="truncate text-lg font-black tracking-tight text-white">
            {agent.tag ? agent.ingameName : agent.ingameName?.split("#")[0]}
            <span className="ml-1 text-sm text-slate-500 select-none">
              #{agent.tag || agent.ingameName?.split("#")[1]}
            </span>
          </h3>
          <div className="mt-2.5 flex flex-col gap-2">
            <div className="flex w-fit items-center gap-1.5 rounded border border-white/5 bg-black/40 px-2 py-0.5 backdrop-blur-md">
              {!loading && rankImage && (
                <img
                  src={rankImage}
                  alt=""
                  className="h-4 w-4 object-contain"
                />
              )}
              <span
                className={`text-[9px] font-black tracking-widest uppercase ${
                  rankDisplay?.includes("Platinum")
                    ? "text-cyan-400"
                    : rankDisplay?.includes("Diamond")
                      ? "text-purple-400"
                      : rankDisplay?.includes("Ascendant")
                        ? "text-emerald-400"
                        : rankDisplay?.includes("Gold")
                          ? "text-yellow-400"
                          : "text-slate-400"
                } `}
              >
                {rankDisplay}
              </span>
            </div>

            {/* Preferred Role Badge */}
            <div className="flex flex-wrap gap-2">
              <div
                className={`flex h-6 w-fit items-center gap-1.5 rounded border px-2 backdrop-blur-md ${
                  agent.role === "Duelist"
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                    : agent.role === "Controller"
                      ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
                      : agent.role === "Sentinel"
                        ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                        : agent.role === "Initiator"
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                          : "border-white/5 bg-slate-500/10 text-slate-400"
                } `}
              >
                <RoleIcon role={agent.role} />
                <span className="text-[9px] leading-none font-black tracking-widest uppercase">
                  {agent.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Icons Display */}
      <div className="relative z-10 mb-6">
        <div className="flex flex-wrap items-start gap-2 md:gap-3 lg:gap-6">
          {/* Main Agent(s) */}
          {/* Main Agents Group */}
          {(Array.isArray(agent.mainAgent)
            ? agent.mainAgent
            : agent.mainAgent
              ? [agent.mainAgent]
              : []
          ).length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[9px] leading-none font-black tracking-[0.2em] text-rose-500 uppercase">
                Main
              </span>
              <div className="flex -space-x-4">
                {(Array.isArray(agent.mainAgent)
                  ? agent.mainAgent
                  : [agent.mainAgent]
                ).map((mainName, mIdx) => {
                  const agentInfo = availableAgents.find(
                    (a) =>
                      a.displayName?.toLowerCase() === mainName?.toLowerCase(),
                  );
                  const icon =
                    typeof agentIcons[agentInfo?.displayName] === "object"
                      ? agentIcons[agentInfo?.displayName]?.src
                      : agentIcons[agentInfo?.displayName] ||
                        agentInfo?.displayIcon;

                  return (
                    <div
                      key={mIdx}
                      className="group/main relative transition-all hover:z-10"
                      title={mainName}
                    >
                      <div className="absolute -inset-1 rounded-xl bg-rose-500/20 opacity-30 blur transition-opacity group-hover/main:opacity-60" />
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl border-2 border-rose-500 bg-slate-950 shadow-xl shadow-rose-500/10 transition-transform group-hover/main:scale-105">
                        {icon ? (
                          <img
                            src={icon}
                            alt={mainName}
                            className="h-full w-full scale-110 object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-[10px] font-black text-rose-500 uppercase">
                            {mainName?.substring(0, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Secondary Agents */}
          {agent.secondaryAgents && agent.secondaryAgents.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[9px] leading-none font-black tracking-[0.2em] text-slate-500 uppercase">
                Secondary Agents
              </span>
              <div className="flex -space-x-2 md:-space-x-3">
                {agent.secondaryAgents.slice(0, 5).map((name, idx) => {
                  const agentInfo = availableAgents.find(
                    (a) => a.displayName?.toLowerCase() === name?.toLowerCase(),
                  );
                  const icon =
                    typeof agentIcons[agentInfo?.displayName] === "object"
                      ? agentIcons[agentInfo?.displayName]?.src
                      : agentIcons[agentInfo?.displayName] ||
                        agentInfo?.displayIcon;
                  return (
                    <div
                      key={idx}
                      className="relative h-11 w-11 cursor-help overflow-hidden rounded-xl border-2 border-slate-950 bg-slate-900 shadow-lg transition-all hover:z-10 hover:scale-110 lg:h-12 lg:w-12"
                      title={name}
                    >
                      {icon ? (
                        <img
                          src={icon}
                          alt={name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-slate-500">
                          {name?.substring(0, 1)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-auto pt-4">
        {/* Stats Grid */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          {/* ELO Intelligence Score */}
          {!loading && valData?.mmr?.current_data?.elo ? (
            <div className="group/elo relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2 transition-colors hover:bg-slate-950/50">
              <div className="pointer-events-none absolute -top-4 -right-4 text-slate-800 transition-colors group-hover/elo:text-slate-700">
                <Activity className="h-12 w-12 opacity-20" strokeWidth={1} />
              </div>
              <div className="relative z-10 flex h-full flex-col justify-center">
                <h4 className="mb-0.5 text-[7px] font-black tracking-widest text-slate-500 uppercase">
                  Intelligence
                </h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black tracking-tighter text-white transition-all group-hover/elo:text-rose-500">
                    {valData.mmr.current_data.elo}
                  </span>
                  <span className="text-[8px] font-bold tracking-widest text-slate-600 uppercase">
                    ELO
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Discord - Spans 2 cols if no ELO */}
          <div
            className={`${!loading && valData?.mmr?.current_data?.elo ? "" : "col-span-2"}`}
          >
            {discordProfile.tag ? (
              <div className="group/discord relative overflow-hidden rounded-xl border border-[#5865F2]/20 bg-[#5865F2]/10 px-3 py-2 transition-colors hover:bg-[#5865F2]/20">
                <div className="pointer-events-none absolute -top-4 -right-4 text-slate-800 transition-colors group-hover/discord:text-slate-700">
                  <MessageCircle
                    className="h-12 w-12 opacity-20"
                    strokeWidth={1}
                  />
                </div>
                <div className="relative z-10 flex h-full flex-col justify-center">
                  <h4 className="mb-0.5 text-[7px] font-black tracking-widest text-slate-500 uppercase">
                    Discord
                  </h4>
                  <div className="flex items-baseline gap-1">
                    <span className="truncate text-lg font-black tracking-tighter text-white transition-all group-hover/discord:text-[#5865F2]">
                      {discordProfile.tag || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="group/discord relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2 opacity-50">
                <div className="pointer-events-none absolute -top-4 -right-4 text-slate-800">
                  <MessageCircle
                    className="h-12 w-12 opacity-20"
                    strokeWidth={1}
                  />
                </div>
                <div className="relative z-10 flex h-full flex-col justify-center">
                  <h4 className="mb-0.5 text-[7px] font-black tracking-widest text-slate-500 uppercase">
                    Discord
                  </h4>
                  <span className="text-sm font-bold tracking-tight text-slate-500">
                    Not Provided
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
          <Brain className="h-3 w-3" />
          Scouting Report
        </div>
        <p className="mb-6 line-clamp-2 min-h-[40px] border-l-2 border-rose-500/30 pl-3 text-sm leading-relaxed text-slate-300 italic">
          "{agent.description}"
        </p>

        <Link
          href={`/player/${agent.userId}`}
          className="group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/5 bg-slate-950 py-3 text-xs font-black tracking-[0.2em] text-white uppercase transition-all duration-300 hover:border-rose-500 hover:bg-rose-600"
        >
          <span className="relative z-10 flex items-center gap-2">
            View Player Profile
            <RefreshCw className="h-3 w-3 transition-transform duration-500 group-hover/btn:rotate-180" />
          </span>
        </Link>
      </div>
    </div>
  );
}
