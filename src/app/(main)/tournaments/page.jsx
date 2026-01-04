"use client";
import { useEffect, useState } from "react";
import { getTournaments } from "@/lib/tournaments";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Loader2, Calendar, Trophy, Users } from "lucide-react";

export default function TournamentsPage() {
  const { isAdmin } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTournaments() {
      try {
        const data = await getTournaments();
        setTournaments(data);
      } catch (error) {
        console.error("Failed to load tournaments", error);
        // Fallback for demo if no DB connection
        setTournaments([
            {
                $id: "1",
                name: "Valorant Winter Championship",
                date: new Date(Date.now() + 86400000).toISOString(),
                prizePool: "$5,000",
                maxTeams: 32,
                status: "open"
            },
             {
                $id: "2",
                name: "Weekly Community Cup",
                date: new Date(Date.now() + 172800000).toISOString(),
                prizePool: "$500",
                maxTeams: 16,
                status: "open"
            }
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadTournaments();
  }, []);

  if (loading) {
     return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Tournaments</h1>
            {isAdmin && (
                <Link href="/tournaments/create" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-gray-100">
                    Create Tournament
                </Link>
            )}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
                <Link href={`/tournaments/${tournament["$id"]}`} key={tournament["$id"]}>
                    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 p-6 transition-all hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/10">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="rounded-lg bg-rose-500/10 p-3 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                <Trophy className="h-6 w-6" />
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${(tournament.status || 'open') === 'open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                {tournament.status || 'open'}
                            </span>
                        </div>
                        
                        <h3 className="mb-2 text-xl font-bold text-white group-hover:text-rose-500 transition-colors">{tournament.name}</h3>
                        
                        <div className="space-y-2 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(tournament.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{tournament.maxTeams} Teams Max</span>
                            </div>
                             <div className="flex items-center gap-2 text-amber-400">
                                <Trophy className="h-4 w-4" />
                                <span>Prize Pool: {tournament.prizePool}</span>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
