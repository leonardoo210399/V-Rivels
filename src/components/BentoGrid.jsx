"use client";
import React, { useRef, useState } from "react";
import { Trophy, Activity, Users, ArrowUpRight } from "lucide-react";

export const BentoTilt = ({ children, className = "" }) => {
  const [transformStyle, setTransformStyle] = useState("");
  const itemRef = useRef(null);

  const handleMouseMove = (event) => {
    if (!itemRef.current) return;

    const { left, top, width, height } =
      itemRef.current.getBoundingClientRect();

    const relativeX = (event.clientX - left) / width;
    const relativeY = (event.clientY - top) / height;

    const tiltX = (relativeY - 0.5) * 5;
    const tiltY = (relativeX - 0.5) * -5;

    const newTransform = `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(0.95, 0.95, 0.95)`;
    setTransformStyle(newTransform);
  };

  const handleMouseLeave = () => {
    setTransformStyle("");
  };

  return (
    <div
      ref={itemRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: transformStyle }}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({ src, title, description, isComingSoon }) => {
  return (
    <div className="relative size-full">
      <video
        src={src}
        loop
        muted
        autoPlay
        className="absolute left-0 top-0 size-full object-cover object-center"
      />
      <div className="relative z-10 flex size-full flex-col justify-between p-5 text-blue-50">
        <div>
          <h1 className="bento-title special-font text-4xl font-black uppercase text-white shadow-sm">
              {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-64 text-xs md:text-base font-medium opacity-80 shadow-sm">
                {description}
            </p>
          )}
        </div>
        
        {isComingSoon && (
            <div className="flex items-center gap-2 self-end rounded-full bg-black/50 px-3 py-1 text-xs backdrop-blur-md border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                COMING SOON
            </div>
        )}
      </div>
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    </div>
  );
};

export default function BentoGrid() {
  return (
    <section className="bg-slate-950 pb-52 pt-24 text-white">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-sm font-semibold uppercase tracking-widest text-slate-500">
            Platform Features
        </h2>
        
        <div className="grid h-[150vh] w-full grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-3 text-white">
          {/* Main Card */}
          <BentoTilt className="relative col-span-1 row-span-1 md:col-span-2 md:row-span-2 overflow-hidden rounded-md border border-white/10 transition-transform duration-300 ease-out bg-slate-900">
            <BentoCard
              src="https://videos.pexels.com/video-files/3163534/3163534-uhd_2560_1440_30fps.mp4"
              title={<>TOURNAMENT <br /> SYSTEM</>}
              description="Create, join, and manage high-stakes tournaments with automated bracket generation and prize distribution."
            />
          </BentoTilt>

          {/* Side Card 1 */}
          <BentoTilt className="relative col-span-1 row-span-1 overflow-hidden rounded-md border border-white/10 transition-transform duration-300 ease-out bg-slate-900">
             <BentoCard
              src="https://videos.pexels.com/video-files/4427814/4427814-uhd_2560_1440_24fps.mp4"
              title="LIVE STATS"
              description="Real-time tracking of your K/D/A, MMR, and match history."
            />
          </BentoTilt>

          {/* Side Card 2 */}
          <BentoTilt className="relative col-span-1 row-span-1 overflow-hidden rounded-md border border-white/10 transition-transform duration-300 ease-out bg-slate-900">
             <BentoCard
              src="https://videos.pexels.com/video-files/6849887/6849887-uhd_2560_1440_25fps.mp4"
              title="LEADERBOARDS"
              description="Compete for the top spot globally and regionally."
              isComingSoon
            />
          </BentoTilt>

           {/* Bottom Wide Card */}
           <BentoTilt className="relative col-span-1 md:col-span-2 row-span-1 overflow-hidden rounded-md border border-white/10 transition-transform duration-300 ease-out bg-slate-900">
             <BentoCard
               src="https://videos.pexels.com/video-files/7710243/7710243-uhd_2560_1440_30fps.mp4" 
              title="TEAM MANAGEMENT"
              description="Build your dream team, assign roles, and scrim against others."
            />
          </BentoTilt>
          
           {/* Bottom Small Card */}
           <BentoTilt className="relative col-span-1 row-span-1 overflow-hidden rounded-md border border-white/10 transition-transform duration-300 ease-out bg-slate-900">
             <div className="flex size-full flex-col justify-center bg-rose-600 p-5 text-center transition-colors hover:bg-rose-700">
                <Trophy className="mx-auto mb-4 h-12 w-12 text-black" />
                <h3 className="special-font text-3xl font-black uppercase text-black">PRIZE POOLS</h3>
                <p className="mt-2 text-sm text-black/70 font-medium">Over $10,000 awarded monthly</p>
             </div>
          </BentoTilt>

        </div>
      </div>
    </section>
  );
}
