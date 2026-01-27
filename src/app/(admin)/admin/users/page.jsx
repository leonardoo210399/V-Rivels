"use client";
import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import {
  User,
  Mail,
  Shield,
  ShieldAlert,
  BadgeCheck,
  Search,
  Target,
  X,
  ExternalLink,
  RotateCcw,
  Clipboard,
  Check,
} from "lucide-react";
import Link from "next/link";
import { getMatches } from "@/lib/valorant";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchingMatches, setFetchingMatches] = useState(null); // userId if fetching
  const [matchesData, setMatchesData] = useState({}); // {userId: [matches]}
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
        );
        setUsers(data.documents);
      } catch (error) {
        console.error("Failed to load users", error);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const fetchCustomMatches = async (user) => {
    if (!user.puuid) return;
    setFetchingMatches(user.$id);
    try {
      const region = user.region || "ap";
      const res = await getMatches(user.puuid, region, 5, "custom");
      setMatchesData((prev) => ({ ...prev, [user.$id]: res.data || [] }));
    } catch (error) {
      console.error("Failed to fetch matches", error);
      alert(
        "Failed to fetch custom matches. Ensure player has a valid account linked.",
      );
    } finally {
      setFetchingMatches(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUsers = users.filter((u) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      u.ingameName?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.tag?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            User Management
          </h1>
          <p className="mt-1 text-slate-400">
            View and manage all registered accounts
          </p>
        </div>

        <div className="group relative w-full md:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-rose-500" />
          </div>
          <input
            type="text"
            placeholder="Search by Name, Email or Tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/50 py-3 pr-12 pl-11 text-sm text-white backdrop-blur-sm transition-all placeholder:text-slate-600 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/50 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Valorant Account</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="4" className="px-6 py-4">
                        <div className="h-8 w-full rounded bg-white/5" />
                      </td>
                    </tr>
                  ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center font-medium text-slate-500"
                  >
                    {searchQuery
                      ? `No users found matching "${searchQuery}"`
                      : "No users registered yet."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, userIdx) => {
                  const isAdmin = u.email === "adityafulzele1122@gmail.com";
                  return (
                    <tr
                      key={u.$id || `user-${userIdx}`}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/5 bg-slate-800 text-slate-400 transition-all group-hover:border-rose-500/30">
                            {u.card ? (
                              <img
                                src={`https://media.valorant-api.com/playercards/${u.card}/displayicon.png`}
                                alt="Avatar"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <User className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="flex items-center gap-2 font-bold text-white">
                              {u.ingameName ||
                                u.email?.split("@")[0] ||
                                "Unknown User"}
                              {isAdmin && (
                                <Shield
                                  className="h-3 w-3 text-rose-500"
                                  title="Admin"
                                />
                              )}
                              <Link
                                href={`/player/${u.$id}`}
                                target="_blank"
                                className="ml-1 rounded-md p-1 text-slate-500 transition-all hover:bg-white/10 hover:text-rose-500"
                                title="View Public Profile"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Mail className="h-3 w-3" />
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.ingameName ? (
                          <div className="flex items-center gap-2">
                            <BadgeCheck className="h-4 w-4 text-rose-500" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold tracking-wide text-white">
                                  {u.ingameName}{" "}
                                  <span className="text-slate-500">
                                    #{u.tag}
                                  </span>
                                </p>
                                <button
                                  onClick={() => fetchCustomMatches(u)}
                                  disabled={fetchingMatches === u.$id}
                                  className="flex items-center gap-1 text-[10px] font-black tracking-widest text-rose-500 uppercase transition-colors hover:text-white disabled:opacity-50"
                                >
                                  {fetchingMatches === u.$id ? (
                                    <RotateCcw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Target className="h-3 w-3" />
                                      Fetch Customs
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="mb-2 font-mono text-[10px] tracking-tighter text-slate-500 uppercase">
                                {u.puuid}
                              </p>

                              {/* Matches List */}
                              {matchesData[u.$id] && (
                                <div className="mt-2 max-w-[280px] space-y-1 rounded-lg border border-white/5 bg-slate-950/50 p-2">
                                  <div className="mb-1 flex items-center justify-between">
                                    <p className="text-[9px] font-black tracking-widest text-slate-500 uppercase">
                                      Recent Customs
                                    </p>
                                    <button
                                      onClick={() =>
                                        setMatchesData((prev) => ({
                                          ...prev,
                                          [u.$id]: null,
                                        }))
                                      }
                                      className="text-slate-500 hover:text-white"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                  {matchesData[u.$id].length === 0 ? (
                                    <p className="text-[10px] text-slate-600 italic">
                                      No recent custom matches
                                    </p>
                                  ) : (
                                    matchesData[u.$id].map((m, matchIdx) => {
                                      const mId =
                                        m.metadata?.match_id ||
                                        m.metadata?.matchid;
                                      const mapName =
                                        m.metadata?.map || "Unknown Map";

                                      return (
                                        <div
                                          key={mId || `match-${matchIdx}`}
                                          className="group/match flex items-center justify-between gap-3 rounded p-1 text-[10px] transition-colors hover:bg-white/5"
                                        >
                                          <div className="flex min-w-0 flex-col">
                                            <span className="truncate font-mono font-bold text-rose-400">
                                              {mId ? `${mId}` : "Unknown ID"}
                                            </span>
                                            <span className="text-[8px] tracking-tighter text-slate-500 uppercase">
                                              {mapName} •{" "}
                                              {m.metadata?.mode || "Match"}
                                            </span>
                                          </div>
                                          <button
                                            onClick={() => copyToClipboard(mId)}
                                            disabled={!mId}
                                            className="shrink-0 text-slate-500 transition-colors hover:text-rose-500"
                                            title="Copy Match ID"
                                          >
                                            {copiedId === mId ? (
                                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                                            ) : (
                                              <Clipboard className="h-3.5 w-3.5" />
                                            )}
                                          </button>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">
                            No account linked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-black tracking-widest text-emerald-500 uppercase`}
                        >
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(u.$createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
