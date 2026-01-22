"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";
import Footer from "@/components/Footer";
import AssetPreloader from "@/components/AssetPreloader";
import DiscordWidget from "@/components/DiscordWidget";

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  // Landing page has its own navbar/footer, so we skip the regular ones
  if (isLandingPage) {
    return (
      <>
        <AssetPreloader />
        {children}
        <DiscordWidget variant="floating" />
      </>
    );
  }

  return (
    <>
      <AssetPreloader />
      <Navbar />
      <PageWrapper>{children}</PageWrapper>
      <Footer />
      <DiscordWidget variant="floating" />
    </>
  );
}
