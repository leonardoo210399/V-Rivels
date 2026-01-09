"use client";
import Hero from "@/components/Hero";
import About from "@/components/About";
import BentoGrid from "@/components/BentoGrid";
import Contact from "@/components/Contact";

export default function Home() {

  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden bg-slate-950">
      <Hero />
      <About />
      <BentoGrid />
      <Contact />
      

    </main>
  );
}
