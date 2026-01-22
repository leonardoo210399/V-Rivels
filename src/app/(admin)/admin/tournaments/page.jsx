"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTournaments, deleteTournament } from "@/lib/tournaments";
import { getAllPendingPaymentRequests } from "@/lib/payment_requests";
import {
  Trophy,
  Calendar,
  Users,
  Trash2,
  ExternalLink,
  Plus,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import CreateTournamentDrawer from "@/components/CreateTournamentDrawer";

export default function AdminTournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pendingCounts, setPendingCounts] = useState({});

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const [tData, pendingReqs] = await Promise.all([
        getTournaments(),
        getAllPendingPaymentRequests(),
      ]);

      setTournaments(tData);

      // Calculate pending counts per tournament
      const counts = {};
      pendingReqs.forEach((req) => {
        if (req.tournamentId) {
          counts[req.tournamentId] = (counts[req.tournamentId] || 0) + 1;
        }
      });
      setPendingCounts(counts);
    } catch (error) {
      console.error("Failed to load tournaments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Manage Tournaments
          </h1>
          <p className="mt-1 text-slate-400">
            Create, edit and monitor your Valorant events
          </p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 font-bold text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-700"
        >
          <Plus className="h-4 w-4" />
          New Tournament
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/50 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                <th className="px-6 py-4">Tournament</th>
                <th className="px-6 py-4">Mode</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Registered</th>
                <th className="px-6 py-4">Requests</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="7" className="px-6 py-4">
                        <div className="h-8 w-full rounded bg-white/5" />
                      </td>
                    </tr>
                  ))
              ) : tournaments.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center font-medium text-slate-500"
                  >
                    No tournaments found. Create your first one!
                  </td>
                </tr>
              ) : (
                tournaments.map((t) => (
                  <tr
                    key={t.$id}
                    onClick={() => router.push(`/admin/tournaments/${t.$id}`)}
                    className="group cursor-pointer transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-rose-500/10 p-2 text-rose-500">
                          <Trophy className="h-4 w-4" />
                        </div>
                        <div className="group/name block">
                          <p className="font-bold tracking-tight text-white uppercase transition-colors group-hover/name:text-rose-500">
                            {t.name}
                          </p>
                          <p className="font-mono text-[10px] text-slate-500">
                            {t.$id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded border border-white/5 bg-slate-950 px-2 py-1 text-xs font-bold text-white uppercase">
                        {t.gameType || "5v5"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center gap-2 text-sm text-slate-400"
                        suppressHydrationWarning
                      >
                        <Calendar className="h-3 w-3" />
                        {new Date(t.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                          <Users className="h-3 w-3 text-rose-500" />
                          {t.registeredTeams || 0} / {t.maxTeams}
                        </div>
                        <p
                          className={`text-[10px] font-black tracking-widest uppercase ${
                            t.maxTeams - (t.registeredTeams || 0) <= 2
                              ? "animate-pulse text-rose-500"
                              : "text-emerald-500"
                          }`}
                        >
                          {t.maxTeams - (t.registeredTeams || 0)} SLOTS LEFT
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard
                          className={`h-4 w-4 ${pendingCounts[t.$id] > 0 ? "text-amber-500" : "text-slate-600"}`}
                        />
                        <span
                          className={`font-bold ${pendingCounts[t.$id] > 0 ? "text-amber-500" : "text-slate-600"}`}
                        >
                          {pendingCounts[t.$id] || "-"}
                        </span>
                        {pendingCounts[t.$id] > 0 && (
                          <span className="ml-1 text-[10px] font-bold tracking-wider text-amber-500 uppercase">
                            Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-black tracking-widest uppercase ${
                          t.status === "scheduled" || !t.status
                            ? "bg-cyan-500/10 text-cyan-500"
                            : t.status === "ongoing"
                              ? "animate-pulse bg-rose-500/10 text-rose-500"
                              : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {t.status === "scheduled" || !t.status
                          ? "SCHEDULED"
                          : t.status === "ongoing"
                            ? "ONGOING (LIVE)"
                            : "COMPLETED"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/tournaments/${t.$id}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg border border-white/5 bg-slate-950 p-2 text-slate-400 transition-all hover:bg-white/5 hover:text-white"
                          title="View Public Page"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateTournamentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={loadTournaments}
      />
    </div>
  );
}
