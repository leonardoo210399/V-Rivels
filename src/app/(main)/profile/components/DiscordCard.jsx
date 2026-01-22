import { ArrowRight, CheckCircle, ExternalLink, Users } from "lucide-react";

// Discord icon SVG component
const DiscordIcon = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 127.14 96.36"
    className="fill-white"
  >
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c1.24-23.23-13.26-47.57-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

const DISCORD_INVITE_URL = "https://discord.gg/gexZcZzCHV";

export default function DiscordCard({
  discordIdentity,
  discordProfile,
  onUnlink,
  onConnect,
  isInServer = null, // null = loading/unknown, true = member, false = not member
  checkingMembership = false,
}) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#5865F2]/10 p-8 transition-all duration-500 hover:bg-[#5865F2]/20">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <DiscordIcon size={60} />
      </div>

      <div className="relative z-10">
        <div className="mb-6">
          <h3 className="flex items-center gap-3 text-xs font-black tracking-[0.3em] text-[#5865F2] uppercase">
            Community
          </h3>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-[#5865F2] p-3 shadow-lg shadow-[#5865F2]/30">
            <DiscordIcon size={24} />
          </div>

          {discordIdentity ? (
            <>
              {discordProfile?.avatar && (
                <img
                  src={`https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`}
                  alt="Discord Avatar"
                  className="mb-4 h-16 w-16 rounded-full border-2 border-[#5865F2] shadow-lg"
                />
              )}
              <h4 className="mb-0 px-2 text-xl font-black break-all text-white">
                {discordProfile?.global_name ||
                  discordProfile?.username ||
                  discordIdentity.providerInfo?.global_name ||
                  discordIdentity.providerInfo?.name ||
                  "Linked User"}
              </h4>
              <p className="mb-3 px-2 text-[10px] font-bold tracking-wider text-slate-500">
                @
                {discordProfile?.username ||
                  discordIdentity.providerInfo?.username ||
                  discordIdentity.providerEmail?.split("@")[0]}
              </p>

              {/* Membership Status Badge */}
              {checkingMembership ? (
                <div className="mb-3 flex items-center gap-1.5 rounded-full border border-slate-500/20 bg-slate-500/10 px-3 py-1.5">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Checking...
                  </span>
                </div>
              ) : isInServer === true ? (
                <div className="mb-3 flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                    VRivals Member
                  </span>
                </div>
              ) : isInServer === false ? (
                <div className="mb-3 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5">
                    <Users className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                      Not in Server
                    </span>
                  </div>
                  <a
                    href={DISCORD_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-[#5865F2] px-4 py-2 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-[#4752C4]"
                  >
                    Join VRivals Arena
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <p className="mb-3 flex items-center gap-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                  <CheckCircle className="h-3 w-3" />
                  Linked Successfully
                </p>
              )}

              <button
                onClick={onUnlink}
                className="text-[10px] font-black tracking-widest text-slate-500 uppercase transition-all hover:text-rose-500"
              >
                Disconnect
              </button>
            </>
          ) : (
            <>
              <h4 className="mb-2 text-lg font-black text-white">
                Connect Discord
              </h4>
              <p className="mb-6 text-xs text-slate-400">
                Link your account to verify your identity and find teammates.
              </p>
              <button
                onClick={onConnect}
                className="group relative flex items-center gap-2 rounded-xl bg-[#5865F2] px-6 py-3 text-xs font-black tracking-wider text-white uppercase transition-all hover:bg-[#4752C4] hover:shadow-lg hover:shadow-[#5865F2]/20"
              >
                Connect Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
