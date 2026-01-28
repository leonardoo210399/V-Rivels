"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users,
  FileText,
  Swords,
  Settings,
  ChevronLeft,
  RefreshCw,
  Loader as LoaderIcon,
} from "lucide-react";
import Loader from "@/components/Loader";

// Hooks
import { useTournamentData } from "./_hooks/useTournamentData";
import { useMatchActions } from "./_hooks/useMatchActions";
import { useTournamentActions } from "./_hooks/useTournamentActions";

// Components
import ParticipantsTab from "./_components/ParticipantsTab";
import RequestsTab from "./_components/RequestsTab";
import MatchesTab from "./_components/MatchesTab";
import SettingsTab from "./_components/SettingsTab";

export default function TournamentControlPage() {
  const params = useParams();
  const id = params?.id;

  // 1. Data Hook
  const {
    tournament,
    setTournament,
    registrations,
    setRegistrations,
    matches,
    setMatches,
    paymentRequests,
    setPaymentRequests,
    loading,
    setLoading,
    loadData,
  } = useTournamentData(id);

  // 2. Actions Hooks
  const matchActions = useMatchActions(
    tournament,
    setTournament,
    matches,
    setMatches,
    registrations,
    loadData,
    id,
  );

  const tournamentActions = useTournamentActions(
    id,
    tournament,
    setTournament,
    registrations,
    matches,
    loadData,
  );

  // 3. UI State
  const [activeTab, setActiveTab] = useState("participants");

  if (loading) return <Loader />;

  if (!tournament) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Tournament not found
      </div>
    );
  }

  // Calculate stats for header
  const totalPrize = tournament.prizePool || "0";
  // For count: just use registrations length.

  const isRefreshing =
    loading ||
    matchActions.updating ||
    matchActions.isFetchingVal ||
    tournamentActions.updating;

  return (
    <div className="min-h-screen bg-slate-950 px-4 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/admin/tournaments"
              className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              BACK TO LIST
            </Link>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase md:text-5xl">
              {tournament.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-bold tracking-widest text-slate-500 uppercase">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-slate-400">
                {tournament.gameType}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-800" />
              <span className="text-rose-500">{totalPrize} Prize Pool</span>
              <span className="h-1 w-1 rounded-full bg-slate-800" />
              <span>{registrations.length} Teams / Entries</span>
              <span className="h-1 w-1 rounded-full bg-slate-800" />
              <span
                className={
                  tournament.status === "ongoing"
                    ? "animate-pulse text-emerald-500"
                    : tournament.status === "completed"
                      ? "text-slate-500"
                      : "text-amber-500"
                }
              >
                {tournament.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-indigo-900/20 transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              {isRefreshing ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isRefreshing ? "Syncing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="no-scrollbar flex overflow-x-auto rounded-3xl border border-white/5 bg-slate-900/50 p-2 backdrop-blur-sm">
          {[
            { id: "participants", label: "Participants", icon: Users },
            {
              id: "requests",
              label: "Requests",
              icon: FileText,
              count: paymentRequests.filter(
                (r) => r.paymentStatus === "pending",
              ).length,
            },
            { id: "matches", label: "Matches / Bracket", icon: Swords },
            { id: "settings", label: "Settings & Danger", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-3 rounded-2xl px-6 py-4 text-xs font-black tracking-widest whitespace-nowrap uppercase transition-all ${
                activeTab === tab.id
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20"
                  : "text-slate-500 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <tab.icon
                className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                  activeTab === tab.id ? "text-white" : "text-slate-500"
                }`}
              />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] text-rose-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "participants" && (
            <ParticipantsTab
              tournament={tournament}
              registrations={registrations}
              setRegistrations={setRegistrations}
              paymentRequests={paymentRequests}
              loadData={loadData}
            />
          )}

          {activeTab === "requests" && (
            <RequestsTab
              tournament={tournament}
              paymentRequests={paymentRequests}
              setPaymentRequests={setPaymentRequests}
              registrations={registrations}
              setRegistrations={setRegistrations} // In case approval creates reg
              loadData={loadData}
            />
          )}

          {activeTab === "matches" && (
            <MatchesTab
              tournament={tournament}
              matches={matches}
              setMatches={setMatches} // For DM view updates
              setTournament={setTournament}
              registrations={registrations}
              setRegistrations={setRegistrations}
              actions={matchActions}
              tournamentActions={tournamentActions}
              loadData={loadData}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              tournament={tournament}
              setTournament={setTournament}
              onSaveSettings={tournamentActions.handleSaveSettings}
              onDelete={tournamentActions.handleDelete}
              onDiscordDelete={tournamentActions.handleManualDiscordDelete}
              deleteStep={tournamentActions.deleteStep}
              deleteError={tournamentActions.deleteError}
              discordDeleteStep={tournamentActions.discordDeleteStep}
              discordDeleteError={tournamentActions.discordDeleteError}
              updating={tournamentActions.updating}
            />
          )}
        </div>
      </div>
    </div>
  );
}
