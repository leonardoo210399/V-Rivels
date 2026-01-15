import { ArrowRight, AlertCircle, ChevronDown, UserPlus } from "lucide-react";
import Loader from "@/components/Loader";

export default function LinkAccountForm({
  riotId,
  setRiotId,
  riotTag,
  setRiotTag,
  region,
  setRegion,
  onSubmit,
  loading,
  error,
}) {
  return (
    <div className="group relative mx-auto my-12 max-w-4xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 p-12 text-center shadow-2xl backdrop-blur-xl md:p-20">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-600/10 blur-[120px]" />
      <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-600/5 blur-[120px]" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-8 rounded-[2rem] border border-white/5 bg-slate-950 p-6 shadow-inner">
          <UserPlus className="h-16 w-16 animate-pulse text-rose-500" />
        </div>

        <h2 className="mb-4 text-4xl font-black tracking-tighter text-white uppercase md:text-5xl">
          Complete Your Profile
        </h2>
        <p className="mb-12 max-w-sm text-sm text-slate-400 md:text-base">
          Link your Valorant account to track your stats, join tournaments, and
          appear on the leaderboard.
        </p>

        <form onSubmit={onSubmit} className="w-full max-w-lg space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-3">
              <label className="mb-2 ml-1 block text-left text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Riot ID
              </label>
              <input
                type="text"
                placeholder="e.g. TenZ"
                value={riotId}
                onChange={(e) => setRiotId(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-slate-950 px-6 py-4 font-bold text-white transition-all placeholder:text-slate-700 focus:border-rose-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-2 ml-1 block text-left text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Tag
              </label>
              <input
                type="text"
                placeholder="#NA1"
                value={riotTag}
                onChange={(e) => setRiotTag(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-slate-950 px-6 py-4 text-center font-black text-white transition-all placeholder:text-slate-700 focus:border-rose-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="text-left">
            <label className="mb-2 ml-1 block text-left text-[10px] font-black tracking-widest text-slate-500 uppercase">
              Server Region
            </label>
            <div className="group relative">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-2xl border border-white/5 bg-slate-950 px-6 py-4 font-bold text-white transition-all focus:border-rose-500 focus:outline-none"
                required
              >
                <option value="ap">Asia Pacific (AP)</option>
                <option value="eu">Europe (EU)</option>
                <option value="na">North America (NA)</option>
                <option value="kr">Korea (KR)</option>
                <option value="br">Brazil (BR)</option>
                <option value="latam">Latin America (LATAM)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-6 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-hover:text-white" />
            </div>
          </div>

          {error && (
            <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-left text-xs font-bold text-rose-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-2xl bg-rose-600 py-5 text-sm font-black text-white shadow-2xl shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <Loader fullScreen={false} size="sm" />
              ) : (
                <>
                  <span>Link My Account</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
