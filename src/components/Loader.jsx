"use client";
import { Loader2 } from "lucide-react";

export default function Loader({
  fullScreen = true,
  size = "md",
  className = "",
}) {
  const sizeClasses = {
    sm: "h-6 w-6 border",
    md: "h-16 w-16 border-t-2 border-b-2",
    lg: "h-24 w-24 border-t-4 border-b-4",
  };

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  const content = (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} animate-spin rounded-full border-rose-500`}
      ></div>
      <Loader2
        className={`absolute top-1/2 left-1/2 ${iconSizeClasses[size] || iconSizeClasses.md} -translate-x-1/2 -translate-y-1/2 animate-spin text-rose-500`}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        {content}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${size === "sm" ? "p-0" : "p-4"}`}
    >
      {content}
    </div>
  );
}
