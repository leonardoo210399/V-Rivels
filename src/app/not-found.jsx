"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import gsap from "gsap";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const glitchRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Flicker animation for the 404 text
      gsap.to(textRef.current, {
        opacity: 0.8,
        duration: 0.1,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        repeatDelay: Math.random() * 2,
      });

      // Glitch effect: random shifts
      const glitchTl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
      glitchTl
        .to(glitchRef.current, { x: -5, duration: 0.05, skewX: 5 })
        .to(glitchRef.current, { x: 5, duration: 0.05, skewX: -5 })
        .to(glitchRef.current, { x: 0, duration: 0.05, skewX: 0 });

      // Entrance animation
      gsap.from(".animate-in", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 text-slate-200"
    >
      {/* Background Elements */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/10 blur-[120px]" />
        <div className="checker-background h-full w-full opacity-50" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        <div className="animate-in mb-8" ref={glitchRef}>
          <h1
            ref={textRef}
            className="hero-heading text-rose-600 drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]"
          >
            404
          </h1>
          <div className="mt-[-20px] h-1 w-full bg-gradient-to-r from-transparent via-rose-500 to-transparent sm:mt-[-40px]" />
        </div>

        <h2 className="special-font animate-in mb-4 text-3xl font-bold tracking-widest uppercase sm:text-5xl">
          Mission Failed
        </h2>

        <p className="animate-in mb-10 max-w-md text-lg text-slate-400">
          Intel suggests this sector is classified or non-existent. You are
          outside the designated combat zone.
        </p>

        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="animate-in group relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-full bg-rose-600 px-8 py-4 font-bold tracking-widest text-white uppercase shadow-lg transition-transform hover:bg-rose-700 hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          <span>Return to Base</span>

          <div className="absolute top-0 -left-full h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-500 group-hover:left-full" />
        </button>
      </div>

      {/* Aesthetic Accents */}
      <div className="animate-in absolute top-10 left-10 hidden flex-col gap-1 font-mono text-[10px] tracking-tighter text-slate-500 uppercase lg:flex">
        <span>Sector: Unknown</span>
        <span>Coordinates: [0, 0, 0]</span>
        <span>Signal: ERROR_NULL</span>
      </div>

      <div className="animate-in absolute right-10 bottom-10 hidden flex-col items-end gap-1 font-mono text-[10px] tracking-tighter text-slate-500 uppercase lg:flex">
        <span>V-Rivals Tactical OS</span>
        <span>Status: Disconnected</span>
      </div>
    </div>
  );
}
