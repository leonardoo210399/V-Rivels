"use client";
import { User, Crown, Star, Target, Skull, Swords, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function PlayerCard3D({
  player,
  teamColor = "rose",
  isCaptain = false,
  mirrored = false,
  stats = null,
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [agentImage, setAgentImage] = useState(null);

  useEffect(() => {
    const activeAgentId = stats?.agentId;
    const activeAgentName = player?.mainAgent;

    if (activeAgentId) {
      setAgentImage(
        `https://media.valorant-api.com/agents/${activeAgentId}/displayicon.png`,
      );
    } else if (activeAgentName) {
      fetch(`https://valorant-api.com/v1/agents?isPlayableCharacter=true`)
        .then((res) => res.json())
        .then((data) => {
          const agent = data.data.find(
            (a) =>
              a.displayName.toLowerCase() === activeAgentName.toLowerCase(),
          );
          if (agent) {
            setAgentImage(agent.displayIcon);
          }
        })
        .catch(() => setAgentImage(null));
    } else {
      setAgentImage(null);
    }
  }, [player?.mainAgent, stats?.agentId]);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const colorClasses = {
    rose: {
      border: "border-rose-500/30",
      glow: "glow-rose",
      text: "text-rose-400",
      bg: "from-rose-500/10",
    },
    cyan: {
      border: "border-cyan-400/30",
      glow: "glow-cyan",
      text: "text-cyan-400",
      bg: "from-cyan-500/10",
    },
  };

  const colors = colorClasses[teamColor];

  return (
    <div
      className="perspective-container group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border ${colors.border} glass transition-all duration-500 ${
          isCaptain ? colors.glow : ""
        } hover:scale-105`}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Background Gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${colors.bg} via-transparent to-transparent opacity-50`}
        />

        {/* Captain Crown */}
        {isCaptain && (
          <div
            className={`absolute top-2 z-10 ${mirrored ? "left-2" : "right-2"}`}
          >
            <div
              className={`rounded-full border ${colors.border} bg-slate-900/80 p-1.5 backdrop-blur-md ${colors.glow}`}
            >
              <Crown className={`h-4 w-4 ${colors.text}`} />
            </div>
          </div>
        )}

        {/* Card Content */}
        <div className="relative z-10 p-4">
          <div
            className={`mb-3 flex items-start gap-3 ${mirrored ? "flex-row-reverse" : ""}`}
          >
            {/* Player Avatar */}
            <div
              className={`shrink-0 overflow-hidden rounded-xl border ${colors.border} bg-slate-900/50 p-0 backdrop-blur-sm`}
            >
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden">
                {stats?.agentId && agentImage ? (
                  /* Show Agent Played after match stats are updated */
                  <img
                    src={agentImage}
                    alt=""
                    className="h-full w-full scale-125 object-contain transition-transform hover:scale-110"
                  />
                ) : stats?.playerCard || player?.card ? (
                  /* Show Player Card before match stats */
                  <img
                    src={`https://media.valorant-api.com/playercards/${stats?.playerCard || player.card}/displayicon.png`}
                    alt=""
                    className="h-full w-full object-cover transition-transform hover:scale-110"
                  />
                ) : agentImage ? (
                  /* Fallback to Profile Main Agent */
                  <img
                    src={agentImage}
                    alt=""
                    className="h-full w-full scale-125 object-contain transition-transform hover:scale-110"
                  />
                ) : (
                  <div className="p-2.5">
                    <User className="h-full w-full text-white/50" />
                  </div>
                )}
              </div>
            </div>

            {/* Player Info */}
            <div
              className={`min-w-0 flex-1 ${mirrored ? "flex flex-col items-end text-right" : ""}`}
            >
              <div
                className={`mb-1 flex items-center gap-1.5 ${mirrored ? "flex-row-reverse" : ""}`}
              >
                <h3 className="truncate text-base font-black text-white uppercase md:text-lg">
                  {player?.ign ||
                    player?.ingameName ||
                    player?.name ||
                    "Player"}
                </h3>
                {player?.verified && (
                  <Star className={`h-3.5 w-3.5 ${colors.text} fill-current`} />
                )}
              </div>
              <p
                className={`text-xs font-bold ${colors.text} tracking-wider uppercase ${mirrored ? "text-right" : ""}`}
              >
                {player?.tag || player?.teamTag || "TAG"}
              </p>
            </div>
          </div>

          {/* Player Stats/Role */}
          {player?.role && (
            <div
              className={`mt-3 flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/50 px-3 py-2 ${mirrored ? "flex-row-reverse" : ""}`}
            >
              <span className="text-xs font-bold text-slate-400 uppercase">
                {player.role}
              </span>
              {player?.rank && (
                <span className={`text-xs font-black ${colors.text}`}>
                  {player.rank}
                </span>
              )}
            </div>
          )}

          {/* In-Game Stats Overlay */}
          {stats &&
            (stats.kills > 0 ||
              stats.deaths > 0 ||
              stats.assists > 0 ||
              stats.acs > 0) && (
              <div
                className={`mt-2 grid grid-cols-4 gap-1.5 ${mirrored ? "flex-row-reverse" : ""}`}
              >
                <div className="flex flex-col items-center rounded-lg border border-emerald-500/10 bg-emerald-500/5 py-1.5 transition-colors hover:bg-emerald-500/10">
                  <span className="text-[7px] font-black tracking-widest text-emerald-500/70 uppercase">
                    Kills
                  </span>
                  <span className="text-xs font-black text-white">
                    {stats.kills || 0}
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg border border-red-500/10 bg-red-500/5 py-1.5 transition-colors hover:bg-red-500/10">
                  <span className="text-[7px] font-black tracking-widest text-red-500/70 uppercase">
                    Death
                  </span>
                  <span className="text-xs font-black text-white">
                    {stats.deaths || 0}
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg border border-amber-500/10 bg-amber-500/5 py-1.5 transition-colors hover:bg-amber-500/10">
                  <span className="text-[7px] font-black tracking-widest text-amber-500/70 uppercase">
                    Assist
                  </span>
                  <span className="text-xs font-black text-white">
                    {stats.assists || 0}
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg border border-purple-500/10 bg-purple-500/5 py-1.5 transition-colors hover:bg-purple-500/10">
                  <span className="text-[7px] font-black tracking-widest text-purple-500/70 uppercase">
                    ACS
                  </span>
                  <span className="text-xs font-black text-white">
                    {stats.acs || 0}
                  </span>
                </div>
              </div>
            )}

          {/* Agent Preferences */}
          {player?.agents && player.agents.length > 0 && (
            <div
              className={`mt-2 flex gap-1 ${mirrored ? "flex-row-reverse" : ""}`}
            >
              {player.agents.slice(0, 3).map((agent, index) => (
                <div
                  key={index}
                  className="flex-1 rounded border border-white/10 bg-slate-950/30 px-2 py-1 text-center"
                >
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    {agent}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shimmer Effect on Hover */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="animate-shimmer absolute inset-0" />
        </div>
      </div>
    </div>
  );
}
