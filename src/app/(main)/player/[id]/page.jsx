"use client";
import { useEffect, useState, use } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import {
  User,
  Trophy,
  Crosshair,
  MapPin,
  Gauge,
  Activity,
  Sword,
  Skull,
  Target,
  Medal,
  Crown,
  Swords,
  DollarSign,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { rankIcons } from "@/assets/images/ranks";
import Loader from "@/components/Loader";
import {
  getAccount,
  getMMR,
  getMMRByName,
  getMatches,
  getPlayerCard,
} from "@/lib/valorant";

// Assuming we have these from your config:
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users";
const REGISTRATIONS_COLLECTION_ID = "registrations";

export default function PublicProfilePage({ params }) {
  const { id } = use(params);
  const [profile, setProfile] = useState(null);
  const [valorantStats, setValorantStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      // 1. Fetch Appwrite User Document
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        id,
      );
      setProfile(userDoc);

      // 2. Fetch Appwrite Stats (Tournaments)
      const registrations = await databases.listDocuments(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        [Query.equal("userId", id)],
      );
      setDbStats({
        tournamentsPlayed: registrations.total,
        totalEarnings: userDoc.totalEarnings || 0,
        tournamentsWon: userDoc.tournamentsWon || 0,
        matchesWon: userDoc.matchesWon || 0,
        runnerUp: userDoc.runnerUp || 0,
      });

      // 3. Fetch Valorant Stats (if linked)
      if (userDoc.ingameName && userDoc.tag) {
        try {
          const accountData = await getAccount(userDoc.ingameName, userDoc.tag);

          if (accountData.data) {
            const region = userDoc.region || accountData.data.region || "ap";
            setValorantStats({
              account: accountData.data,
              mmr: null,
              card: null,
            });

            // 1. Fetch Card Data first
            if (accountData.data.card) {
              try {
                const cardRes = await getPlayerCard(accountData.data.card);
                if (cardRes?.data) {
                  setValorantStats((prev) => ({ ...prev, card: cardRes.data }));
                }
              } catch (e) {
                console.error("Card fetch failed:", e);
              }
            }

            // 2. Fetch MMR and Matches
            try {
              const fetchedMMR = await getMMR(
                accountData.data.puuid,
                region,
              ).catch(async (e) => {
                console.error(
                  "MMR fetch by PUUID failed for profile, trying Name/Tag fallback...",
                  e,
                );
                return await getMMRByName(
                  region,
                  userDoc.ingameName,
                  userDoc.tag,
                ).catch(() => null);
              });

              const fetchedMatches = await getMatches(
                accountData.data.puuid,
                region,
              ).catch(() => ({ data: [] }));

              setValorantStats((prev) => ({
                ...prev,
                mmr: fetchedMMR?.data || null,
              }));
              setMatches(fetchedMatches?.data || []);
            } catch (e) {
              console.error("MMR/Matches fetch failed:", e);
            }
          }
        } catch (apiError) {
          console.error("Valorant API Error:", apiError);
        }
      }
    } catch (e) {
      console.error(e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (!profile)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 pt-24 text-white">
        <h1 className="mb-4 text-4xl font-bold">User Not Found</h1>
        <p className="text-slate-400">
          The player you are looking for does not exist or has a private
          profile.
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 selection:bg-rose-500/30">
      {/* Immersive Hero Section */}
      <section className="relative min-h-[50vh] overflow-hidden pt-20 pb-12">
        {/* Background Layer */}
        <div className="absolute inset-0">
          {valorantStats?.card?.wideArt && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm transition-all duration-1000"
              style={{ backgroundImage: `url(${valorantStats.card.wideArt})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        {/* Decorative Rank Glow */}
        {valorantStats?.mmr?.current_data?.images?.large && (
          <div className="pointer-events-none absolute top-1/2 right-0 translate-x-1/4 -translate-y-1/2 opacity-10 blur-2xl md:opacity-20">
            <img
              src={valorantStats.mmr.current_data.images.large}
              alt=""
              className="h-[500px] w-[500px] object-contain"
            />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6">
          {/* Top Bar */}
          <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="h-1 w-8 rounded-full bg-rose-500" />
                <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
                  Public Record
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight italic md:text-4xl">
                <span className="text-white">PLAYER </span>
                <span className="text-rose-500">PROFILE</span>
              </h1>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-2.5 backdrop-blur-md">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <div className="flex flex-col">
                <span className="text-[10px] leading-none font-black tracking-widest text-white uppercase">
                  Live Sync
                </span>
                <span className="text-[9px] font-bold tracking-tight text-slate-500 uppercase">
                  Verified Agent Data
                </span>
              </div>
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-12">
            {/* Player Card & Level */}
            <div className="group relative shrink-0">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-rose-500/20 to-transparent opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
              <div className="relative h-36 w-36 overflow-hidden rounded-2xl border-4 border-slate-900 bg-slate-800 shadow-2xl md:h-44 md:w-44">
                {valorantStats?.card?.smallArt ? (
                  <img
                    src={valorantStats.card.smallArt}
                    alt="Player Card"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-20 w-20 text-slate-700" />
                  </div>
                )}
              </div>
              {valorantStats?.account?.account_level && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-rose-500/30 bg-rose-600 px-4 py-1.5 text-[10px] font-black tracking-widest whitespace-nowrap text-white uppercase shadow-lg shadow-rose-600/20">
                  LVL {valorantStats.account.account_level}
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="mb-4 text-4xl font-black tracking-tighter text-white md:text-6xl">
                {profile.ingameName}
                <span className="ml-2 text-2xl font-bold text-slate-600 md:text-3xl">
                  #{profile.tag}
                </span>
              </h1>

              {/* Quick Badges */}
              <div className="flex flex-wrap justify-center gap-2 md:justify-start md:gap-3">
                {valorantStats?.mmr?.current_data?.currenttierpatched && (
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
                    {valorantStats.mmr.current_data.images?.small && (
                      <img
                        src={valorantStats.mmr.current_data.images.small}
                        alt=""
                        className="h-5 w-5"
                      />
                    )}
                    <span className="text-[10px] font-black tracking-widest text-white uppercase">
                      {valorantStats.mmr.current_data.currenttierpatched}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {valorantStats?.account?.region || profile.region || "AP"}
                  </span>
                </div>
                {profile.discordTag && (
                  <div className="flex items-center gap-2 rounded-full border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-2 backdrop-blur-md">
                    <svg
                      className="h-4 w-4 text-[#5865F2]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    <span className="text-[10px] font-bold text-[#5865F2]/70 uppercase">
                      Discord
                    </span>
                    <span className="text-[10px] font-black tracking-widest text-white uppercase">
                      {profile.discordTag}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 backdrop-blur-md">
                  <Trophy className="h-4 w-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-500/70 uppercase">
                    Tournaments
                  </span>
                  <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                    {dbStats?.tournamentsPlayed || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-12 md:px-6">
        {/* Bento Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-12">
          {/* Earnings - Large Card */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm md:col-span-5 md:p-8">
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-[80px] transition-all group-hover:bg-emerald-500/20" />
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                  Platform Earnings
                </span>
              </div>
              <p className="font-mono text-4xl font-black tracking-tighter text-white md:text-5xl">
                ₹{(dbStats?.totalEarnings || 0).toLocaleString()}
              </p>
              <p className="mt-2 text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                Total Prize Money
              </p>
            </div>
          </div>

          {/* Tournament Stats - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4 md:col-span-4">
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-sm transition-all hover:border-amber-500/20">
              <Crown className="absolute -top-2 -right-2 h-16 w-16 text-amber-500/10 transition-colors group-hover:text-amber-500/20" />
              <div className="relative z-10">
                <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">
                  Championships
                </span>
                <p className="mt-1 text-3xl font-black text-white">
                  {dbStats?.tournamentsWon || 0}
                </p>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-sm transition-all hover:border-slate-400/20">
              <Medal className="absolute -top-2 -right-2 h-16 w-16 text-slate-500/10 transition-colors group-hover:text-slate-500/20" />
              <div className="relative z-10">
                <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">
                  Runner Up
                </span>
                <p className="mt-1 text-3xl font-black text-white">
                  {dbStats?.runnerUp || 0}
                </p>
              </div>
            </div>
            <div className="group relative col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-sm transition-all hover:border-rose-500/20">
              <Swords className="absolute -top-2 -right-2 h-16 w-16 text-rose-500/10 transition-colors group-hover:text-rose-500/20" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    Matches Won
                  </span>
                  <p className="mt-1 text-3xl font-black text-white">
                    {dbStats?.matchesWon || 0}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    Played
                  </span>
                  <p className="mt-1 text-3xl font-black text-slate-600">
                    {dbStats?.tournamentsPlayed || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ELO Intelligence */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm md:col-span-3">
            <Activity className="absolute -top-4 -right-4 h-24 w-24 text-rose-500/5 transition-colors group-hover:text-rose-500/10" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-rose-500/10 p-2">
                  <Activity className="h-5 w-5 text-rose-500" />
                </div>
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                  Intelligence
                </span>
              </div>
              {valorantStats?.mmr?.current_data?.elo ? (
                <>
                  <p className="font-mono text-4xl font-black tracking-tighter text-white">
                    {valorantStats.mmr.current_data.elo}
                  </p>
                  <p className="mt-2 text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                    ELO Rating
                  </p>
                </>
              ) : (
                <p className="text-lg font-black text-slate-600">N/A</p>
              )}
            </div>
          </div>
        </div>

        {/* Competitive Intelligence - Unified Card */}
        {valorantStats?.mmr?.current_data?.currenttierpatched && (
          <div className="group relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-900/80 backdrop-blur-xl">
            {/* Animated Background Glow */}
            <div
              className={`pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full opacity-30 blur-[120px] transition-all duration-1000 group-hover:opacity-50 ${
                valorantStats?.mmr?.current_data?.currenttierpatched?.includes(
                  "Platinum",
                )
                  ? "bg-cyan-500"
                  : valorantStats?.mmr?.current_data?.currenttierpatched?.includes(
                        "Diamond",
                      )
                    ? "bg-purple-500"
                    : valorantStats?.mmr?.current_data?.currenttierpatched?.includes(
                          "Ascendant",
                        )
                      ? "bg-emerald-500"
                      : valorantStats?.mmr?.current_data?.currenttierpatched?.includes(
                            "Immortal",
                          )
                        ? "bg-rose-500"
                        : valorantStats?.mmr?.current_data?.currenttierpatched?.includes(
                              "Radiant",
                            )
                          ? "bg-yellow-500"
                          : "bg-amber-500"
              }`}
            />

            {/* Grid Pattern Overlay */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

            <div className="relative z-10 p-8 md:p-10">
              {/* Header */}
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 backdrop-blur-md">
                    <Gauge className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-tight text-white uppercase">
                      Competitive Intelligence
                    </h2>
                    <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                      Season Performance
                    </p>
                  </div>
                </div>
                {valorantStats?.mmr?.highest_rank?.patched_tier && (
                  <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 backdrop-blur-md">
                    {rankIcons[valorantStats.mmr.highest_rank.tier] && (
                      <img
                        src={rankIcons[valorantStats.mmr.highest_rank.tier].src}
                        alt="Peak Rank"
                        className="h-6 w-6"
                      />
                    )}
                    <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                      Peak: {valorantStats.mmr.highest_rank.patched_tier}
                    </span>
                  </div>
                )}
              </div>

              {/* Main Content Grid */}
              <div className="grid items-center gap-8 md:grid-cols-3">
                {/* Rank Emblem - Center Focus */}
                <div className="relative flex flex-col items-center justify-center md:col-span-1">
                  <div className="relative">
                    {/* Glow Ring */}
                    <div
                      className={`absolute inset-0 scale-110 rounded-full opacity-40 blur-2xl ${
                        valorantStats?.mmr?.current_data?.currenttierpatched?.includes(
                          "Platinum",
                        )
                          ? "bg-cyan-500"
                          : valorantStats?.mmr?.current_data?.currenttierpatched?.includes(
                                "Diamond",
                              )
                            ? "bg-purple-500"
                            : valorantStats?.mmr?.current_data?.currenttierpatched?.includes(
                                  "Ascendant",
                                )
                              ? "bg-emerald-500"
                              : valorantStats?.mmr?.current_data?.currenttierpatched?.includes(
                                    "Immortal",
                                  )
                                ? "bg-rose-500"
                                : "bg-amber-500"
                      }`}
                    />
                    <img
                      src={valorantStats.mmr.current_data.images.large}
                      alt="Rank"
                      className="relative z-10 h-36 w-36 drop-shadow-2xl transition-transform duration-700 group-hover:scale-110 md:h-44 md:w-44"
                    />
                    {/* MMR Change Badge */}
                    {valorantStats.mmr.current_data.mmr_change_to_last_game !==
                      undefined && (
                      <div
                        className={`absolute -bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border-2 px-4 py-1.5 text-xs font-black shadow-xl ${
                          valorantStats.mmr.current_data
                            .mmr_change_to_last_game >= 0
                            ? "border-emerald-500/50 bg-emerald-500/30 text-emerald-300 shadow-emerald-500/20"
                            : "border-rose-500/50 bg-rose-500/30 text-rose-300 shadow-rose-500/20"
                        }`}
                      >
                        {valorantStats.mmr.current_data
                          .mmr_change_to_last_game >= 0
                          ? "+"
                          : ""}
                        {valorantStats.mmr.current_data.mmr_change_to_last_game}{" "}
                        RR
                      </div>
                    )}
                  </div>
                  <p className="mt-6 text-center text-3xl font-black tracking-tighter text-white md:text-4xl">
                    {valorantStats.mmr.current_data.currenttierpatched}
                  </p>
                </div>

                {/* Stats Grid - Right Side */}
                <div className="space-y-4 md:col-span-2">
                  {/* Top Stats Row */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* ELO */}
                    <div className="group/stat relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                      <Activity className="absolute -top-2 -right-2 h-12 w-12 text-rose-500/10" />
                      <p className="text-[9px] font-black tracking-widest text-slate-500 uppercase">
                        ELO Rating
                      </p>
                      <p className="mt-1 font-mono text-2xl font-black text-white">
                        {valorantStats.mmr.current_data.elo}
                      </p>
                    </div>

                    {/* RR */}
                    <div className="group/stat relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                      <Target className="absolute -top-2 -right-2 h-12 w-12 text-emerald-500/10" />
                      <p className="text-[9px] font-black tracking-widest text-slate-500 uppercase">
                        Current RR
                      </p>
                      <p className="mt-1 font-mono text-2xl font-black text-white">
                        {valorantStats.mmr.current_data.ranking_in_tier}
                        <span className="ml-1 text-sm font-bold text-slate-600">
                          / 100
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Progress to Next Rank */}
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                        Progress to Next Rank
                      </p>
                      <p className="text-sm font-black text-white">
                        {valorantStats.mmr.current_data.ranking_in_tier}
                        <span className="text-slate-600">/100 RR</span>
                      </p>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800/80">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          valorantStats?.mmr?.current_data?.currenttierpatched?.includes(
                            "Platinum",
                          )
                            ? "bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                            : valorantStats?.mmr?.current_data?.currenttierpatched?.includes(
                                  "Diamond",
                                )
                              ? "bg-gradient-to-r from-purple-500 to-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                              : valorantStats?.mmr?.current_data?.currenttierpatched?.includes(
                                    "Ascendant",
                                  )
                                ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                : valorantStats?.mmr?.current_data?.currenttierpatched?.includes(
                                      "Immortal",
                                    )
                                  ? "bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                                  : "bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                        }`}
                        style={{
                          width: `${valorantStats.mmr.current_data.ranking_in_tier}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-right text-[10px] font-bold text-slate-600">
                      {100 - valorantStats.mmr.current_data.ranking_in_tier} RR
                      to next division
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unranked State */}
        {!valorantStats?.mmr?.current_data?.currenttierpatched && (
          <div className="mb-8 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-900/50 p-12 backdrop-blur-sm">
            <div className="relative mb-6">
              <div className="absolute inset-0 scale-150 rounded-full bg-white/5 blur-3xl" />
              <img
                src="https://media.valorant-api.com/competitivetiers/03621f13-43b2-ad59-3904-c3a77a961e97/0/largeicon.png"
                alt="Unranked"
                className="relative z-10 h-28 w-28 opacity-40 grayscale"
              />
            </div>
            <p className="text-xl font-black tracking-[0.2em] text-white uppercase">
              Unranked
            </p>
            <p className="mt-2 text-[10px] font-bold tracking-widest text-slate-600 uppercase">
              Complete placement matches to earn a rank
            </p>
          </div>
        )}

        {/* Recent Performance Section - REDESIGNED */}
        <div className="group/section relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-900/80 backdrop-blur-xl">
          {/* Background Effects */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-rose-500/10 blur-[120px]" />

          <div className="relative z-10 p-6 md:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 backdrop-blur-md">
                  <Sword className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight text-white uppercase">
                    Recent Performance
                  </h2>
                  <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    Match History
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                <Activity className="h-3 w-3" />
                {matches?.length || 0} Matches
              </div>
            </div>

            {Array.isArray(matches) && matches.length > 0 ? (
              <div className="space-y-3">
                {matches
                  .filter((m) => m && m.metadata)
                  .map((match, index) => {
                    const me = match.players?.all_players?.find(
                      (p) => p.puuid === valorantStats?.account?.puuid,
                    );
                    const myTeamSide = me?.team?.toLowerCase();
                    const winningTeamSide = match.teams?.blue?.has_won
                      ? "blue"
                      : match.teams?.red?.has_won
                        ? "red"
                        : null;
                    const actuallyWon =
                      myTeamSide &&
                      winningTeamSide &&
                      myTeamSide === winningTeamSide;

                    const kda = me?.stats
                      ? (
                          (me.stats.kills + me.stats.assists) /
                          Math.max(me.stats.deaths, 1)
                        ).toFixed(1)
                      : "0.0";
                    const hsPercent = me?.stats
                      ? Math.round(
                          (me.stats.headshots /
                            (me.stats.headshots +
                              me.stats.bodyshots +
                              me.stats.legshots || 1)) *
                            100,
                        )
                      : 0;

                    return (
                      <div
                        key={match.metadata?.matchid || Math.random()}
                        className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-xl ${
                          actuallyWon
                            ? "border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent hover:border-emerald-500/40 hover:shadow-emerald-500/10"
                            : "border-rose-500/20 bg-gradient-to-r from-rose-500/5 via-transparent to-transparent hover:border-rose-500/40 hover:shadow-rose-500/10"
                        }`}
                      >
                        {/* Accent Bar */}
                        <div
                          className={`absolute top-0 left-0 h-full w-1 ${actuallyWon ? "bg-gradient-to-b from-emerald-400 to-emerald-600" : "bg-gradient-to-b from-rose-400 to-rose-600"}`}
                        />

                        <div className="flex items-center gap-4 p-4 pl-5 md:gap-6">
                          {/* Agent Avatar */}
                          <div className="relative shrink-0">
                            <div
                              className={`absolute -inset-1 rounded-xl opacity-40 blur-md ${actuallyWon ? "bg-emerald-500" : "bg-rose-500"}`}
                            />
                            <img
                              src={
                                me?.assets?.agent?.small ||
                                "https://media.valorant-api.com/agents/placeholder/displayicon.png"
                              }
                              alt="Agent"
                              className="relative h-14 w-14 rounded-xl border border-white/10 bg-slate-900 transition-transform duration-300 group-hover:scale-110 md:h-16 md:w-16"
                            />
                            <div
                              className={`absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-lg border-2 border-slate-950 shadow-lg ${actuallyWon ? "bg-emerald-500" : "bg-rose-500"}`}
                            >
                              {actuallyWon ? (
                                <Target className="h-3 w-3 text-white" />
                              ) : (
                                <Skull className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>

                          {/* Map & Mode Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <p className="truncate text-lg font-black tracking-tight text-white uppercase md:text-xl">
                                {match.metadata?.map || "Unknown Map"}
                              </p>
                              <span
                                className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] font-black tracking-widest uppercase ${actuallyWon ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}
                              >
                                {actuallyWon ? "Victory" : "Defeat"}
                              </span>
                            </div>
                            <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                              {match.metadata?.mode || "Standard"}
                            </p>
                          </div>

                          {/* Stats Grid */}
                          <div className="hidden items-center gap-6 md:flex lg:gap-8">
                            {/* K/D/A */}
                            <div className="text-center">
                              <p className="text-[9px] font-black tracking-widest text-slate-600 uppercase">
                                K/D/A
                              </p>
                              <p className="mt-0.5 font-mono text-lg font-bold text-white">
                                <span className="text-emerald-400">
                                  {me?.stats?.kills || 0}
                                </span>
                                <span className="mx-1 text-slate-600">/</span>
                                <span className="text-rose-400">
                                  {me?.stats?.deaths || 0}
                                </span>
                                <span className="mx-1 text-slate-600">/</span>
                                <span className="text-amber-400">
                                  {me?.stats?.assists || 0}
                                </span>
                              </p>
                            </div>

                            {/* KDA Ratio */}
                            <div className="text-center">
                              <p className="text-[9px] font-black tracking-widest text-slate-600 uppercase">
                                KDA
                              </p>
                              <p
                                className={`mt-0.5 font-mono text-lg font-bold ${parseFloat(kda) >= 1 ? "text-emerald-400" : "text-rose-400"}`}
                              >
                                {kda}
                              </p>
                            </div>

                            {/* Combat Score */}
                            <div className="hidden text-center lg:block">
                              <p className="text-[9px] font-black tracking-widest text-slate-600 uppercase">
                                ACS
                              </p>
                              <p className="mt-0.5 font-mono text-lg font-bold text-white">
                                {me?.stats?.score
                                  ? Math.round(
                                      me.stats.score /
                                        (match.metadata?.rounds_played || 1),
                                    )
                                  : 0}
                              </p>
                            </div>

                            {/* Headshot % */}
                            <div className="hidden text-center xl:block">
                              <p className="text-[9px] font-black tracking-widest text-slate-600 uppercase">
                                HS%
                              </p>
                              <p
                                className={`mt-0.5 font-mono text-lg font-bold ${hsPercent >= 20 ? "text-amber-400" : "text-slate-400"}`}
                              >
                                {hsPercent}%
                              </p>
                            </div>
                          </div>

                          {/* Date & Time */}
                          <div className="hidden shrink-0 text-right sm:block">
                            <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase tabular-nums">
                              {match.metadata?.game_start_patched
                                ? new Date(
                                    match.metadata.game_start_patched,
                                  ).toLocaleDateString()
                                : ""}
                            </p>
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${actuallyWon ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]"}`}
                              />
                              <span className="text-[8px] font-bold tracking-widest text-slate-600 uppercase">
                                {match.metadata?.rounds_played || 0} Rounds
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Stats Row */}
                        <div className="flex items-center justify-around border-t border-white/5 px-4 py-2 md:hidden">
                          <div className="text-center">
                            <p className="text-[8px] font-bold text-slate-600 uppercase">
                              K/D/A
                            </p>
                            <p className="font-mono text-xs text-white">
                              {me?.stats?.kills || 0}/{me?.stats?.deaths || 0}/
                              {me?.stats?.assists || 0}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] font-bold text-slate-600 uppercase">
                              KDA
                            </p>
                            <p
                              className={`font-mono text-xs ${parseFloat(kda) >= 1 ? "text-emerald-400" : "text-rose-400"}`}
                            >
                              {kda}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] font-bold text-slate-600 uppercase">
                              HS%
                            </p>
                            <p className="font-mono text-xs text-slate-400">
                              {hsPercent}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] font-bold text-slate-600 uppercase">
                              Date
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {match.metadata?.game_start_patched
                                ? new Date(
                                    match.metadata.game_start_patched,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-16 text-slate-500">
                <div className="relative mb-4">
                  <div className="absolute inset-0 scale-150 rounded-full bg-rose-500/10 blur-2xl" />
                  <Sword className="relative h-12 w-12 opacity-30" />
                </div>
                <p className="text-sm font-black tracking-widest uppercase">
                  No Recent Activity
                </p>
                <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                  Play some matches to see your stats here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
