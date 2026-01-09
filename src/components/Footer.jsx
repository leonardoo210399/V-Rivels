import Link from "next/link";
import { FaDiscord, FaTwitter, FaInstagram, FaTwitch } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-900 pt-16 pb-8 text-slate-300">
      <div className="container mx-auto px-4">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <h2 className="font-anton text-2xl tracking-wider text-white uppercase">
              VALOLANT <span className="text-rose-500">TOURNAMENT</span>
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              The premier destination for Valorant tournaments. Compete, win,
              and rise through the ranks in our automated competitive ecosystem.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wide text-white uppercase">
              Platform
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/tournaments"
                  className="transition-colors hover:text-rose-400"
                >
                  Tournaments
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="transition-colors hover:text-rose-400"
                >
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link
                  href="/teams"
                  className="transition-colors hover:text-rose-400"
                >
                  Find a Team
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wide text-white uppercase">
              Support
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/rules"
                  className="transition-colors hover:text-rose-400"
                >
                  Rules & Regulations
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="transition-colors hover:text-rose-400"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="transition-colors hover:text-rose-400"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wide text-white uppercase">
              Connect
            </h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="rounded-lg bg-slate-800 p-2 transition-all duration-300 hover:bg-rose-500 hover:text-white"
              >
                <FaDiscord size={20} />
              </a>
              <a
                href="#"
                className="rounded-lg bg-slate-800 p-2 transition-all duration-300 hover:bg-rose-500 hover:text-white"
              >
                <FaTwitter size={20} />
              </a>
              <a
                href="#"
                className="rounded-lg bg-slate-800 p-2 transition-all duration-300 hover:bg-rose-500 hover:text-white"
              >
                <FaInstagram size={20} />
              </a>
              <a
                href="#"
                className="rounded-lg bg-slate-800 p-2 transition-all duration-300 hover:bg-rose-500 hover:text-white"
              >
                <FaTwitch size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between border-t border-slate-800 pt-8 text-xs text-slate-500 md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Valolant Tournament. All rights
            reserved.
          </p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <Link
              href="/privacy"
              className="transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
