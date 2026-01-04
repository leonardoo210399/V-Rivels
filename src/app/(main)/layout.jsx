"use client";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";

export default function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <PageWrapper>{children}</PageWrapper>
    </>
  );
}
