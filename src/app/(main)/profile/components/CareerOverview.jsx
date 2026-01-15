import { Trophy, DollarSign, Crown, Medal, Swords } from "lucide-react";

export default function CareerOverview({ platformProfile }) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 p-8 backdrop-blur-sm">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-rose-600/5 blur-[100px] transition-all duration-700 group-hover:bg-rose-600/10" />

      <div className="relative z-10">
        <div className="mb-8">
          <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-white uppercase">
            <Trophy className="h-6 w-6 text-rose-500" />
            Career Overview
          </h3>
          <p className="mt-1 ml-10 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
            Platform Achievements & Earnings
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {/* Primary Stat - Earnings */}
          <div className="group/box flex flex-col justify-center rounded-3xl border border-white/5 bg-slate-950/80 p-6 transition-all duration-300 hover:border-emerald-500/30 md:col-span-1">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Total Earnings
              </span>
              <div className="rounded-lg bg-emerald-500/10 p-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            </div>
            <div className="font-mono text-3xl font-black tracking-tighter text-white">
              ₹{(platformProfile?.totalEarnings || 0).toLocaleString()}
            </div>
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-3">
            <div className="group/box rounded-3xl border border-white/5 bg-slate-950/80 p-5 transition-all duration-300 hover:border-amber-500/30">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Titles
                </span>
                <Crown className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl leading-none font-black text-white">
                {platformProfile?.tournamentsWon || 0}
              </div>
            </div>

            <div className="group/box rounded-3xl border border-white/5 bg-slate-950/80 p-5 transition-all duration-300 hover:border-slate-400/30">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Finals
                </span>
                <Medal className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl leading-none font-black text-white">
                {platformProfile?.runnerUp || 0}
              </div>
            </div>

            <div className="group/box col-span-2 rounded-3xl border border-white/5 bg-slate-950/80 p-5 transition-all duration-300 hover:border-rose-500/30 md:col-span-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Victories
                </span>
                <Swords className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <div className="mt-2 text-2xl leading-none font-black text-white">
                {platformProfile?.matchesWon || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
