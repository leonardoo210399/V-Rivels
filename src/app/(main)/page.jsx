"use client";
import { Hero, About, Features, Story, Contact } from "@/components/landing";
import "../landing.css";
import NavBar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="landing-body relative min-h-screen w-full overflow-x-hidden">
      <NavBar />
      <Hero />
      <About />
      <Features />
      <Story />
      <Contact />
      <Footer />
    </main>
  );
}
