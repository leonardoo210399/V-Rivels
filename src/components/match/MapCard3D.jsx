"use client";
import { useState } from "react";
import { XCircle, Zap } from "lucide-react";

export default function MapCard3D({
  map,
  isBanned,
  isSelected,
  onBan,
  disabled,
  isBanning,
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    if (disabled || isBanned || isSelected) return;

    setIsFlipped(true);
    setTimeout(() => {
      onBan && onBan(map.name);
    }, 300);
  };

  const mapImage = typeof map.image === "object" ? map.image?.src : map.image;

  if (isSelected) {
    return (
      <div className="animate-fadeIn col-span-2 md:col-span-3">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
          <div
            className="relative h-64 bg-cover bg-center md:h-80"
            style={{ backgroundImage: `url(${mapImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="glow-emerald mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-4 py-2">
                <Zap className="h-5 w-5 animate-pulse text-emerald-400" />
                <span className="text-sm font-black tracking-widest text-emerald-400 uppercase">
                  Map Selected
                </span>
              </div>

              <h3 className="text-glow-rose bg-gradient-to-br from-rose-400 to-cyan-400 bg-clip-text text-5xl font-black text-transparent uppercase italic md:text-6xl lg:text-7xl">
                {map.name}
              </h3>
            </div>

            {/* Decorative Border */}
            <div className="absolute inset-0 rounded-3xl border-2 border-emerald-500/30" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isBanned || isBanning}
      className={`group relative overflow-hidden rounded-xl border transition-all duration-300 md:rounded-2xl ${
        isBanned
          ? "cursor-not-allowed border-transparent opacity-40 grayscale"
          : isBanning
            ? "scale-95 border-red-500/50"
            : "border-white/10 shadow-xl hover:scale-105 hover:shadow-2xl hover:shadow-rose-500/20"
      }`}
      style={{
        height: "140px",
      }}
    >
      {/* Map Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{
          backgroundImage: `url(${mapImage})`,
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
        }}
      />

      {/* Overlay */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          isBanned
            ? "bg-slate-950/90"
            : isBanning
              ? "bg-red-950/80"
              : "bg-slate-950/60 group-hover:bg-red-950/60"
        }`}
      />

      {/* Ban Icon for Banned State */}
      {isBanned && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <XCircle className="h-12 w-12 text-red-500/50 md:h-16 md:w-16" />
        </div>
      )}

      {/* Spinner for Banning State */}
      {isBanning && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-red-500 border-t-transparent" />
        </div>
      )}

      {/* Map Name */}
      <div className="relative z-20 flex h-full items-center justify-center p-4">
        <span
          className={`text-center text-sm font-black tracking-wider uppercase transition-all md:text-base ${
            isBanned
              ? "text-slate-600 line-through"
              : isBanning
                ? "text-red-400"
                : "text-white group-hover:scale-110 group-hover:text-rose-400"
          }`}
        >
          {map.name}
        </span>
      </div>

      {/* Hover Glow Effect */}
      {!isBanned && !isBanning && (
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-t from-rose-500/20 to-transparent" />
        </div>
      )}

      {/* Border Glow on Hover */}
      {!isBanned && !isBanning && (
        <div className="absolute inset-0 rounded-xl border border-rose-500/0 transition-all duration-300 group-hover:border-rose-500/50 md:rounded-2xl" />
      )}
    </button>
  );
}
