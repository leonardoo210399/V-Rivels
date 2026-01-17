"use client";
import { useState } from "react";
import { User, Crown, Star } from "lucide-react";

export default function PlayerCard3D({
  player,
  teamColor = "rose",
  isCaptain = false,
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

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
          <div className="absolute top-2 right-2 z-10">
            <div
              className={`rounded-full border ${colors.border} bg-slate-900/80 p-1.5 backdrop-blur-md ${colors.glow}`}
            >
              <Crown className={`h-4 w-4 ${colors.text}`} />
            </div>
          </div>
        )}

        {/* Card Content */}
        <div className="relative z-10 p-4">
          <div className="mb-3 flex items-start gap-3">
            {/* Player Avatar */}
            <div
              className={`shrink-0 rounded-xl border ${colors.border} bg-slate-900/50 p-3 backdrop-blur-sm`}
            >
              <User className="h-8 w-8 text-white" />
            </div>

            {/* Player Info */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1.5">
                <h3 className="truncate text-base font-black text-white uppercase md:text-lg">
                  {player?.ign || player?.name || "Player"}
                </h3>
                {player?.verified && (
                  <Star className={`h-3.5 w-3.5 ${colors.text} fill-current`} />
                )}
              </div>
              <p
                className={`text-xs font-bold ${colors.text} tracking-wider uppercase`}
              >
                {player?.teamTag || "TAG"}
              </p>
            </div>
          </div>

          {/* Player Stats/Role */}
          {player?.role && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/50 px-3 py-2">
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

          {/* Agent Preferences */}
          {player?.agents && player.agents.length > 0 && (
            <div className="mt-2 flex gap-1">
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
