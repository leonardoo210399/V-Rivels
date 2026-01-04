"use client";
import React from "react";
import AnimatedTitle from "./AnimatedTitle";
import { Users, Trophy, Crosshair } from "lucide-react";

const ImageClipBox = ({ src, clipClass }) => (
  <div className={clipClass}>
    <img src={src} alt="decoration" className="h-full w-full object-cover" />
  </div>
);

export default function Contact() {
  return (
    <div id="contact" className="my-20 min-h-96 w-screen px-10">
      <div className="relative rounded-lg bg-black py-24 text-blue-50 sm:overflow-hidden border border-white/10">
        <div className="absolute -left-20 top-0 hidden h-full w-72 overflow-hidden sm:block lg:left-20 lg:w-96">
          <ImageClipBox
            src="https://images.pexels.com/photos/9072388/pexels-photo-9072388.jpeg"
            clipClass="contact-clip-path-1"
          />
          <ImageClipBox
            src="https://images.pexels.com/photos/7775636/pexels-photo-7775636.jpeg"
            clipClass="contact-clip-path-2 lg:translate-y-40 translate-y-60"
          />
        </div>

        <div className="absolute -top-40 left-20 w-60 sm:top-1/2 md:left-auto md:right-10 lg:top-20 lg:w-80">
          <ImageClipBox
            src="https://images.pexels.com/photos/7775641/pexels-photo-7775641.jpeg"
            clipClass="absolute md:scale-125"
          />
          <ImageClipBox
            src="https://images.pexels.com/photos/7775638/pexels-photo-7775638.jpeg"
            clipClass="sword-man-clip-path md:scale-125"
          />
        </div>

        <div className="flex flex-col items-center text-center">
          <p className="font-general text-[10px] uppercase text-rose-500 font-bold tracking-widest">
            Join the Arena
          </p>

          <AnimatedTitle
            title="let's build the <br /> new era of <br /> competitive gaming"
            containerClass="custom-heading mt-10 w-full font-zentry text-5xl font-black leading-[0.9] md:text-[6rem]"
          />

          <button className="mt-10 cursor-pointer rounded-full bg-rose-600 px-10 py-4 font-bold text-white transition-all hover:scale-110 hover:bg-rose-700">
             REGISTER NOW
          </button>
        </div>
      </div>
    </div>
  );
}
