"use client";
import { usePathname } from "next/navigation";

export default function PageWrapper({ children }) {
  const pathname = usePathname();
  const isTransparentNavbarPage = pathname === "/" || pathname === "/login";
  
  return (
    <main className={isTransparentNavbarPage ? "" : "pt-16"}>
      {children}
    </main>
  );
}
