"use client";
import React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimatedTitle from "./AnimatedTitle";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  useGSAP(() => {
    const clipAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: "#clip",
        start: "center center",
        end: "+=800 center",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
      },
    });

    clipAnimation.to(".mask-clip-path", {
      width: "100vw",
      height: "100vh",
      borderRadius: 0,
    });
  });

  return (
    <div id="about" className="min-h-screen w-screen relative">
      <div className="relative mb-8 mt-36 flex flex-col items-center gap-5">
        <p className="font-general text-sm uppercase md:text-[10px] text-rose-500 font-bold tracking-widest">
            Welcome to VRivals
        </p>

        <AnimatedTitle
          title="Discover the world's <br /> most immersive tournament platform"
          containerClass="mt-5 !text-white text-center"
        />

        <div className="about-subtext mt-5 text-center px-4">
          <p className="text-slate-300 text-lg md:max-w-2xl mx-auto font-medium">
            The Metagame begins here. Your life, now an epic MMORPG. 
            VRivals unites every player from every region into a single persistent tournament economy.
          </p>
        </div>
      </div>

      <div className="h-dvh w-screen" id="clip">
        <div className="mask-clip-path about-image relative left-1/2 top-0 z-20 h-[60vh] w-[30vw] origin-center -translate-x-1/2 overflow-hidden rounded-3xl bg-slate-900 md:w-[30vw]">
          <img
            src="https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg"
            alt="Background"
            className="absolute left-0 top-0 size-full object-cover"
          />
           <div className="absolute inset-0 bg-black/40" />
        </div>
      </div>
    </div>
  );
}
