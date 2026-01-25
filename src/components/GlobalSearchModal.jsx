"use client";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useState, useRef, useEffect } from "react";
import { Search, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users";

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.includes("#")) {
      setError("Please include the tag (e.g. Name#TAG)");
      return;
    }

    const [name, tag] = query.split("#");
    if (!name || !tag) {
      setError("Invalid format. Use Name#TAG");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if user exists in our database
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal("ingameName", name), Query.equal("tag", tag)],
      );

      onClose();

      if (response.total > 0) {
        // User found! Redirect to internal profile
        const userId = response.documents[0].$id;
        router.push(`/player/${userId}`);
      } else {
        // Not registered, go to global profile
        router.push(
          `/globalplayer/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
        );
      }
    } catch (err) {
      console.error("Search error:", err);
      // Fallback to global profile if DB check fails
      onClose();
      router.push(
        `/globalplayer/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-24 sm:pt-32">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl ring-1 ring-white/10 transition-all">
        {/* Search Header */}
        <div className="relative border-b border-white/5 bg-slate-900/50 p-4">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (error) setError("");
              }}
              placeholder="Search via Riot ID (e.g. TenZ#0000)..."
              className="h-12 w-full rounded-xl border border-white/5 bg-slate-950 px-12 text-white placeholder-slate-500 transition-all outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
            {loading ? (
              <div className="absolute right-3 p-1.5">
                <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
              </div>
            ) : (
              <button
                type="submit"
                className="absolute right-3 rounded-lg bg-white/5 p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>

        {/* Message Area */}
        <div className="bg-slate-900 p-4">
          {error ? (
            <div className="flex items-center gap-3 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="font-bold">{error}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 text-xs text-slate-500">
              <div className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-sans font-bold text-slate-400">
                BTW
              </div>
              <p className="font-medium">
                Enter full Riot ID including tag (e.g. Demon1#1234)
              </p>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="bg-slate-950 p-3 text-center">
          <p className="text-[10px] font-medium text-slate-600">
            Press{" "}
            <kbd className="rounded border border-slate-700 bg-slate-800 px-1 font-sans text-slate-400">
              ESC
            </kbd>{" "}
            to close
          </p>
        </div>
      </div>
    </div>
  );
}
