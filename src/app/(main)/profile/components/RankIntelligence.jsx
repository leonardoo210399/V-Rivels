import { Activity, Trophy } from "lucide-react";
import { rankIcons } from "@/assets/images/ranks";

// Helper to get rank glow color
function getRankColor(tierPatched) {
  if (tierPatched?.includes("Platinum")) return "bg-cyan-500";
  if (tierPatched?.includes("Diamond")) return "bg-purple-500";
  if (tierPatched?.includes("Ascendant")) return "bg-emerald-500";
  if (tierPatched?.includes("Immortal")) return "bg-rose-500";
  if (tierPatched?.includes("Radiant")) return "bg-yellow-500";
  return "bg-slate-500";
}

// Helper to get progress bar color
function getProgressColor(tierPatched) {
  if (tierPatched?.includes("Platinum")) return "bg-cyan-500";
  if (tierPatched?.includes("Diamond")) return "bg-purple-500";
  if (tierPatched?.includes("Ascendant")) return "bg-emerald-500";
  return "bg-rose-500";
}

export default function RankIntelligence({ mmrData, mmrLoading }) {
  const tierPatched = mmrData?.current_data?.currenttierpatched;

  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 p-8 backdrop-blur-sm transition-all duration-500 hover:border-white/10">
      {/* Background Rank Glow */}
      <div
        className={`absolute -top-24 -right-24 h-64 w-64 opacity-10 blur-[100px] transition-opacity duration-700 group-hover:opacity-20 ${getRankColor(tierPatched)}`}
      />

      <div className="relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="flex items-center gap-3 text-xs font-black tracking-[0.3em] text-slate-500 uppercase">
            <Activity className="h-4 w-4" />
            Rank Intelligence
          </h3>
        </div>

        {mmrData?.current_data?.currenttierpatched ? (
          <div className="flex flex-col items-center">
            {/* Peak Rank Header */}
            {mmrData?.highest_rank?.patched_tier && (
              <div className="mb-8 w-full">
                <div className="group/peak relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-amber-600/5 p-4 transition-all duration-500 hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                  <div className="absolute -top-4 -right-4 opacity-10 transition-opacity group-hover:opacity-20">
                    <Trophy className="h-16 w-16 text-yellow-500" />
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-[8px] font-black tracking-[0.3em] text-yellow-500/70 uppercase">
                        Career Achievement
                      </p>
                      <h5 className="flex items-center gap-2 text-sm font-black tracking-tight text-white uppercase">
                        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                        Peak: {mmrData.highest_rank.patched_tier}
                      </h5>
                    </div>
                    <img
                      src={
                        typeof rankIcons[mmrData.highest_rank.tier] === "object"
                          ? rankIcons[mmrData.highest_rank.tier]?.src
                          : rankIcons[mmrData.highest_rank.tier] ||
                            mmrData.highest_rank.images?.small
                      }
                      alt="Peak Rank"
                      className="h-10 w-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-transform group-hover/peak:scale-110"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Current Rank Icon */}
            <div className="group/rank relative mb-8">
              <div
                className={`absolute inset-0 scale-125 rounded-full opacity-20 blur-[40px] transition-all duration-700 ${getRankColor(tierPatched)}`}
              />

              <img
                src={
                  typeof rankIcons[mmrData.current_data.currenttier] ===
                  "object"
                    ? rankIcons[mmrData.current_data.currenttier]?.src
                    : rankIcons[mmrData.current_data.currenttier] ||
                      mmrData.current_data.images?.large ||
                      mmrData.current_data.images?.small
                }
                alt="Rank"
                className="relative z-10 h-32 w-32 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform duration-700 group-hover/rank:scale-110"
              />

              {mmrData.current_data.mmr_change_to_last_game !== undefined && (
                <div
                  className={`absolute -right-2 -bottom-1 z-20 rounded-xl border-2 px-2 py-1 text-[9px] font-black shadow-xl transition-all group-hover/rank:-translate-x-1 ${
                    mmrData.current_data.mmr_change_to_last_game >= 0
                      ? "border-emerald-500/50 bg-slate-950 text-emerald-400"
                      : "border-rose-500/50 bg-slate-950 text-rose-400"
                  }`}
                >
                  {mmrData.current_data.mmr_change_to_last_game >= 0
                    ? "▲"
                    : "▼"}{" "}
                  {Math.abs(mmrData.current_data.mmr_change_to_last_game)}
                </div>
              )}
            </div>

            {/* Current Standing */}
            <div className="mb-6 w-full space-y-3 text-center">
              <div className="pt-1">
                <p className="mb-2 text-[9px] leading-none font-black tracking-[0.2em] text-slate-500 uppercase">
                  Current Standing
                </p>
                <h4 className="mb-4 text-3xl font-black tracking-tighter text-white transition-colors group-hover:text-rose-500">
                  {tierPatched}
                </h4>

                {/* RR Progress Bar */}
                <div className="space-y-1.5 px-4">
                  <div className="flex items-end justify-between px-1">
                    <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">
                      Rating Progress
                    </span>
                    <p className="text-[10px] font-black text-white tabular-nums">
                      {mmrData.current_data.ranking_in_tier}
                      <span className="ml-0.5 text-[8px] text-slate-500">
                        RR
                      </span>
                    </p>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950 p-[1px]">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(tierPatched)}`}
                      style={{
                        width: `${mmrData.current_data.ranking_in_tier}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ELO Score */}
            <div className="mb-2 grid w-full grid-cols-1 gap-4">
              <div className="group/elo relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/80 p-6">
                <div className="absolute top-0 right-0 rotate-12 p-4 opacity-5">
                  <Activity className="h-16 w-16" />
                </div>
                <div className="relative z-10">
                  <p className="mb-1.5 text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    Intelligence Score
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-black tracking-tighter text-white transition-colors group-hover:text-rose-500">
                      {mmrData.current_data.elo}
                    </span>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-slate-600 uppercase">
                      ELO
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : mmrLoading ? (
          <div className="flex animate-pulse flex-col items-center py-10">
            <div className="mb-8 h-40 w-40 rounded-full bg-slate-800/50" />
            <div className="mb-4 h-10 w-48 rounded-xl bg-slate-800/50" />
            <div className="h-4 w-32 rounded-lg bg-slate-800/50" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <img
              src={
                typeof rankIcons[0] === "object"
                  ? rankIcons[0]?.src
                  : rankIcons[0]
              }
              alt="Unranked"
              className="mb-6 h-24 w-24 grayscale"
            />
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
              Rank Unavailable
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
