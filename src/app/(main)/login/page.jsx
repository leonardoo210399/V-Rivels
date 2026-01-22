"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaDiscord } from "react-icons/fa";

export default function LoginPage() {
  const { user, loginWithGoogle, loginWithDiscord } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/profile");
    }
  }, [user, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-rose-500/10 blur-[120px]" />
        <div className="absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-600/5 blur-[150px]" />

        {/* Subtle noise overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Container */}
        <div className="mb-10 flex flex-col items-center">
          <div className="group relative mb-6">
            <div className="absolute inset-0 animate-pulse rounded-full bg-rose-500/10 blur-2xl group-hover:bg-rose-500/20" />
            <img
              src="/vrivals_logo_vertical.png"
              alt="VRivals Arena Logo"
              className="relative h-32 w-auto object-contain drop-shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <h1 className="special-font text-center text-4xl leading-none font-black tracking-tight text-white uppercase md:text-5xl">
            Welcome Back
          </h1>
          <p className="mt-4 text-[10px] font-black tracking-[0.3em] text-rose-500 uppercase">
            Secure Access Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/40 p-10 shadow-2xl backdrop-blur-3xl">
          {/* Subtle light sweep animation */}
          <div className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />

          <div className="relative z-10 mb-10 text-center">
            <h2 className="mb-2 text-xl font-bold text-white">
              Join the Arena
            </h2>
            <p className="px-4 text-sm leading-relaxed text-slate-400">
              Sign in to sync your stats, join tournaments, and rise through the
              ranks.
            </p>
          </div>

          <div className="relative z-10 space-y-3">
            <button
              onClick={loginWithGoogle}
              className="group flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-black px-6 py-4 text-sm font-bold text-white shadow-2xl transition-all hover:border-white/20 hover:bg-zinc-900 hover:shadow-white/5 active:scale-[0.98]"
            >
              <div className="flex items-center justify-center bg-transparent">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  className="shrink-0"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.25.81-.59z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <span className="tracking-tight">Sign in with Google</span>
            </button>

            <button
              onClick={loginWithDiscord}
              className="group flex w-full items-center justify-center gap-3 rounded-full border border-indigo-500/30 bg-[#5865F2] px-6 py-4 text-sm font-bold text-white shadow-2xl shadow-indigo-600/20 transition-all hover:bg-[#4752C4] active:scale-[0.98]"
            >
              <FaDiscord className="h-5 w-5" />
              <span className="tracking-tight">Sign in with Discord</span>
            </button>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/10 bg-rose-500/5 px-3 py-1">
              <div className="h-1 w-1 animate-pulse rounded-full bg-rose-500" />
              <span className="text-[8px] font-black tracking-[0.2em] text-rose-500/80 uppercase">
                Automated Competitive Ecosystem
              </span>
            </div>
          </div>
        </div>

        <p className="mt-10 px-10 text-center text-xs leading-relaxed text-slate-500">
          By continuing, you agree to VRivals Arena's{" "}
          <a
            href="/terms"
            className="border-b border-slate-800 font-medium text-slate-300 transition-colors hover:text-rose-400"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="border-b border-slate-800 font-medium text-slate-300 transition-colors hover:text-rose-400"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
