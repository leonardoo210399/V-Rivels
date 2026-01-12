import { Inter, Poppins, Anton } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";
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
  title: "VRivals Tournament",
  description: "Compete in Valorant tournaments and track your stats.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.variable} ${poppins.variable} ${anton.variable} bg-slate-950 font-sans text-slate-200 antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}
