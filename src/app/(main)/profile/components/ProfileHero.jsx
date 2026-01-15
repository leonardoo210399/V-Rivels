import { Activity, Trophy, Zap } from "lucide-react";

export default function ProfileHero({ valProfile, cardData, mmrData, region }) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-sm transition-all duration-500 hover:border-white/10">
      {/* Immersive Background */}
      <div className="absolute inset-0 overflow-hidden">
        {cardData?.wideArt ? (
          <>
            <img
              src={cardData.wideArt}
              className="h-full w-full object-cover opacity-100 transition-transform duration-700 group-hover:scale-105"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent md:bg-gradient-to-r md:from-slate-950 md:via-slate-950/90 md:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-80 md:opacity-60" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-blue-500/10" />
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 p-5 md:flex-row md:gap-10 md:p-12">
        {/* Card Display */}
        <div className="group/card relative">
          <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-2 border-white/10 shadow-2xl transition-transform duration-500 group-hover/card:scale-105 group-hover/card:-rotate-1 md:h-32 md:w-32">
            {cardData?.smallArt ? (
              <img
                src={cardData?.smallArt}
                alt="Player Card"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full animate-pulse bg-slate-800" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
              <div className="rounded-md bg-rose-600/90 px-1.5 py-0.5 text-center text-[8px] font-black text-white">
                LVL {valProfile.account_level}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="mb-1 flex items-center justify-center gap-2 md:justify-start">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-[8px] font-black tracking-widest text-emerald-500 uppercase">
              Platform Verified Player
            </span>
          </div>
          <div className="mb-4 flex items-end justify-center gap-1 md:justify-start">
            <h2 className="text-3xl leading-none font-black tracking-tighter text-white uppercase md:text-5xl">
              {valProfile.name}
            </h2>
            <span className="mb-1 text-xl font-bold text-slate-500/50">
              #{valProfile.tag}
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-3 md:justify-start">
            <div className="group/stat flex items-center gap-3 rounded-2xl border border-white/5 bg-black/40 px-5 py-2.5 backdrop-blur-xl transition-all hover:bg-black/60">
              <Activity className="h-4 w-4 text-rose-500 transition-transform group-hover/stat:scale-110" />
              <div>
                <p className="mb-1 text-[9px] leading-none font-black tracking-widest text-slate-500 uppercase">
                  Current Tier
                </p>
                <p className="text-xs font-black text-white uppercase">
                  {mmrData?.current_data?.currenttierpatched || "Unranked"}
                </p>
              </div>
            </div>

            <div className="group/stat flex items-center gap-3 rounded-2xl border border-white/5 bg-black/40 px-5 py-2.5 backdrop-blur-xl transition-all hover:bg-black/60">
              <Trophy className="h-4 w-4 text-yellow-500 transition-transform group-hover/stat:scale-110" />
              <div>
                <p className="mb-1 text-[9px] leading-none font-black tracking-widest text-slate-500 uppercase">
                  Peak Rating
                </p>
                <p className="text-xs font-black text-white uppercase">
                  {mmrData?.highest_rank?.patched_tier || "N/A"}
                </p>
              </div>
            </div>

            <div className="group/stat flex items-center gap-3 rounded-2xl border border-white/5 bg-black/40 px-5 py-2.5 backdrop-blur-xl transition-all hover:bg-black/60">
              <Zap className="h-4 w-4 text-blue-500 transition-transform group-hover/stat:scale-110" />
              <div>
                <p className="mb-1 text-[9px] leading-none font-black tracking-widest text-slate-500 uppercase">
                  Region
                </p>
                <p className="text-xs font-black text-white uppercase">
                  {valProfile.region?.toUpperCase() || region?.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
