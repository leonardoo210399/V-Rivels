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
    <div className="min-h-screen bg-slate-950 px-4 pt-24 pb-12 selection:bg-rose-500/30">
      <div className="mx-auto max-w-6xl">
        {/* Page Title Section */}
        <div className="mb-8 flex flex-col justify-between gap-4 px-2 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1 w-8 rounded-full bg-rose-500" />
              <h2 className="text-xs font-black tracking-[0.3em] text-slate-500 uppercase">
                Public Record
              </h2>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              Player{" "}
              <span className="text-rose-500 underline decoration-rose-500/30 underline-offset-8">
                Profile
              </span>
            </h1>
          </div>
          <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-2.5 backdrop-blur-md md:flex">
            <div className="relative">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
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

        {/* Profile Header - Premium Style */}
        <div className="group relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-8">
          {/* Dynamic Background Banner */}
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30 transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage: valorantStats?.card?.wideArt
                ? `url(${valorantStats.card.wideArt})`
                : "none",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

          <div className="relative z-10 flex flex-col items-center gap-10 md:flex-row">
            <div className="relative">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-4 border-slate-950 bg-slate-800 shadow-2xl">
                {valorantStats?.card?.smallArt ? (
                  <img
                    src={valorantStats.card.smallArt}
                    alt="Player Card"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-slate-700" />
                )}
              </div>
              {valorantStats?.account?.account_level && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-[10px] font-black tracking-widest whitespace-nowrap text-white uppercase shadow-lg">
                  lvl {valorantStats.account.account_level}
                </div>
              )}
            </div>

            <div className="text-center md:text-left">
              <h1 className="mb-4 flex items-center justify-center gap-4 text-5xl font-black tracking-tighter text-white md:justify-start">
                {profile.ingameName}
                <span className="text-3xl font-bold text-slate-600">
                  #{profile.tag}
                </span>
              </h1>
              <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase backdrop-blur-md">
                  <Trophy className="h-4 w-4 text-emerald-500" />
                  <span>{dbStats?.tournamentsPlayed || 0} Tourneys</span>
                </div>
                {valorantStats?.mmr?.current_data?.currenttierpatched && (
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase backdrop-blur-md">
                    <Activity className="h-4 w-4 text-rose-500" />
                    <span>
                      {valorantStats.mmr.current_data.currenttierpatched}
                    </span>
                  </div>
                )}
                {profile.discordTag && (
                  <div className="flex items-center gap-2 rounded-full border border-[#5865F2]/20 bg-[#5865F2]/10 px-4 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase backdrop-blur-md">
                    <MessageCircle className="h-4 w-4 text-[#5865F2]" />
                    <span>{profile.discordTag}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column - Stats & Identity */}
          <div className="space-y-8 lg:col-span-4">
            {/* Statistics Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-rose-600/10 blur-[50px] transition-all group-hover:bg-rose-600/20" />

              <h3 className="mb-6 flex items-center gap-2 text-xs font-black tracking-[0.2em] text-slate-500 uppercase">
                <Trophy className="h-4 w-4 text-rose-500" />
                Statistics
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4 transition-colors hover:border-emerald-500/20">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      Platform Earnings
                    </span>
                    <DollarSign className="h-3 w-3 text-emerald-500" />
                  </div>
                  <div className="font-mono text-3xl font-black tracking-tighter text-white">
                    ₹{(dbStats?.totalEarnings || 0).toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4 transition-colors hover:border-amber-500/20">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                        Won
                      </span>
                      <Crown className="h-3 w-3 text-amber-500" />
                    </div>
                    <div className="text-xl font-black text-white">
                      {dbStats?.tournamentsWon || 0}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4 transition-colors hover:border-slate-400/20">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                        Runner Up
                      </span>
                      <Medal className="h-3 w-3 text-slate-400" />
                    </div>
                    <div className="text-xl font-black text-white">
                      {dbStats?.runnerUp || 0}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4 transition-colors hover:border-rose-500/20">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      Matches Won
                    </span>
                    <Swords className="h-3 w-3 text-rose-500" />
                  </div>
                  <div className="text-xl font-black text-white">
                    {dbStats?.matchesWon || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Riot Identity */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm">
              <h2 className="mb-6 flex items-center gap-2 text-xs font-black tracking-[0.2em] text-slate-500 uppercase">
                <Crosshair className="h-4 w-4 text-rose-500" />
                Identity
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2.5">
                  <span className="text-[10px] font-black text-slate-500 uppercase">
                    Region
                  </span>
                  <span className="text-xs font-black text-white uppercase">
                    {valorantStats?.account?.region || profile.region || "AP"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2.5">
                  <span className="text-[10px] font-black text-slate-500 uppercase">
                    Last Synced
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {valorantStats?.account?.last_update
                      ? new Date(
                          valorantStats.account.last_update,
                        ).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & History */}
          <div className="space-y-8 lg:col-span-8">
            {/* Competitive Card */}
            <div className="group relative flex min-h-[300px] flex-col justify-center overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-sm transition-all hover:bg-slate-900/80">
              {/* Background Rank Glow */}
              <div
                className={`pointer-events-none absolute -top-20 -right-20 h-80 w-80 opacity-10 blur-[120px] transition-all duration-700 group-hover:opacity-20 ${
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
                            : "bg-rose-500"
                }`}
              />

              <div className="relative z-10">
                <div className="mb-10 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xs font-black tracking-[0.2em] text-slate-500 uppercase">
                    <Gauge className="h-4 w-4" />
                    Competitive Rank
                  </h2>
                  {valorantStats?.mmr?.highest_rank?.patched_tier && (
                    <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 backdrop-blur-md">
                      <Trophy className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[10px] font-black tracking-widest text-amber-500 uppercase">
                        Peak: {valorantStats.mmr.highest_rank.patched_tier}
                      </span>
                    </div>
                  )}
                </div>

                {valorantStats?.mmr?.current_data?.currenttierpatched ? (
                  <div className="flex flex-col items-center gap-10 sm:flex-row">
                    <div className="relative flex shrink-0 items-center justify-center">
                      <div className="absolute inset-0 scale-150 rounded-full bg-white/5 blur-3xl" />
                      <img
                        src={valorantStats.mmr.current_data.images.large}
                        alt="Rank"
                        className="relative z-10 h-40 w-40 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                      {valorantStats.mmr.current_data
                        .mmr_change_to_last_game !== undefined && (
                        <div
                          className={`absolute -bottom-2 z-20 rounded-full border px-3 py-1 text-[10px] font-black shadow-2xl backdrop-blur-md ${
                            valorantStats.mmr.current_data
                              .mmr_change_to_last_game >= 0
                              ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                              : "border-rose-500/30 bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {valorantStats.mmr.current_data
                            .mmr_change_to_last_game >= 0
                            ? "+"
                            : ""}
                          {
                            valorantStats.mmr.current_data
                              .mmr_change_to_last_game
                          }
                        </div>
                      )}
                    </div>

                    <div className="w-full flex-1 text-center sm:text-left">
                      <div className="mb-8">
                        <p className="mb-2 text-5xl font-black tracking-tighter text-white">
                          {valorantStats.mmr.current_data.currenttierpatched}
                        </p>
                        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-start">
                          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                            ELO{" "}
                            <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                              {valorantStats.mmr.current_data.elo}
                            </span>
                          </div>
                          {(() => {
                            const seasons = Object.keys(
                              valorantStats.mmr.by_season || {},
                            );
                            const currentSeason = seasons[0];
                            const stats =
                              valorantStats.mmr.by_season[currentSeason];
                            if (
                              stats &&
                              !stats.error &&
                              stats.number_of_games > 0
                            ) {
                              const wr = Math.round(
                                (stats.wins / stats.number_of_games) * 100,
                              );
                              return (
                                <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                  Winrate{" "}
                                  <span
                                    className={`rounded px-2 py-0.5 ${wr >= 50 ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white"}`}
                                  >
                                    {wr}%
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>

                      <div className="mx-auto max-w-sm space-y-3 sm:mx-0">
                        <div className="flex items-end justify-between px-1">
                          <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                            Rating Progress
                          </span>
                          <span className="font-mono text-lg leading-none font-black text-white">
                            {valorantStats.mmr.current_data.ranking_in_tier}
                            <span className="ml-1 text-sm font-bold text-slate-600 uppercase">
                              rr
                            </span>
                          </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950 p-0.5 shadow-inner">
                          <div
                            className={`h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-1000 ease-in-out ${
                              valorantStats.mmr.current_data.currenttierpatched?.includes(
                                "Platinum",
                              )
                                ? "bg-cyan-400"
                                : valorantStats.mmr.current_data.currenttierpatched?.includes(
                                      "Diamond",
                                    )
                                  ? "bg-purple-400"
                                  : valorantStats.mmr.current_data.currenttierpatched?.includes(
                                        "Ascendant",
                                      )
                                    ? "bg-emerald-400"
                                    : valorantStats.mmr.current_data.currenttierpatched?.includes(
                                          "Immortal",
                                        )
                                      ? "bg-rose-500"
                                      : "bg-rose-500"
                            }`}
                            style={{
                              width: `${Math.max(2, valorantStats.mmr.current_data.ranking_in_tier)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex scale-90 flex-col items-center justify-center py-10">
                    <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/5 bg-slate-950 transition-transform duration-500 group-hover:scale-110">
                      <div className="absolute inset-0 rounded-full bg-white/5 blur-xl" />
                      <img
                        src="https://media.valorant-api.com/competitivetiers/03621f13-43b2-ad59-3904-c3a77a961e97/0/largeicon.png"
                        alt="Unranked"
                        className="relative z-10 h-16 w-16 opacity-30 grayscale"
                      />
                    </div>
                    <p className="text-sm font-black tracking-[0.2em] text-white uppercase">
                      Unranked
                    </p>
                    <p className="mt-2 text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                      Season placements pending
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Public Match History */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-sm">
              <h2 className="mb-8 flex items-center gap-2 text-xs font-black tracking-[0.2em] text-slate-500 uppercase">
                <Sword className="h-4 w-4 text-rose-500" />
                Recent Performance
              </h2>

              {Array.isArray(matches) && matches.length > 0 ? (
                <div className="space-y-3">
                  {matches
                    .filter((m) => m && m.metadata)
                    .map((match) => {
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

                      return (
                        <div
                          key={match.metadata?.matchid || Math.random()}
                          className={`group grid grid-cols-12 items-center rounded-2xl border border-l-4 border-white/5 bg-slate-950/80 p-5 transition-all hover:translate-x-1 hover:bg-slate-900 ${actuallyWon ? "border-l-emerald-500 shadow-emerald-950/20" : "border-l-rose-500 shadow-rose-950/20"} shadow-lg`}
                        >
                          {/* Map & Agent - col-span-4 */}
                          <div className="col-span-4 flex items-center gap-5">
                            <div className="relative shrink-0">
                              <img
                                src={
                                  me?.assets?.agent?.small ||
                                  "https://media.valorant-api.com/agents/placeholder/displayicon.png"
                                }
                                alt="Agent"
                                className="h-12 w-12 rounded-xl border border-white/5 bg-slate-800 transition-transform group-hover:scale-105"
                              />
                              <div
                                className={`absolute -right-1.5 -bottom-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-950 ${actuallyWon ? "bg-emerald-500" : "bg-rose-500"}`}
                              >
                                {actuallyWon ? (
                                  <Target className="h-2.5 w-2.5 text-white" />
                                ) : (
                                  <Skull className="h-2.5 w-2.5 text-white" />
                                )}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="mb-1 truncate text-lg leading-none font-black tracking-tighter text-white uppercase">
                                {match.metadata?.map || "Unknown Map"}
                              </p>
                              <div className="mt-2 flex flex-col items-start gap-1.5">
                                <span
                                  className={`rounded px-2 py-0.5 text-[9px] font-black tracking-widest whitespace-nowrap uppercase ${actuallyWon ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}
                                >
                                  {actuallyWon ? "Victory" : "Defeat"}
                                </span>
                                <span className="pl-0.5 text-[8px] font-black tracking-[0.15em] text-slate-600 uppercase">
                                  {match.metadata?.mode || "Standard"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* K/D/A - col-span-2 */}
                          <div className="col-span-2 text-center">
                            <p className="mb-1 text-[9px] font-black tracking-[0.2em] text-slate-600 uppercase">
                              K/D/A
                            </p>
                            <p className="font-mono text-base text-white">
                              {me?.stats?.kills || 0}
                              <span className="mx-0.5 text-slate-600">/</span>
                              {me?.stats?.deaths || 0}
                              <span className="mx-0.5 text-slate-600">/</span>
                              {me?.stats?.assists || 0}
                            </p>
                          </div>

                          {/* Combat Score - col-span-2 */}
                          <div className="col-span-2 hidden text-center sm:block">
                            <p className="mb-1 text-[9px] font-black tracking-[0.2em] text-slate-600 uppercase">
                              Combat
                            </p>
                            <p className="font-mono text-white">
                              {me?.stats?.score || 0}
                            </p>
                          </div>

                          {/* HS% - col-span-2 */}
                          <div className="col-span-2 hidden text-center md:block">
                            <p className="mb-1 text-[9px] font-black tracking-[0.2em] text-slate-600 uppercase">
                              HS%
                            </p>
                            <p className="font-mono text-slate-300">
                              {me?.stats
                                ? Math.round(
                                    (me.stats.headshots /
                                      (me.stats.headshots +
                                        me.stats.bodyshots +
                                        me.stats.legshots || 1)) *
                                      100,
                                  )
                                : 0}
                              %
                            </p>
                          </div>

                          {/* Date & Indicator - col-span-2 */}
                          <div className="col-span-4 hidden text-right sm:block md:col-span-2">
                            <p className="mb-1 text-[9px] font-bold tracking-widest text-slate-500 uppercase tabular-nums">
                              {match.metadata?.game_start_patched
                                ? new Date(
                                    match.metadata.game_start_patched,
                                  ).toLocaleDateString()
                                : ""}
                            </p>
                            <div className="ml-auto h-1 w-full max-w-[80px] overflow-hidden rounded-full bg-white/5">
                              <div
                                className={`h-full ${actuallyWon ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"}`}
                                style={{ width: "40%" }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-slate-500">
                  <Sword className="mb-4 h-10 w-10 opacity-20" />
                  <p className="text-xs font-black tracking-widest uppercase">
                    No Recent Activity
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
