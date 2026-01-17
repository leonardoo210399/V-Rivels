"use client";
import { User, Shield, Sword, Zap } from "lucide-react";
import { useState, useEffect } from "react";

// Fallback icon for Controller
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

// Fallback icon for Brain (Flex role)
const Brain = ({ className }) => (
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
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

const ROLE_ICONS = {
  Duelist: Sword,
  Controller: Cloud,
  Sentinel: Shield,
  Initiator: Zap,
  Flex: Brain,
};

const ROLE_COLORS = {
  Duelist: "rose",
  Controller: "cyan",
  Sentinel: "emerald",
  Initiator: "amber",
  Flex: "purple",
};

/**
 * PlayerCard Component
 * Displays individual player information with avatar, IGN, tag, role, and agents
 *
 * @param {Object} props
 * @param {Object} props.player - Player data object
 * @param {string} props.player.ingameName - In-game name
 * @param {string} props.player.tag - Player tag
 * @param {string} props.player.role - Player role (Duelist, Controller, etc.)
 * @param {string} props.player.mainAgent - Main agent name
 * @param {string[]} props.player.secondaryAgents - Array of secondary agents
 * @param {string} props.player.card - Player card ID for avatar
 * @param {string} props.teamColor - "rose" or "cyan" for team-specific styling
 */
export default function PlayerCard({ player, teamColor = "slate" }) {
  const [agentImage, setAgentImage] = useState(null);
  const RoleIcon = player?.role ? ROLE_ICONS[player.role] || User : User;
  const roleColor = player?.role ? ROLE_COLORS[player.role] : "slate";

  // Fetch agent image if mainAgent is provided
  useEffect(() => {
    if (player?.mainAgent) {
      fetch(`https://valorant-api.com/v1/agents?isPlayableCharacter=true`)
        .then((res) => res.json())
        .then((data) => {
          const agent = data.data.find(
            (a) =>
              a.displayName.toLowerCase() === player.mainAgent.toLowerCase(),
          );
          if (agent) {
            setAgentImage(agent.displayIcon);
          }
        })
        .catch(() => setAgentImage(null));
    }
  }, [player?.mainAgent]);

  if (!player) {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-900/40 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-slate-800/50">
            <User className="h-5 w-5 text-slate-600" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-slate-800/50" />
            <div className="h-3 w-20 rounded bg-slate-800/30" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-slate-900/60">
      {/* Background Gradient */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-r from-${teamColor}-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100`}
      />

      <div className="relative z-10 flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-${teamColor}-500/20 bg-slate-800/50`}
          >
            {player.card ? (
              <img
                src={`https://media.valorant-api.com/playercards/${player.card}/displayicon.png`}
                alt={player.ingameName}
                className="h-full w-full object-cover"
              />
            ) : agentImage ? (
              <img
                src={agentImage}
                alt={player.mainAgent}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <User className="h-5 w-5 text-slate-500" />
            )}
          </div>

          {/* Role Badge */}
          {player.role && (
            <div
              className={`absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-md border border-${roleColor}-500/30 bg-${roleColor}-500/20`}
            >
              <RoleIcon className={`h-3 w-3 text-${roleColor}-400`} />
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <h4 className="truncate text-sm font-black tracking-tight text-white">
              {player.ingameName || "Player"}
            </h4>
            {player.tag && (
              <span className="text-xs font-bold text-slate-500">
                #{player.tag}
              </span>
            )}
          </div>

          {/* Role & Agent Info */}
          <div className="mt-1 flex items-center gap-2">
            {player.role && (
              <span
                className={`text-[9px] font-black tracking-wider text-${roleColor}-400 uppercase`}
              >
                {player.role}
              </span>
            )}

            {player.mainAgent && (
              <>
                <span className="text-[9px] text-slate-600">•</span>
                <span className="truncate text-[9px] font-bold text-slate-500 uppercase">
                  {player.mainAgent}
                </span>
              </>
            )}
          </div>

          {/* Secondary Agents */}
          {player.secondaryAgents && player.secondaryAgents.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {player.secondaryAgents.slice(0, 3).map((agent, idx) => (
                <span
                  key={idx}
                  className="rounded bg-slate-800/50 px-1.5 py-0.5 text-[8px] font-bold text-slate-600 uppercase"
                >
                  {agent}
                </span>
              ))}
              {player.secondaryAgents.length > 3 && (
                <span className="rounded bg-slate-800/50 px-1.5 py-0.5 text-[8px] font-bold text-slate-600">
                  +{player.secondaryAgents.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
