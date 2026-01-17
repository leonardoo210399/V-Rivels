"use client";
import { Users } from "lucide-react";
import PlayerCard3D from "./PlayerCard3D";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/users";

/**
 * PlayerRoster Component
 * Displays team rosters for both teams in a match
 *
 * @param {Object} props
 * @param {Object} props.teamA - Team A registration object
 * @param {Object} props.teamB - Team B registration object
 * @param {boolean} props.loading - Loading state
 */
export default function PlayerRoster({ teamA, teamB, loading = false }) {
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  useEffect(() => {
    const fetchTeamPlayers = async () => {
      setLoadingPlayers(true);
      try {
        const playersA = [];
        const playersB = [];

        // Fetch Team A players
        if (teamA) {
          try {
            let metadata = {};
            if (teamA.metadata) {
              try {
                metadata =
                  typeof teamA.metadata === "string"
                    ? JSON.parse(teamA.metadata)
                    : teamA.metadata;
              } catch (e) {
                console.error("Failed to parse team A metadata:", e);
              }
            }

            // Check if this is a 5v5 team with members roster
            if (metadata.members && Array.isArray(metadata.members)) {
              // It's a 5v5 team - display all roster members
              for (const member of metadata.members) {
                playersA.push({
                  ingameName: member.name,
                  tag: member.tag,
                  card: null, // We don't have card data for all members
                  role: null, // Individual role not stored
                  mainAgent: null,
                  secondaryAgents: [],
                });
              }
            } else {
              // It's a solo/DM player - fetch their profile
              const userProfile = await getUserProfile(teamA.userId);
              if (userProfile) {
                playersA.push({
                  ingameName: userProfile.ingameName || teamA.teamName,
                  tag: userProfile.tag,
                  card: userProfile.card,
                  role: metadata.role || null,
                  mainAgent: metadata.mainAgent || null,
                  secondaryAgents: metadata.secondaryAgents || [],
                });
              } else {
                // Fallback
                playersA.push({
                  ingameName: teamA.teamName || "Player",
                  tag: null,
                  card: null,
                  role: null,
                  mainAgent: null,
                  secondaryAgents: [],
                });
              }
            }
          } catch (e) {
            console.error("Failed to fetch Team A players:", e);
            playersA.push({
              ingameName: teamA.teamName || "Player",
              tag: null,
              card: null,
              role: null,
              mainAgent: null,
              secondaryAgents: [],
            });
          }
        }

        // Fetch Team B players
        if (teamB) {
          try {
            let metadata = {};
            if (teamB.metadata) {
              try {
                metadata =
                  typeof teamB.metadata === "string"
                    ? JSON.parse(teamB.metadata)
                    : teamB.metadata;
              } catch (e) {
                console.error("Failed to parse team B metadata:", e);
              }
            }

            // Check if this is a 5v5 team with members roster
            if (metadata.members && Array.isArray(metadata.members)) {
              // It's a 5v5 team - display all roster members
              for (const member of metadata.members) {
                playersB.push({
                  ingameName: member.name,
                  tag: member.tag,
                  card: null,
                  role: null,
                  mainAgent: null,
                  secondaryAgents: [],
                });
              }
            } else {
              // It's a solo/DM player - fetch their profile
              const userProfile = await getUserProfile(teamB.userId);
              if (userProfile) {
                playersB.push({
                  ingameName: userProfile.ingameName || teamB.teamName,
                  tag: userProfile.tag,
                  card: userProfile.card,
                  role: metadata.role || null,
                  mainAgent: metadata.mainAgent || null,
                  secondaryAgents: metadata.secondaryAgents || [],
                });
              } else {
                playersB.push({
                  ingameName: teamB.teamName || "Player",
                  tag: null,
                  card: null,
                  role: null,
                  mainAgent: null,
                  secondaryAgents: [],
                });
              }
            }
          } catch (e) {
            console.error("Failed to fetch Team B players:", e);
            playersB.push({
              ingameName: teamB.teamName || "Player",
              tag: null,
              card: null,
              role: null,
              mainAgent: null,
              secondaryAgents: [],
            });
          }
        }

        setTeamAPlayers(playersA);
        setTeamBPlayers(playersB);
      } catch (error) {
        console.error("Error fetching team players:", error);
      } finally {
        setLoadingPlayers(false);
      }
    };

    if (teamA || teamB) {
      fetchTeamPlayers();
    } else {
      setLoadingPlayers(false);
    }
  }, [teamA, teamB]);

  if (loading || loadingPlayers) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl md:rounded-3xl md:p-6">
        <div className="mb-4 flex items-center gap-3 md:mb-6">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-cyan-500 md:p-3">
            <Users className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight text-white uppercase md:text-lg">
              Team Rosters
            </h3>
            <p className="text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase md:text-[10px]">
              Loading player information...
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Team A Skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-24 animate-pulse rounded bg-slate-800" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <PlayerCard3D key={i} player={null} teamColor="rose" />
              ))}
            </div>
          </div>

          {/* Team B Skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-24 animate-pulse rounded bg-slate-800" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <PlayerCard3D key={i} player={null} teamColor="cyan" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't show roster if no teams are available
  if (!teamA && !teamB) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl md:rounded-3xl md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3 md:mb-6">
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-cyan-500 md:p-3">
          <Users className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <div>
          <h3 className="text-base font-black tracking-tight text-white uppercase md:text-lg">
            Team Rosters
          </h3>
          <p className="text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase md:text-[10px]">
            Player lineups and roles
          </p>
        </div>
      </div>

      {/* Team Rosters Grid */}
      <div
        className={`grid gap-4 md:gap-6 ${teamA && teamB ? "lg:grid-cols-2" : ""}`}
      >
        {/* Team A */}
        {teamA && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-rose-500" />
              <h4 className="text-sm font-black tracking-tight text-rose-500 uppercase">
                {teamA.teamName || "TBD"}
              </h4>
            </div>

            <div className="space-y-2">
              {teamAPlayers.length > 0 ? (
                teamAPlayers.map((player, idx) => (
                  <PlayerCard3D key={idx} player={player} teamColor="rose" />
                ))
              ) : (
                <div className="rounded-xl border border-white/5 bg-slate-900/20 p-4 text-center">
                  <p className="text-xs text-slate-600">
                    No player data available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Team B */}
        {teamB && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-cyan-400" />
              <h4 className="text-sm font-black tracking-tight text-cyan-400 uppercase">
                {teamB.teamName || "TBD"}
              </h4>
            </div>

            <div className="space-y-2">
              {teamBPlayers.length > 0 ? (
                teamBPlayers.map((player, idx) => (
                  <PlayerCard3D key={idx} player={player} teamColor="cyan" />
                ))
              ) : (
                <div className="rounded-xl border border-white/5 bg-slate-900/20 p-4 text-center">
                  <p className="text-xs text-slate-600">
                    No player data available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="mt-4 rounded-xl border border-white/5 bg-slate-950/50 p-3 md:mt-6">
        <p className="text-center text-[9px] font-bold text-slate-600 md:text-[10px]">
          Player roles and agents are based on their registered profile
          preferences
        </p>
      </div>
    </div>
  );
}
