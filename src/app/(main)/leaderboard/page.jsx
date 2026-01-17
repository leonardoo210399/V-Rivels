"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import {
  Trophy,
  Swords,
  Award as Medal,
  Crown,
  ArrowRight,
  User,
} from "lucide-react";
import Loader from "@/components/Loader";
import Link from "next/link";

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "valo-website-database";
const TOURNAMENTS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_TOURNAMENTS_COLLECTION_ID || "tournaments";
const MATCHES_COLLECTION_ID = "matches";
const REGISTRATIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID ||
  "registrations";
const USERS_COLLECTION_ID = "users";

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [legends, setLegends] = useState([]);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        // Optimized Logic: Query users collection directly using the new aggregated attributes
        const usersRes = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [
            Query.orderDesc("totalEarnings"),
            Query.orderDesc("tournamentsWon"),
            Query.limit(50),
          ],
        );

        let results = usersRes.documents.map((user) => {
          const cardId = user.card || "aec37452-4467-f9d6-c3cc-9097e0766160"; // Fallback to standard card
          return {
            id: user.$id,
            name: user.ingameName || "Unknown Player",
            tag: user.tag || "000",
            wins: user.tournamentsWon || 0,
            earnings: user.totalEarnings || 0,
            matchesWon: user.matchesWon || 0,
            runnerUp: user.runnerUp || 0,
            region: user.region || "AP",
            avatar: `https://media.valorant-api.com/playercards/${cardId}/displayicon.png`,
            isLegend: user.isLegend || false,
          };
        });

        // If no real users found at all, use high-quality mock data for demo
        if (results.length === 0) {
          results = [
            {
              id: "1",
              name: "TenZ",
              tag: "SEN",
              wins: 12,
              runnerUp: 5,
              earnings: 50000,
              matchesWon: 45,
              region: "NA",
              isLegend: true,
              avatar:
                "https://media.valorant-api.com/playercards/33ca32df-4279-88c9-cf63-2292f72a4439/displayicon.png",
            },
            {
              id: "2",
              name: "Aspas",
              tag: "LEV",
              wins: 9,
              runnerUp: 3,
              earnings: 35000,
              matchesWon: 38,
              region: "BR",
              isLegend: true,
              avatar:
                "https://media.valorant-api.com/playercards/60867808-4171-ec31-6453-2786a3d6a457/displayicon.png",
            },
            {
              id: "3",
              name: "Forsaken",
              tag: "PRX",
              wins: 7,
              runnerUp: 8,
              earnings: 28000,
              matchesWon: 32,
              region: "AP",
              isLegend: true,
              avatar:
                "https://media.valorant-api.com/playercards/a755a6d3-4613-2d5c-df33-3d923d6a4439/displayicon.png",
            },
            {
              id: "4",
              name: "Derke",
              tag: "FNC",
              wins: 6,
              runnerUp: 4,
              earnings: 25000,
              matchesWon: 29,
              region: "EU",
              isLegend: false,
              avatar:
                "https://media.valorant-api.com/playercards/33ca32df-4279-88c9-cf63-2292f72a4439/displayicon.png",
            },
            {
              id: "5",
              name: "ScreaM",
              tag: "KMT",
              wins: 5,
              runnerUp: 2,
              earnings: 18000,
              matchesWon: 24,
              region: "EU",
              isLegend: false,
              avatar:
                "https://media.valorant-api.com/playercards/7ca656b2-4d7a-72ef-ea7b-408990666060/displayicon.png",
            },
          ];
        }

        setLegends(results);
      } catch (error) {
        console.error("Leaderboard fetch failed:", error);
        // Fallback mock data on error
        setLegends([
          {
            id: "m1",
            name: "Demon1",
            tag: "EG",
            wins: 15,
            earnings: 75000,
            matchesWon: 52,
            region: "NA",
            isLegend: true,
          },
          {
            id: "m2",
            name: "Something",
            tag: "PRX",
            wins: 11,
            earnings: 45000,
            matchesWon: 41,
            region: "AP",
            isLegend: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-slate-950 px-4 pt-24 pb-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-xs font-black tracking-[0.2em] text-rose-500 uppercase">
            <Medal className="h-4 w-4" />
            Hall of Fame
          </div>
          <h1 className="mb-4 text-5xl font-black tracking-tighter text-white md:text-7xl">
            TOURNAMENT <span className="text-rose-600">LEGENDS</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium text-slate-500">
            The elite performers of VRivals Arena. Witness the masters who have
            dominated our brackets and claimed the ultimate rewards.
          </p>
        </div>

        {/* Podium for Top 3 */}
        <div className="mb-12 grid grid-cols-3 items-end gap-3 md:mb-16 md:gap-6">
          {/* Rank 2 */}
          {legends[1] && (
            <div className="order-1 flex flex-col items-center">
              <div className="group relative mb-2 cursor-pointer md:mb-4">
                <div className="absolute inset-0 scale-125 rounded-full bg-slate-400/20 blur-xl transition-all group-hover:bg-slate-400/30 md:scale-150 md:blur-3xl" />
                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-400/30 bg-slate-900 shadow-2xl md:h-32 md:w-32 md:rounded-2xl">
                  {legends[1].avatar ? (
                    <img
                      src={legends[1].avatar}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <User className="h-8 w-8 text-slate-700 md:h-12 md:w-12" />
                  )}
                </div>
                <div className="absolute -top-3 -left-3 z-10 flex h-7 w-7 items-center justify-center rounded-md border-2 border-slate-900 bg-slate-400 text-sm font-black text-slate-950 shadow-xl md:-top-4 md:-left-4 md:h-10 md:w-10 md:rounded-lg md:text-xl">
                  2
                </div>
              </div>
              <h3 className="w-full truncate px-1 text-center text-xs font-black text-white md:text-xl">
                {legends[1].name}
              </h3>
              <p className="mb-1 text-[10px] font-bold text-slate-500 uppercase md:mb-2 md:text-xs">
                #{legends[1].tag}
              </p>
              <div className="flex flex-col items-center gap-1 md:gap-2">
                <div className="flex items-center gap-1 md:gap-3">
                  <span className="font-mono text-[10px] font-bold text-slate-300 md:text-sm">
                    ₹{legends[1].earnings.toLocaleString()}
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-slate-700 md:block" />
                  <span className="hidden text-xs font-black text-rose-500 uppercase md:block">
                    {legends[1].wins} Wins
                  </span>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-slate-400/20 bg-slate-400/10 px-3 py-1 md:flex">
                  <Medal className="h-3 w-3 text-slate-400" />
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {legends[1].runnerUp} Runner Up
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rank 1 */}
          {legends[0] && (
            <div className="z-10 order-2 -mb-6 flex flex-col items-center md:mb-0">
              <div className="group relative mb-3 cursor-pointer md:mb-6">
                <div className="absolute inset-0 scale-125 animate-pulse rounded-full bg-rose-600/30 blur-2xl transition-all group-hover:bg-rose-600/40 md:scale-150 md:blur-[100px]" />
                <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-2 border-rose-600 bg-slate-900 shadow-2xl shadow-rose-900/40 md:h-48 md:w-48 md:rounded-3xl md:border-4">
                  {legends[0].avatar ? (
                    <img
                      src={legends[0].avatar}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <User className="h-12 w-12 text-slate-700 md:h-24 md:w-24" />
                  )}
                </div>
                <div className="absolute -top-4 -left-3 z-10 flex h-10 w-10 rotate-[-10deg] items-center justify-center rounded-lg border-2 border-slate-900 bg-rose-600 text-xl font-black text-white shadow-2xl md:-top-6 md:-left-6 md:h-16 md:w-16 md:rounded-xl md:border-4 md:text-3xl">
                  <Crown className="h-5 w-5 fill-current md:h-8 md:w-8" />
                </div>
                <div className="absolute -top-3 -right-3 z-10 flex h-8 w-8 animate-bounce items-center justify-center rounded-full border-2 border-slate-900 bg-amber-500 text-lg font-black text-slate-900 shadow-xl md:-top-4 md:-right-4 md:h-12 md:w-12 md:border-4 md:text-2xl">
                  1
                </div>
              </div>
              <h3 className="w-full truncate px-1 text-center text-sm font-black tracking-tighter text-white md:text-3xl">
                {legends[0].name}
              </h3>
              <p className="mb-1 text-[10px] font-black text-rose-500 uppercase md:mb-3 md:text-sm">
                #{legends[0].tag}
              </p>

              {/* Desktop Stats */}
              <div className="hidden items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-2 backdrop-blur-md md:flex">
                <div className="flex flex-col items-center">
                  <span className="mb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Earnings
                  </span>
                  <span className="font-mono font-black text-emerald-400">
                    ₹{legends[0].earnings.toLocaleString()}
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-white/10" />
                <div className="flex flex-col items-center px-2">
                  <span className="mb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Wins
                  </span>
                  <span className="font-black text-white">
                    {legends[0].wins}
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-white/10" />
                <div className="flex flex-col items-center">
                  <span className="mb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    2nd Place
                  </span>
                  <span className="font-black text-slate-400">
                    {legends[0].runnerUp}
                  </span>
                </div>
              </div>

              {/* Mobile Stats (Simplified) */}
              <div className="mt-1 flex flex-col items-center gap-0.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md md:hidden">
                <span className="font-mono text-xs font-black text-emerald-400">
                  ₹{legends[0].earnings.toLocaleString()}
                </span>
                <span className="text-[9px] font-black tracking-wide text-slate-400 uppercase">
                  {legends[0].wins} Wins
                </span>
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {legends[2] && (
            <div className="order-3 flex flex-col items-center">
              <div className="group relative mb-2 cursor-pointer md:mb-4">
                <div className="absolute inset-0 scale-125 rounded-full bg-amber-700/20 blur-xl transition-all group-hover:bg-amber-700/30 md:scale-150 md:blur-3xl" />
                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-2 border-amber-700/30 bg-slate-900 shadow-2xl md:h-32 md:w-32 md:rounded-2xl">
                  {legends[2].avatar ? (
                    <img
                      src={legends[2].avatar}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <User className="h-8 w-8 text-slate-700 md:h-12 md:w-12" />
                  )}
                </div>
                <div className="absolute -top-3 -left-3 z-10 flex h-7 w-7 items-center justify-center rounded-md border-2 border-slate-900 bg-amber-700 text-sm font-black text-slate-950 shadow-xl md:-top-4 md:-left-4 md:h-10 md:w-10 md:rounded-lg md:text-xl">
                  3
                </div>
              </div>
              <h3 className="w-full truncate px-1 text-center text-xs font-black text-white md:text-xl">
                {legends[2].name}
              </h3>
              <p className="mb-1 text-[10px] font-bold text-slate-500 uppercase md:mb-2 md:text-xs">
                #{legends[2].tag}
              </p>
              <div className="flex flex-col items-center gap-1 md:gap-2">
                <div className="flex items-center gap-1 md:gap-3">
                  <span className="font-mono text-[10px] font-bold text-slate-300 md:text-sm">
                    ₹{legends[2].earnings.toLocaleString()}
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-slate-700 md:block" />
                  <span className="hidden text-xs font-black text-rose-500 uppercase md:block">
                    {legends[2].wins} Wins
                  </span>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-amber-700/20 bg-amber-700/10 px-3 py-1 md:flex">
                  <Medal className="h-3 w-3 text-amber-700" />
                  <span className="text-[10px] font-black tracking-widest text-amber-700 uppercase">
                    {legends[2].runnerUp} Runner Up
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm md:rounded-3xl">
          <div className="grid grid-cols-12 border-b border-white/10 bg-slate-900 px-4 py-3 text-[8px] font-black tracking-widest text-slate-500 uppercase md:px-8 md:py-4 md:text-[10px]">
            <div className="col-span-2 md:col-span-1">Rank</div>
            <div className="col-span-6 md:col-span-4">Player</div>
            <div className="col-span-2 hidden text-center md:block">
              Matches
            </div>
            <div className="col-span-2 text-center md:col-span-1">Wins</div>
            <div className="col-span-2 hidden text-center md:block">
              Runner Up
            </div>
            <div className="col-span-2 text-right md:col-span-2">Earnings</div>
          </div>

          <div className="divide-y divide-white/5">
            {legends.map((player, index) => (
              <Link
                key={player.id}
                href={`/player/${player.id}`}
                className="group grid grid-cols-12 items-center px-4 py-3 transition-colors hover:bg-white/[0.02] md:px-8 md:py-5"
              >
                <div className="col-span-2 flex items-center gap-2 md:col-span-1 md:gap-4">
                  <span
                    className={`text-xs font-black md:text-sm ${index < 3 ? "text-rose-500" : "text-slate-500"}`}
                  >
                    {index + 1}
                  </span>
                </div>
                <div className="col-span-6 flex items-center gap-2 md:col-span-4 md:gap-4">
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-800 md:h-10 md:w-10">
                    {player.avatar ? (
                      <img
                        src={player.avatar}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <User className="h-4 w-4 text-slate-600 md:h-5 md:w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <span className="truncate text-xs font-black text-white uppercase transition-colors group-hover:text-rose-500 md:text-sm">
                        {player.name}
                      </span>
                      <span className="hidden rounded border border-white/5 bg-slate-950 px-1.5 py-0.5 text-[10px] font-black tracking-tighter text-slate-600 md:inline-block">
                        {player.region}
                      </span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-600 uppercase md:text-[10px]">
                      #{player.tag}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 hidden text-center md:block">
                  <div className="flex items-center justify-center gap-1.5">
                    <Swords className="h-3 w-3 text-slate-600" />
                    <span className="font-mono text-sm font-bold text-slate-300">
                      {player.matchesWon}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 text-center md:col-span-1">
                  <div className="flex items-center justify-center gap-1 md:gap-1.5">
                    <Trophy className="h-3 w-3 text-amber-500" />
                    <span className="text-xs font-black text-white md:text-sm">
                      {player.wins}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 hidden text-center md:block">
                  <div className="flex items-center justify-center gap-1.5">
                    <Medal className="h-3 w-3 text-slate-400" />
                    <span className="text-sm font-black text-white">
                      {player.runnerUp}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 text-right md:col-span-2">
                  <div className="flex items-center justify-end gap-1 text-emerald-400">
                    <span className="font-mono text-xs font-black tracking-tight md:text-sm">
                      ₹{player.earnings.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-3xl border border-rose-500/10 bg-rose-600/5 px-8 py-6 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600/20">
              <MedallionIcon className="h-6 w-6 text-rose-500" />
            </div>
            <div>
              <h4 className="font-bold text-white">Start your legacy</h4>
              <p className="text-xs text-slate-500">
                Register for upcoming tournaments to climb the ranks.
              </p>
            </div>
          </div>
          <Link
            href="/tournaments"
            className="flex items-center gap-2 rounded-full bg-rose-600 px-6 py-2.5 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-rose-900/20 transition-all hover:bg-rose-700 active:scale-95"
          >
            Browse Tournaments
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MedallionIcon({ className }) {
  return (
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
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}
