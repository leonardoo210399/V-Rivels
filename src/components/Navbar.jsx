"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Crosshair,
  Trophy,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  LifeBuoy,
  Info,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { user, logout, loading, isAdmin } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't show navbar on login page
  if (pathname === "/login") return null;

  const navLinks = [
    { name: "Home", href: "/", icon: <Crosshair className="h-4 w-4" /> },
    {
      name: "Tournaments",
      href: "/tournaments",
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      name: "Player Finder",
      href: "/player-finder",
      icon: <User className="h-4 w-4" />,
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
  ];

  const moreLinks = [
    { name: "About Us", href: "/about", icon: <Info className="h-4 w-4" /> },
    {
      name: "Support",
      href: "/support",
      icon: <LifeBuoy className="h-4 w-4" />,
    },
  ];

  return (
    <header className="fixed top-0 z-50 w-full">
      {/* Premium Glass Background */}
      <div className="absolute inset-0 border-b border-white/5 bg-slate-950/40 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl" />

      <div className="relative container mx-auto px-4">
        <div className="flex h-20 items-center">
          {/* Logo Section */}
          <div className="flex flex-1 justify-start">
            <Link
              href="/"
              className="group flex items-center transition-transform hover:scale-105 active:scale-95"
            >
              <img
                src="/vrivals_logo_horizontal.png"
                alt="VRivals Arena Logo"
                className="h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              />
            </Link>
          </div>

          {/* Desktop Nav - Centered */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-rose-500/5 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              );
            })}

            {/* Dropdown - More */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                  isMoreOpen || moreLinks.some((link) => pathname === link.href)
                    ? "bg-rose-500/5 text-rose-500"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                }`}
              >
                <span>More</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${isMoreOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isMoreOpen && (
                <div className="animate-in fade-in zoom-in absolute left-1/2 mt-3 w-48 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl duration-200">
                  {moreLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                        pathname === link.href
                          ? "bg-rose-500/10 text-rose-500"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {link.icon}
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* User Actions */}
          <div className="hidden flex-1 items-center justify-end gap-4 lg:flex">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="hidden items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-bold tracking-wider text-rose-500 uppercase transition-all hover:bg-rose-500 hover:text-white md:flex"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Admin
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      className={`group flex items-center gap-3 rounded-full border p-1 pr-4 transition-all duration-300 ${
                        pathname === "/profile"
                          ? "border-rose-500/50 bg-rose-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="line-clamp-1 text-xs font-bold text-slate-100">
                          {user.name || "Player"}
                        </span>
                        <span className="text-[10px] leading-none text-slate-500">
                          View Profile
                        </span>
                      </div>
                    </Link>

                    <button
                      onClick={logout}
                      className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-500"
                      title="Logout"
                    >
                      <LogOut className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="relative overflow-hidden rounded-full bg-rose-600 px-8 py-2.5 text-sm font-bold text-white transition-all hover:bg-rose-700 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95"
                  >
                    SIGN IN
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Toggle - Independent of User Actions */}
          <div className="flex flex-1 justify-end lg:hidden">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 transition-colors hover:bg-white/10"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu content */}
        {isOpen && (
          <div className="absolute top-24 right-4 left-4 rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 lg:hidden">
            <nav className="flex flex-col gap-2">
              {[...navLinks, ...moreLinks].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 rounded-2xl px-6 py-4 text-lg font-bold transition-all ${
                    pathname === link.href
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}

              {!loading && (
                <div className="mt-4 flex flex-col gap-4 border-t border-white/10 pt-4">
                  {user ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 rounded-2xl px-6 py-4 text-slate-300 hover:bg-white/5"
                      >
                        <User className="h-5 w-5" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-4 rounded-2xl px-6 py-4 text-rose-500 hover:bg-rose-500/10"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="rounded-2xl bg-rose-600 py-4 text-center text-lg font-bold text-white shadow-lg shadow-rose-500/20"
                    >
                      SIGN IN
                    </Link>
                  )}
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
