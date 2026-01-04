"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Crosshair, Trophy, User, LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, loading, isAdmin } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show navbar on login page
  if (pathname === "/login") return null;

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Tournaments", href: "/tournaments" },
    { name: "Team Finder", href: "/team-finder" },
    { name: "Leaderboard", href: "/leaderboard" },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-rose-500">
            <Crosshair className="h-6 w-6" />
            <span className="tracking-tighter">VALOLANT</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-rose-500 ${
                  pathname === link.href ? "text-rose-500" : "text-slate-300"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    {isAdmin && (
                         <Link
                          href="/admin"
                          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all`}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Admin
                        </Link>
                    )}
                    <Link
                      href="/profile"
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        pathname === "/profile"
                          ? "bg-rose-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <button
                      onClick={logout}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full bg-rose-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden text-slate-300" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block text-base font-medium transition-colors hover:text-rose-500 ${
                  pathname === link.href ? "text-rose-500" : "text-slate-300"
                }`}
              >
                {link.name}
              </Link>
            ))}
            {!loading && (
              <div className="pt-4 border-t border-white/10">
                {user ? (
                  <div className="space-y-4">
                    {isAdmin && (
                         <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2 text-rose-500 hover:text-rose-400 font-bold"
                        >
                          <ShieldCheck className="h-5 w-5" />
                          Admin Dashboard
                        </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 text-slate-300 hover:text-rose-500"
                    >
                      <User className="h-5 w-5" />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2 text-slate-300 hover:text-rose-500 w-full text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center rounded-lg bg-rose-600 py-3 text-white font-semibold"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
