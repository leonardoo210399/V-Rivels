import { Inter, Poppins, Anton } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import "./app.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const poppins = Poppins({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://www.vrivalsarena.com"),
  title: {
    default: "VRivals Arena | Premier Valorant Tournaments",
    template: "%s | VRivals Arena",
  },
  description:
    "Play in daily Valorant Scrims and Tournaments in India. Join free entry & prize pool tournaments, find teammates, track stats, and earn money playing Valorant on VRivals Arena.",
  keywords: [
    "Valorant",
    "Valorant Tournaments",
    "Valorant India",
    "Esports",
    "Esports India",
    "VRivals Arena",
    "V Rivals",
    "VRivals",
    "Scrims",
    "Daily Scrims",
    "Valorant Scrims",
    "Valorant Scrims India",
    "Gaming",
    "Competitive Gaming",
    "Leaderboard",
    "Valorant Stats",
    "Free Entry Valorant Tournament",
    "Free Valorant Tournaments",
    "Paid Valorant Tournaments",
    "Prize Pool Tournaments",
    "Valo Tournaments",
    "Valo Tournaments India",
    "Valo Taounaments", // Common user misspelling
    "Valo Matchs", // Common user misspelling
    "1v1 Valorant",
    "5v5 Valorant Tournament",
    "TDM Tournament Valorant",
    "Valorant Custom Match",
    "Online Esports Platform",
    "Find Valorant Team",
    "Valorant Team Finder",
    "Valorant Community India",
    "Best Valorant Tournament Site",
    "Play Valorant for Money",
    "Earn Money Playing Valorant",
  ],
  authors: [{ name: "VRivals Arena Team" }],
  creator: "VRivals Arena",
  publisher: "VRivals Arena",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "VRivals Arena | Premier Valorant Tournaments",
    description:
      "Join VRivals Arena for the ultimate Valorant tournament experience. Compete, win prizes, and build your legacy.",
    url: "https://www.vrivalsarena.com",
    siteName: "VRivals Arena",
    images: [
      {
        url: "/og-image.png", // We should ensure this exists or use a default
        width: 1200,
        height: 630,
        alt: "VRivals Arena",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VRivals Arena",
    description: "Compete in Valorant tournaments and track your stats.",
    creator: "@vrivalsarena", // Assuming handle, can be updated later
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "tG9j_ts9n13sPRmrPLQoG23SblLA5ctlkhIiFcSqP1k",
  },
  alternates: {
    canonical: "./",
  },
};

import JsonLd from "@/components/JsonLd";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} ${anton.variable} bg-slate-950 font-sans text-slate-200 antialiased`}
        suppressHydrationWarning
      >
        <JsonLd />
        <AuthProvider>{children}</AuthProvider>
        <SpeedInsights />
        <Analytics />
        <Toaster richColors position="top-right" theme="dark" />
      </body>
    </html>
  );
}
