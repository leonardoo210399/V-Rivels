"use client";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";

import Footer from "@/components/Footer";
import AssetPreloader from "@/components/AssetPreloader";

export default function MainLayout({ children }) {
  return (
    <>
      <AssetPreloader />
      <Navbar />
      <PageWrapper>{children}</PageWrapper>
      <Footer />
    </>
  );
}
