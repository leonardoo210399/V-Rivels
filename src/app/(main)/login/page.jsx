"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const { user, loginWithDiscord, loginWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/profile");
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center backdrop-blur-md">
        <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-rose-500/10 p-4">
                <Shield className="h-10 w-10 text-rose-500" />
            </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">Welcome Back</h1>
        <p className="mb-8 text-slate-400">Sign in to access your profile and stats.</p>
        
        <div className="space-y-4">
          <button
            onClick={loginWithDiscord}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-4 py-3 font-semibold text-white transition-all hover:bg-[#4752C4]"
          >
            Sign in with Discord
          </button>
          
           <button
            onClick={loginWithGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 font-semibold text-slate-900 transition-all hover:bg-gray-100"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
