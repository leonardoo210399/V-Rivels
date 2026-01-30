"use client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";

import AnimatedTitle from "./AnimatedTitle";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
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
    <div id="about" className="min-h-screen w-full">
      <div className="relative mt-36 mb-8 flex flex-col items-center gap-5 px-10">
        <p className="font-general text-sm text-black uppercase md:text-sm">
          Welcome to VRivals Arena
        </p>

        <AnimatedTitle
          title="The Ultimate Competitive <br /> Valorant Exp<b>e</b>rience"
          containerClass="mt-5 !text-black text-center"
        />

        <div className="about-subtext">
          <p>The Game of Games begins—your journey to the top starts here</p>
          <p className="text-gray-500">
            Join daily tournaments, find your dream team, and rise through the
            ranks. VRivals Arena is built for champions.
          </p>
        </div>
      </div>

      <div className="h-dvh w-full" id="clip">
        <div className="mask-clip-path about-image">
          <img
            src="/img/about.webp"
            alt="Background"
            className="absolute top-0 left-0 size-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default About;
