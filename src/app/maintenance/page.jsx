"use client";

import Link from "next/link";
import { Wrench, Clock, ArrowRight, ShieldAlert, Swords, RotateCcw, Gamepad2 } from "lucide-react";
import "@/app/app.css"; // Ensure global styles are available
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function MaintenancePage() {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const iconRef = useRef(null);
  const descRef = useRef(null);
  const statusRef = useRef(null);
  const backgroundRef = useRef(null);

  // Mouse Interaction Refs
  const cursorRef = useRef(null);

  // --- GAME STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targets, setTargets] = useState([]);
  const [gameState, setGameState] = useState("idle"); // idle, playing, gameover
  const timerRef = useRef(null);
  const gameContainerRef = useRef(null);

  // --- GAME LOGIC ---
  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setTimeLeft(30);
    setTargets([]);
    setIsPlaying(true);
    
    // Initial targets
    spawnTarget();
    spawnTarget();
    spawnTarget();

    // Start Timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endGame = () => {
    clearInterval(timerRef.current);
    setGameState("gameover");
  };

  const spawnTarget = () => {
    const id = Date.now() + Math.random();
    const x = Math.random() * 80 + 10; // 10% to 90%
    const y = Math.random() * 80 + 10;
    
    setTargets((prev) => [...prev, { id, x, y }]);
  };

  const handleTargetClick = (id, e) => {
    e.stopPropagation();
    setScore((s) => s + 100);
    setTargets((prev) => prev.filter((t) => t.id !== id));
    
    // Play sound effect (optional/visual only for now)
    // Spawn new target
    spawnTarget();
  };

  const closeGame = () => {
    setIsPlaying(false);
    setGameState("idle");
    clearInterval(timerRef.current);
  };

  // --- GSAP ANIMATIONS ---
  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Initial State
    gsap.set([cardRef.current, titleRef.current, iconRef.current, descRef.current, statusRef.current], {
        opacity: 0,
        y: 20,
        filter: "blur(10px)"
    });

    // 2. Entrance Sequence
    tl.to(cardRef.current, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1,
        ease: "power3.out",
    })
    .to(iconRef.current, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "back.out(1.7)",
    }, "-=0.5")
    .to(titleRef.current, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "power3.out",
    }, "-=0.6")
    .to([descRef.current, statusRef.current], {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
    }, "-=0.6");

     // 3. Scanning Effect
     gsap.to(".scan-line", {
        top: "120%",
        duration: 3,
        ease: "linear",
        repeat: -1,
        repeatDelay: 2
     });

    // Mouse Move Handler
    const handleMouseMove = (e) => {
        // Only do parallax if game is NOT playing
        if (isPlaying || !cardRef.current || !backgroundRef.current) return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const centerX = width / 2;
        const centerY = height / 2;
        
        const clientX = e.clientX;
        const clientY = e.clientY;
        
        // Custom Cursor Follower
        gsap.to(cursorRef.current, {
            x: clientX,
            y: clientY,
            duration: 0.1,
            ease: "power2.out"
        });

        // Calculate normalized position (-1 to 1)
        const xPos = (clientX - centerX) / centerX;
        const yPos = (clientY - centerY) / centerY;

        // 3D Card Tilt
        gsap.to(cardRef.current, {
            rotationY: xPos * 5, 
            rotationX: -yPos * 5,
            duration: 0.5,
            ease: "power2.out",
            transformPerspective: 1000
        });

        // Parallax Background
        gsap.to(backgroundRef.current, {
            x: -xPos * 20,
            y: -yPos * 20,
            duration: 1,
            ease: "power2.out"
        });
    };

    // Attach listener
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        clearInterval(timerRef.current);
    };

  }, { scope: containerRef, dependencies: [isPlaying] });

  return (
    <div ref={containerRef} className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden py-12 bg-slate-950 px-4 text-center font-sans selection:bg-rose-500 selection:text-white">
      {/* Custom Cursor Glow */}
      <div ref={cursorRef} className="pointer-events-none fixed top-0 left-0 z-50 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/10 blur-[100px] mix-blend-screen" />

      {/* Background Ambience */}
      <div ref={backgroundRef} className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[50vw] w-[50vw] rounded-full bg-rose-600/10 blur-[120px] filter" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vw] w-[50vw] rounded-full bg-indigo-600/10 blur-[120px] filter" />
        <div className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900/50 blur-3xl filter" />
        {/* Grid Pattern */}
        <div className="checker-background absolute inset-0 opacity-20" />
      </div>

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-8 perspective-1000">
        
        {/* GAME OVERLAY */}
        {isPlaying && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
                <div ref={gameContainerRef} className="relative h-[80vh] w-[90vw] max-w-4xl overflow-hidden rounded-3xl border border-rose-500/30 bg-slate-900 shadow-2xl">
                    
                    {/* Game Header */}
                    <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-8 py-4 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Score</span>
                                <span className="font-anton text-3xl text-rose-500">{score.toLocaleString()}</span>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Time</span>
                                <span className={`font-anton text-3xl ${timeLeft < 10 ? "text-red-500 animate-pulse" : "text-white"}`}>
                                    {timeLeft}s
                                </span>
                            </div>
                        </div>
                        <button onClick={closeGame} className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10">
                            <span className="sr-only">Close</span>
                            <div className="h-6 w-6 text-slate-400">✕</div>
                        </button>
                    </div>

                    {/* Game Area */}
                    {gameState === "playing" && (
                        <div className="absolute inset-0 cursor-crosshair pt-20">
                            {targets.map((target) => (
                                <button
                                    key={target.id}
                                    onClick={(e) => handleTargetClick(target.id, e)}
                                    className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-300"
                                    style={{ top: `${target.y}%`, left: `${target.x}%` }}
                                >
                                    <div className="relative h-full w-full">
                                        <div className="absolute inset-0 animate-ping rounded-full bg-rose-500/50" />
                                        <div className="absolute inset-0 rounded-full border-2 border-rose-400 bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)] transition-transform active:scale-95" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-white" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Game Over Screen */}
                    {gameState === "gameover" && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm">
                            <h2 className="font-anton text-6xl text-white mb-2">SESSION COMPLETE</h2>
                            <p className="text-xl text-slate-400 mb-8">FINAL SCORE: <span className="text-rose-500 font-bold">{score.toLocaleString()}</span></p>
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={startGame}
                                    className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-rose-600 px-8 py-3 font-bold text-white transition-all hover:bg-rose-500 hover:shadow-[0_0_30px_rgba(244,63,94,0.4)]"
                                >
                                    <RotateCcw className="h-5 w-5 transition-transform group-hover:-rotate-180" />
                                    <span>RETRY PROTOCOL</span>
                                </button>
                                <button 
                                    onClick={closeGame}
                                    className="rounded-full border border-white/10 bg-white/5 px-8 py-3 font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
                                >
                                    EXIT
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Hero Card */}
        <div ref={cardRef} className={`group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 p-6 md:p-12 shadow-2xl backdrop-blur-2xl transition-all duration-500 transform-gpu ${isPlaying ? "opacity-0 pointer-events-none" : "hover:border-rose-500/30 hover:shadow-[0_0_50px_-10px_rgba(244,63,94,0.15)]"}`}>
            
          {/* Scan Line */}
          <div className="scan-line absolute top-[-20%] left-0 z-20 h-[20%] w-full bg-gradient-to-b from-transparent via-rose-500/10 to-transparent blur-sm pointer-events-none" />

          {/* Decorative Elements */}
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl transition-transform duration-1000 group-hover:scale-150" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl transition-transform duration-1000 group-hover:scale-150" />

          {/* Icon Container */}
          <div ref={iconRef} className="mb-8 flex justify-center">
            <div className="relative">
               {/* Pulsing rings */}
              <div className="absolute inset-0 animate-ping rounded-3xl bg-rose-500/20 duration-1000" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-[0_0_30px_-5px_rgba(0,0,0,0.5)] z-10">
                 <Swords className="h-10 w-10 text-rose-500" />
              </div>
              
              {/* Floating Badge */}
               <div className="absolute -right-2 -top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 shadow-lg shadow-rose-500/40">
                <Wrench className="h-4 w-4 text-white animate-spin-slow" />
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-6">
            <h1 ref={titleRef} className="font-anton text-4xl uppercase tracking-wide text-white md:text-7xl drop-shadow-xl">
              System <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-400">Upgrade</span>
            </h1>
            
            <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-rose-500 to-transparent" />

            <p ref={descRef} className="mx-auto max-w-lg text-base md:text-lg font-medium text-slate-400 leading-relaxed">
              We are currently deploying critical updates to the VRivals Arena. 
              The battlefield is temporarily closed while we reinforce the infrastructure.
            </p>

            {/* ACTION BUTTON FOR MINIGAME */}
            <div className="flex flex-col items-center gap-2 pt-2">
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">While you wait...</p>
                <button 
                    onClick={startGame}
                    className="group relative flex items-center gap-3 overflow-hidden rounded-full border border-rose-500/50 bg-rose-500/10 px-8 py-3 transition-all hover:bg-rose-500 hover:text-white hover:shadow-[0_0_40px_rgba(244,63,94,0.4)]"
                >
                    <Gamepad2 className="h-5 w-5 text-rose-400 transition-colors group-hover:text-white" />
                    <span className="relative z-10 text-xs font-black tracking-widest text-rose-400 uppercase group-hover:text-white">Play Aim Trainer</span>
                    <div className="absolute inset-0 -translate-x-full bg-rose-500 transition-transform duration-300 group-hover:translate-x-0" />
                </button>
            </div>

             {/* Status Indicators */}
             <div ref={statusRef} className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <div className="flex items-center gap-3 rounded-full border border-rose-500/20 bg-rose-500/5 px-5 py-2.5 backdrop-blur-md transition-colors hover:border-rose-500/40 hover:bg-rose-500/10">
                   <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                  <span className="text-sm font-bold text-rose-200 uppercase tracking-wider">Maintenance Active</span>
                </div>
                
                 <div className="flex items-center gap-3 rounded-full border border-white/5 bg-white/5 px-5 py-2.5 backdrop-blur-md transition-colors hover:bg-white/10">
                   <Clock className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">ETA: Shortly</span>
                </div>
             </div>
          </div>
        </div>

        {/* Footer Support Link */}
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-sm font-medium text-slate-500 transition-colors hover:text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>Need immediate assistance?</span>
          </div>
          <div className="flex gap-4 mt-2 md:mt-0">
             <a href="mailto:support@vrivalsarena.com" className="text-rose-500 underline decoration-rose-500/30 underline-offset-4 transition-all hover:text-rose-400 hover:decoration-rose-500">Email Support</a>
             <span className="text-slate-700">|</span>
             <a href="https://discord.gg/tBJ5NpudpZ" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline decoration-indigo-400/30 underline-offset-4 transition-all hover:text-indigo-300 hover:decoration-indigo-400">Join Discord Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}