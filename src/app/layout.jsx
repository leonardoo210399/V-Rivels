import { Inter, Poppins, Anton } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import "./app.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-poppins",
});
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

export const metadata = {
  metadataBase: new URL("https://www.vrivalsarena.com"),
  title: {
    default: "VRivals Arena | Premier Valorant Tournaments",
    template: "%s | VRivals Arena",
  },
  description:
    "Join VRivals Arena for the ultimate Valorant tournament experience. Compete in daily scrims, track your stats, find teams, and climb the leaderboards.",
  keywords: [
    "Valorant",
    "Tournaments",
    "Esports",
    "India",
    "VRivals Arena",
    "V Rivals",
    "Scrims",
    "Gaming",
    "Competitive",
    "Leaderboard",
    "Stats",
    "Valorant Tournaments",
    "Valo Tournaments",
    "Valo Taounaments", // Common user misspelling
    "Valo Matchs", // Common user misspelling
    "Valorant Scrims",
    "Free Entry Valorant Tournament",
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
      </body>
    </html>
  );
}
