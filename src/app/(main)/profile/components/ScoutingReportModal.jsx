import { UserPlus, ChevronDown } from "lucide-react";
import Loader from "@/components/Loader";
import { agentIcons } from "@/assets/images/agents";
import { rankIcons } from "@/assets/images/ranks";

const ROLE_ICONS = ["Duelist", "Controller", "Sentinel", "Initiator", "Flex"];

export default function ScoutingReportModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  userPost,
  mmrData,
  availableAgents,
  posting,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div className="animate-in fade-in zoom-in-95 relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl md:p-8">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 shadow-lg shadow-rose-500/5">
            <UserPlus className="h-8 w-8 text-rose-500" />
          </div>
          <div>
            <h2 className="mb-1 text-2xl font-black tracking-tight text-white uppercase">
              {userPost ? "Update Scouting Report" : "Create Scouting Report"}
            </h2>
            <p className="text-xs font-bold tracking-[0.3em] text-slate-500 uppercase">
              {userPost
                ? "Keep your recruitment profile fresh and active"
                : "List yourself as a available talent for teams"}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Preferred Role
              </label>
              <div className="group relative">
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-slate-950 p-4 pr-10 font-black tracking-wider text-white uppercase transition-all outline-none group-hover:bg-slate-900 focus:border-rose-500"
                >
                  {ROLE_ICONS.map((r) => (
                    <option key={r} value={r} className="bg-slate-950">
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-hover:text-white" />
              </div>
            </div>

            <div className="flex items-end">
              <div className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-slate-950 p-4 opacity-60">
                {mmrData?.current_data?.images?.small && (
                  <img
                    src={
                      typeof rankIcons[mmrData.current_data.currenttier] ===
                      "object"
                        ? rankIcons[mmrData.current_data.currenttier]?.src
                        : rankIcons[mmrData.current_data.currenttier] ||
                          mmrData.current_data.images.small
                    }
                    alt=""
                    className="h-8 w-8 object-contain"
                  />
                )}
                <div>
                  <p className="mb-1 text-[10px] leading-none font-black tracking-widest text-slate-500 uppercase">
                    Auto-Synced Rank
                  </p>
                  <p className="text-sm font-bold text-white uppercase">
                    {mmrData?.current_data?.currenttierpatched || "Unranked"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Selection */}
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="flex flex-col items-center">
              <label className="mb-4 block flex w-full items-center justify-between border-b border-white/5 pb-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                Main Agent
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-400 normal-case">
                  Your star pick
                </span>
              </label>
              <div className="grid grid-cols-5 justify-center gap-3 sm:grid-cols-6">
                {availableAgents.map((agent) => (
                  <button
                    key={agent.uuid}
                    type="button"
                    onClick={() => {
                      const updatedSecondary = formData.secondaryAgents.filter(
                        (a) => a !== agent.displayName,
                      );
                      setFormData({
                        ...formData,
                        mainAgent: agent.displayName,
                        secondaryAgents: updatedSecondary,
                      });
                    }}
                    className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                      formData.mainAgent === agent.displayName
                        ? "z-10 scale-105 border-rose-500 shadow-2xl shadow-rose-500/30"
                        : "border-white/5 opacity-30 hover:scale-105 hover:opacity-100"
                    }`}
                    title={agent.displayName}
                  >
                    <img
                      src={
                        typeof agentIcons[agent.displayName] === "object"
                          ? agentIcons[agent.displayName]?.src
                          : agentIcons[agent.displayName] || agent.displayIcon
                      }
                      alt={agent.displayName}
                      className="h-full w-full object-cover"
                    />
                    {formData.mainAgent === agent.displayName && (
                      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/80 to-transparent pb-1">
                        <span className="text-[8px] font-black tracking-widest text-rose-400 uppercase">
                          Main
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <label className="mb-4 block flex w-full items-center justify-between border-b border-white/5 pb-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                Secondary Agents
                <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[9px] font-bold text-slate-400 normal-case tabular-nums">
                  {formData.secondaryAgents.length}/5
                </span>
              </label>
              <div className="grid grid-cols-5 justify-center gap-3 sm:grid-cols-6">
                {availableAgents.map((agent) => (
                  <button
                    key={agent.uuid}
                    type="button"
                    disabled={formData.mainAgent === agent.displayName}
                    onClick={() => {
                      const current = formData.secondaryAgents;
                      if (current.includes(agent.displayName)) {
                        setFormData({
                          ...formData,
                          secondaryAgents: current.filter(
                            (a) => a !== agent.displayName,
                          ),
                        });
                      } else if (current.length < 5) {
                        setFormData({
                          ...formData,
                          secondaryAgents: [...current, agent.displayName],
                        });
                      }
                    }}
                    className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                      formData.secondaryAgents.includes(agent.displayName)
                        ? "z-10 scale-105 border-rose-400 shadow-xl shadow-rose-400/20"
                        : "border-white/5 opacity-30 hover:scale-105 hover:opacity-100"
                    }`}
                    title={agent.displayName}
                  >
                    <img
                      src={
                        typeof agentIcons[agent.displayName] === "object"
                          ? agentIcons[agent.displayName]?.src
                          : agentIcons[agent.displayName] || agent.displayIcon
                      }
                      alt={agent.displayName}
                      className="h-full w-full object-cover"
                    />
                    {formData.secondaryAgents.includes(agent.displayName) && (
                      <div className="absolute top-0 right-0 p-1">
                        <div className="h-2 w-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-3 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
              Scouting Report / Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Tell teams about your playstyle, availability, and main agents..."
              className="h-32 w-full rounded-xl border border-white/10 bg-slate-950 p-4 text-sm text-white transition-all outline-none placeholder:text-slate-700 focus:border-rose-500"
              required
            />
          </div>

          <div className="flex flex-col items-center gap-6 border-t border-white/5 pt-4">
            <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <button
                type="submit"
                disabled={
                  posting ||
                  !formData.mainAgent ||
                  formData.secondaryAgents.length === 0 ||
                  !formData.description.trim()
                }
                className="flex flex-1 items-center justify-center rounded-2xl border border-transparent bg-rose-600 py-4 text-sm font-black tracking-[0.2em] text-white uppercase shadow-xl shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-[0.98] active:shadow-none disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-slate-800 disabled:text-slate-500"
              >
                {posting ? (
                  <Loader fullScreen={false} size="sm" />
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <UserPlus className="h-5 w-5" />
                    {userPost
                      ? "Update Scouting Report"
                      : "Publish Scouting Report"}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-slate-800 px-8 py-4 text-sm font-black tracking-[0.2em] text-white uppercase transition-all hover:bg-rose-700 active:scale-[0.98] md:w-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
