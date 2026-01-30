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
import GlobalSearchModal from "./GlobalSearchModal";
import { Search } from "lucide-react";

export default function Navbar() {
  const { user, logout, loading, isAdmin } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
          <div className="flex flex-1 shrink-0 justify-start">
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
                  className={`relative flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 lg:px-3 xl:px-5 ${
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
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 lg:px-3 xl:px-5 ${
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
            {/* Search Bar - Moved to right side */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="group mr-2 flex w-64 items-center justify-between rounded-full border border-white/5 bg-white/5 px-4 py-2 text-sm text-slate-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white lg:w-48 xl:w-64"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="font-medium">Search players...</span>
              </div>
              <div className="flex items-center gap-1 rounded bg-slate-950/50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 shadow-sm group-hover:text-slate-400">
                <span className="text-xs">⌘</span>K
              </div>
            </button>

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileDropdownRef}>
                      <button
                        onClick={() =>
                          setIsProfileDropdownOpen(!isProfileDropdownOpen)
                        }
                        className="group relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/10 transition-all hover:border-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                      >
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-sm font-black text-white">
                          {user.name ? (
                            user.name.charAt(0).toUpperCase()
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                      </button>

                      {/* Dropdown Menu */}
                      {isProfileDropdownOpen && (
                        <div className="animate-in fade-in zoom-in absolute top-full right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl">
                          {/* User Header */}
                          <div className="mb-2 border-b border-white/5 px-4 py-3">
                            <p className="truncate text-sm font-bold text-white">
                              {user.name || "Player"}
                            </p>
                            <p className="truncate text-xs font-medium text-slate-500">
                              {user.email || "Agent"}
                            </p>
                          </div>

                          {/* Admin Link */}
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-500/10"
                            >
                              <ShieldCheck className="h-4 w-4" />
                              Admin Panel
                            </Link>
                          )}

                          <Link
                            href="/profile"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                          >
                            <User className="h-4 w-4" />
                            View Profile
                          </Link>

                          <button
                            onClick={() => {
                              logout();
                              setIsProfileDropdownOpen(false);
                            }}
                            className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-500/10"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>
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

          {/* Mobile Actions - Search & Menu */}
          <div className="flex flex-1 items-center justify-end gap-3 lg:hidden">
            {/* Mobile Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 transition-colors hover:bg-white/10 active:scale-95"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Mobile Menu Toggle */}
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
          <div className="scrollbar-hide absolute top-20 right-2 left-2 max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-2xl transition-all duration-300 lg:hidden">
            <nav className="flex flex-col gap-1 pb-4">
              {[...navLinks, ...moreLinks].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3 text-base font-bold transition-all ${
                    pathname === link.href
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}

              {/* Mobile Search Item */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsSearchOpen(true);
                }}
                className="flex items-center gap-4 rounded-xl px-4 py-3 text-base font-bold text-slate-400 transition-all hover:bg-white/5 hover:text-white"
              >
                <Search className="h-4 w-4" />
                Player Search
              </button>

              {!loading && (
                <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-2">
                  {user ? (
                    <>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-4 rounded-xl px-4 py-3 text-base font-bold text-amber-500 hover:bg-amber-500/10"
                        >
                          <ShieldCheck className="h-5 w-5" />
                          Admin Panel
                        </Link>
                      )}

                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 rounded-xl px-4 py-3 text-base font-bold text-slate-300 hover:bg-white/5"
                      >
                        <User className="h-5 w-5" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-4 rounded-xl px-4 py-3 text-base font-bold text-rose-500 hover:bg-rose-500/10"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="mt-2 rounded-xl bg-rose-600 py-3 text-center text-base font-bold text-white shadow-lg shadow-rose-500/20"
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
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
}
