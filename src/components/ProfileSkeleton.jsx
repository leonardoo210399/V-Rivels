"use client";

import { User, Activity, Trophy } from "lucide-react";

export default function ProfileSkeleton() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="relative bg-slate-900/50 border border-white/10 rounded-2xl p-8 mb-8 overflow-hidden">
        <div className="relative flex flex-col md:flex-row items-center gap-8 z-10">
          <div className="relative">
            <div className="w-32 h-32 rounded-2xl bg-slate-800 border-4 border-slate-900 shadow-xl overflow-hidden animate-pulse" />
            <div className="absolute -bottom-3 -right-3 w-16 h-6 bg-slate-900 border border-white/10 rounded-full animate-pulse" />
          </div>
          
          <div className="text-center md:text-left flex-1 space-y-4">
            <div className="h-10 w-64 bg-slate-800 rounded-lg animate-pulse mx-auto md:mx-0" />
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="h-8 w-32 bg-slate-800 rounded-full animate-pulse" />
              <div className="h-8 w-32 bg-slate-800 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Stats Column Skeleton */}
        <div className="col-span-2 space-y-6">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <div className="h-6 w-40 bg-slate-800 rounded animate-pulse" />
              <div className="h-8 w-60 bg-slate-950 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-slate-950 rounded-lg border border-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Side Column Skeleton */}
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="h-4 w-32 bg-slate-800 rounded mb-8 animate-pulse" />
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-slate-800 mb-6 animate-pulse" />
              <div className="h-8 w-48 bg-slate-800 rounded mb-4 animate-pulse" />
              <div className="h-4 w-32 bg-slate-800 rounded mb-8 animate-pulse" />
              <div className="w-full space-y-3 px-4">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-10 bg-slate-800 rounded animate-pulse" />
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
