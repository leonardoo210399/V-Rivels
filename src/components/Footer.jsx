import Link from "next/link";
import { FaDiscord, FaTwitter, FaInstagram, FaTwitch } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-900 pt-16 pb-8 text-slate-300">
      <div className="container mx-auto px-4">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="flex flex-col gap-6 lg:col-span-2 lg:flex-row lg:items-center">
            <Link href="/" className="inline-block flex-shrink-0">
              <img
                src="/vrivals_logo_vertical.png"
                alt="VRivals Arena"
                className="h-32 w-auto object-contain"
              />
            </Link>
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
                  href="/player-finder"
                  className="transition-colors hover:text-rose-400"
                >
                  Player Finder
                </Link>
              </li>
              <li>
                <Link
                  href="/#about"
                  className="transition-colors hover:text-rose-400"
                >
                  About
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
                  href="/faq"
                  className="transition-colors hover:text-rose-400"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="transition-colors hover:text-rose-400"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-policy"
                  className="transition-colors hover:text-rose-400"
                >
                  Shipping Policy
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
        <div className="flex flex-col items-center justify-between border-t border-slate-800 pt-8 text-xs text-slate-400 md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} VRivals Arena. All rights
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
