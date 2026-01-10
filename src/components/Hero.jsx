"use client";
import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Play } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [hasClicked, setHasClicked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedVideos, setLoadedVideos] = useState(0);
  const [videoError, setVideoError] = useState(false);

  const totalVideos = 3;
  const nextVdRef = useRef(null);

  // More reliable video sources (Abstract/Gaming/Sci-fi style)
  const getVideoSrc = (index) => {
    // Rotating between a few different vibes
    if (index % 3 === 1) return "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-and-neon-lights-animation-94921-large.mp4";
    if (index % 3 === 2) return "https://assets.mixkit.co/videos/preview/mixkit-gaming-world-concept-animation-99645-large.mp4";
    return "https://assets.mixkit.co/videos/preview/mixkit-red-digital-particle-wave-tech-background-29972-large.mp4";
  };

  const handleVideoLoad = () => {
    setLoadedVideos((prev) => prev + 1);
  };
  
  const handleVideoError = () => {
      console.warn("Hero video failed to load, switching to fallback mode.");
      setVideoError(true);
      setLoading(false);
  };

  useEffect(() => {
    if (loadedVideos === totalVideos - 1) {
      setLoading(false);
    }
  }, [loadedVideos]);

  useGSAP(() => {
    if (hasClicked) {
      gsap.set("#next-video", { visibility: "visible" });
      gsap.to("#next-video", {
        transformOrigin: "center center",
        scale: 1,
        width: "100%",
        height: "100%",
        duration: 1,
        ease: "power1.inOut",
        onStart: () => nextVdRef.current.play(),
      });
      gsap.from("#current-video", {
        transformOrigin: "center center",
        scale: 0,
        duration: 1.5,
        ease: "power1.inOut",
      });
    }
  }, { dependencies: [currentIndex], revertOnUpdate: true });

  useGSAP(() => {
    gsap.set("#video-frame", {
      clipPath: "polygon(14% 0%, 72% 0%, 88% 90%, 0% 100%)",
      borderRadius: "0 0 40% 10%",
    });

    gsap.from("#video-frame", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      borderRadius: "0 0 0 0",
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#video-frame",
        start: "center center",
        end: "bottom center",
        scrub: true,
      },
    });
  });

  const handleMiniVdClick = () => {
    setHasClicked(true);
    setCurrentIndex((prevIndex) => (prevIndex % totalVideos) + 1);
  };

  return (
    <div className="relative h-dvh w-screen overflow-x-hidden bg-slate-950">
      <div
        id="video-frame"
        className="relative z-10 h-dvh w-screen overflow-hidden rounded-lg bg-slate-900"
      >
        <div>
           {/* Mini Clickable Video */}
          <div className="mask-clip-path absolute-center absolute z-50 size-64 cursor-pointer overflow-hidden rounded-lg hover:scale-125 transition-all duration-500 ease-in hidden md:block">
             <div onClick={handleMiniVdClick} className="origin-center scale-50 opacity-0 transition-all duration-500 ease-in hover:scale-100 hover:opacity-100">
                  {!videoError ? (
                      <video
                        ref={nextVdRef}
                        src={getVideoSrc((currentIndex % totalVideos) + 1)}
                        loop
                        muted
                        id="current-video"
                        className="size-64 origin-center scale-150 object-cover object-center"
                        onLoadedData={handleVideoLoad}
                        onError={handleVideoError}
                      />
                  ) : (
                      <img 
                        src="https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg" 
                        className="size-64 object-cover" 
                        alt="Next Video Fallback" 
                      />
                  )}
             </div>
          </div>
          
          {/* Main Background Video */}
          {!videoError ? (
                <>
                  <video
                    ref={nextVdRef}
                    src={getVideoSrc(currentIndex)}
                    loop
                    muted
                    id="next-video"
                    className="absolute-center absolute z-20 size-64 object-cover object-center invisible"
                    onLoadedData={handleVideoLoad}
                  />
                  <video
                    src={getVideoSrc(currentIndex === totalVideos - 1 ? 1 : currentIndex)}
                    autoPlay
                    loop
                    muted
                    className="absolute left-0 top-0 size-full object-cover object-center opacity-60"
                    onLoadedData={handleVideoLoad}
                  />
                </>
          ) : (
             <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg')] bg-cover bg-center opacity-60" />
          )}
        </div>

        <h1 className="special-font hero-heading absolute bottom-5 right-5 z-40 text-white font-black drop-shadow-lg">
          G<b>A</b>MING
        </h1>
        
        <div className="absolute left-0 top-0 z-40 size-full">
            <div className="mt-24 px-5 sm:px-10">
                <h1 className="special-font hero-heading text-white drop-shadow-lg mix-blend-overlay">
                   REDEFI<b>N</b>E
                </h1>
                <p className="mb-5 max-w-64 font-robert-regular text-slate-200">
                    Enter the Metagame <br /> Compete for Glory
                </p>
                <div className="flex gap-4">
                     <button className="flex items-center gap-2 rounded-full hidden bg-yellow-300 px-6 py-3 font-bold text-black transition-transform hover:scale-105">
                        <Play className="fill-current h-4 w-4" />
                        WATCH TRAILER
                    </button>
                </div>
            </div>
        </div>
      </div>
      
      {/* Background Text that gets revealed */}
      <h1 className="special-font hero-heading absolute bottom-5 right-5 text-slate-800 font-black">
          G<b>A</b>MING
      </h1>
    </div>
  );
}
