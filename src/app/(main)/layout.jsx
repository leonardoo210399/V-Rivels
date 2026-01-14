"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";
import Footer from "@/components/Footer";
import AssetPreloader from "@/components/AssetPreloader";

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  // Landing page has its own navbar/footer, so we skip the regular ones
  if (isLandingPage) {
    return (
      <>
        <AssetPreloader />
        {children}
      </>
    );
  }

  return (
    <>
      <AssetPreloader />
      <Navbar />
      <PageWrapper>{children}</PageWrapper>
      <Footer />
    </>
  );
}
