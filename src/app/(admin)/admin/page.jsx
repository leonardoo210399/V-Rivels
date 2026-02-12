"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Users, Trophy, Swords, Zap, Send } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/Loader";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import MaintenanceToggle from "@/components/admin/MaintenanceToggle";
import { getStatus } from "@/lib/valorant";
import Link from "next/link";
import { syncLeaderboardWithDB } from "@/lib/maintenance";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users";
const TOURNAMENTS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_TOURNAMENTS_COLLECTION_ID;
const REGISTRATIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    users: 0,
    tournaments: 0,
    registrations: 0,
  });
  const [systemStatus, setSystemStatus] = useState({
    server: "Checking...",
    database: "Connecting...",
    latency: 0,
    valorantApi: "Checking...",
  });

  const fetchCounts = async () => {
    const startTime = performance.now();
    try {
      setLoading(true);
      const [usersRes, tournamentsRes, regsRes, valorantStatusRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, []),
        databases.listDocuments(DATABASE_ID, TOURNAMENTS_COLLECTION_ID, []),
        databases.listDocuments(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, [
          Query.limit(100),
        ]),
        getStatus("ap").catch(() => null), // Fail gracefully
      ]);

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      // Filter out orphans for the total count display
      const liveRegs = regsRes.documents.filter((reg) =>
        tournamentsRes.documents.some((t) => t.$id === reg.tournamentId),
      );

      // Parse Valorant API Status
      // API returns { status: 200, data: { maintenances: [], incidents: [] } } usually
      // If data.maintenances or incidents are empty, it's Operational.
      let vStatus = "Unknown";
      let vTrend = "neutral";
      if (valorantStatusRes && valorantStatusRes.data) {
        const hasIssues =
          valorantStatusRes.data.maintenances?.length > 0 ||
          valorantStatusRes.data.incidents?.length > 0;
        vStatus = hasIssues ? "Issues" : "Online";
        vTrend = hasIssues ? "down" : "up";
      } else {
         vStatus = "Offline";
         vTrend = "down";
      }

      setCounts({
        users: usersRes.total,
        tournaments: tournamentsRes.total,
        registrations: liveRegs.length,
      });

      setSystemStatus({
        server: "Online",
        database: "Secure",
        latency: latency,
        valorantApi: vStatus,
        valorantTrend: vTrend,
      });
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
      setSystemStatus({
        server: "Offline",
        database: "Error",
        latency: 0,
        valorantApi: "Error",
        valorantTrend: "down",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const stats = [
    {
      name: "Total Users",
      value: counts.users,
      icon: Users,
      change: "Lifetime",
      trend: "neutral",
    },
    {
      name: "Tournaments",
      value: counts.tournaments,
      icon: Trophy,
      change: "Active",
      trend: "neutral",
    },
    {
      name: "Registrations",
      value: counts.registrations,
      icon: Swords,
      change: "Live",
      trend: "neutral",
    },
    {
      name: "Valorant API",
      value: systemStatus.valorantApi,
      icon: Zap,
      change: "AP Region",
      trend: systemStatus.valorantTrend,
    },
  ];


  const handleCleanup = () => {
    toast("Cleanup Orphaned Records?", {
      description:
        "This will permanently delete registrations associated with tournaments that no longer exist.",
      action: {
        label: "Yes, Cleanup",
        onClick: () => executeCleanup(),
      },
      cancel: {
        label: "Cancel",
      },
      duration: 5000,
    });
  };

  const executeCleanup = async () => {
    try {
      setLoading(true);
      const [tRes, rRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, TOURNAMENTS_COLLECTION_ID),
        databases.listDocuments(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, [
          Query.limit(100),
        ]),
      ]);

      const orphans = rRes.documents.filter(
        (reg) => !tRes.documents.some((t) => t.$id === reg.tournamentId),
      );

      if (orphans.length === 0) {
        toast.info("No orphaned records found!");
        return;
      }

      // Deleting in parallel
      await Promise.all(
        orphans.map((o) =>
          databases.deleteDocument(
            DATABASE_ID,
            REGISTRATIONS_COLLECTION_ID,
            o.$id,
          ),
        ),
      );

      toast.success(
        `Successfully deleted ${orphans.length} orphaned registrations!`,
      );
      fetchCounts();
    } catch (e) {
      console.error("Cleanup failed", e);
      toast.error(
        "Failed to cleanup: " +
          e.message +
          "\n\nNote: Ensure the Admin has 'Delete' permission on the Registrations collection in Appwrite.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLeaderboard = () => {
    toast("Synchronize Leaderboard?", {
      description:
        "This will recalculate all player wins and earnings based on actual matches in the database. Recommended if stats feel out of sync.",
      action: {
        label: "Sync Now",
        onClick: () => executeSync(),
      },
      cancel: {
        label: "Cancel",
      },
      duration: 5000,
    });
  };

  const executeSync = async () => {
    try {
      setLoading(true);
      const result = await syncLeaderboardWithDB();
      toast.success(
        `Sync Complete! Analyzed ${result.totalUsersAnalyzed} users and updated ${result.usersUpdated} profiles.`,
      );
      fetchCounts();
    } catch (e) {
      console.error("Sync failed", e);
      toast.error("Failed to sync leaderboard: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Maintenance Toggle */}
      <MaintenanceToggle />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Admin Overview
          </h1>
          <p className="mt-1 text-slate-400">Logged in as {user?.name}</p>
        </div>
        {loading && <Loader fullScreen={false} size="sm" />}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-rose-500/20"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl border border-white/5 bg-slate-950 p-3 transition-colors group-hover:bg-rose-500/10">
                  <Icon className="h-6 w-6 text-rose-500" />
                </div>
                <span
                  className={`rounded-md px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${
                    stat.trend === "up"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : stat.trend === "down"
                      ? "bg-rose-500/10 text-rose-500"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              {loading ? (
                <div className="mb-1 h-8 w-16 animate-pulse rounded bg-white/5" />
              ) : (
                <h3 className="mb-1 text-3xl font-black tracking-tighter text-white italic">
                  {stat.value}
                </h3>
              )}
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                {stat.name}
              </p>
            </div>
          );
        })}
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-8 backdrop-blur-sm">
          <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/admin/tournaments"
              className="group rounded-xl border border-white/5 bg-slate-950 p-4 text-left transition-all hover:bg-white/5"
            >
              <p className="mb-1 text-xs font-bold text-slate-500 uppercase">
                Tournaments
              </p>
              <p className="text-sm font-bold text-white group-hover:text-rose-500">
                Create New
              </p>
            </Link>
            <Link
              href="/admin/users"
              className="group rounded-xl border border-white/5 bg-slate-950 p-4 text-left transition-all hover:bg-white/5"
            >
              <p className="mb-1 text-xs font-bold text-slate-500 uppercase">
                Users
              </p>
              <p className="text-sm font-bold text-white group-hover:text-rose-500">
                View All
              </p>
            </Link>
            <button
              onClick={handleCleanup}
              className="group rounded-xl border border-white/5 bg-slate-950 p-4 text-left transition-all hover:bg-white/5"
            >
              <p className="mb-1 text-xs font-bold text-slate-500 uppercase">
                Database
              </p>
              <p className="text-sm font-bold text-white group-hover:text-rose-500">
                Cleanup Records
              </p>
            </button>
            <button
              onClick={handleSyncLeaderboard}
              className="group rounded-xl border border-white/5 bg-slate-950 p-4 text-left transition-all hover:bg-white/5"
            >
              <p className="mb-1 text-xs font-bold text-slate-500 uppercase">
                Leaderboard
              </p>
              <p className="text-sm font-bold text-white group-hover:text-rose-500">
                Sync Stats
              </p>
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-8 backdrop-blur-sm">
          <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            Live Database
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950 p-3">
              <span className="text-sm text-slate-400">
                Database Connection
              </span>
              <span
                className={`text-xs font-bold uppercase ${
                  systemStatus.database === "Secure"
                    ? "text-emerald-500"
                    : "text-rose-500"
                }`}
              >
                {systemStatus.database}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950 p-3">
              <span className="text-sm text-slate-400">System Latency</span>
              <span className="text-xs font-bold text-white uppercase">
                {systemStatus.latency} ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
