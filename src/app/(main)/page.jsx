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
      
      <footer className="w-screen bg-[#5542ff] py-10 text-center text-white font-general">
         <p>&copy; 2024 Valorant Tournament. Not affiliated with Riot Games.</p>
      </footer>
    </main>
  );
}
