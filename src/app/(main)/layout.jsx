"use client";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";

import Footer from "@/components/Footer";

export default function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <PageWrapper>{children}</PageWrapper>
      <Footer />
    </>
  );
}
