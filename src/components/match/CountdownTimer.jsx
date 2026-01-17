"use client";
import { useEffect, useState } from "react";
import { Clock, AlertCircle, CheckCircle, Zap } from "lucide-react";

/**
 * CountdownTimer Component
 * Displays a live countdown to match start time with visual notifications
 *
 * @param {Object} props
 * @param {string} props.startTime - ISO timestamp of match start time
 * @param {string} props.status - Match status (scheduled, ongoing, completed)
 */
export default function CountdownTimer({ startTime, status }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!startTime || status === "completed") {
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(startTime).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, total: difference });

      // Set notifications based on time remaining
      if (difference <= 60000 && difference > 59000) {
        // 1 minute warning
        setNotification("60");
      } else if (difference <= 300000 && difference > 299000) {
        // 5 minute warning
        setNotification("300");
      } else if (difference <= 600000 && difference > 599000) {
        // 10 minute warning
        setNotification("600");
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [startTime, status]);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!startTime || status === "completed") {
    return null;
  }

  const isStarted = timeLeft.total <= 0;
  const isStartingSoon = timeLeft.total > 0 && timeLeft.total <= 300000; // 5 minutes
  const isUrgent = timeLeft.total > 0 && timeLeft.total <= 60000; // 1 minute

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3 backdrop-blur-xl md:rounded-3xl md:p-4">
      {isStarted ? (
        // Match Started State - Compact
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20">
            <Zap className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-white uppercase italic">
              Match Live!
            </p>
            <p className="text-[10px] text-slate-500">Good luck!</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* Header + Countdown Row */}
          <div className="flex flex-1 items-center gap-3">
            {/* Icon */}
            <div
              className={`shrink-0 rounded-lg border p-2 transition-all ${
                isUrgent
                  ? "animate-pulse border-rose-500/30 bg-rose-500/20 text-rose-500"
                  : isStartingSoon
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                    : "border-cyan-500/20 bg-cyan-500/10 text-cyan-500"
              }`}
            >
              <Clock className="h-4 w-4" />
            </div>

            {/* Title */}
            <div className="min-w-0">
              <h3 className="text-sm font-black tracking-tight text-white uppercase md:text-base">
                {isUrgent
                  ? "Final Call!"
                  : isStartingSoon
                    ? "Starting Soon"
                    : "Match Countdown"}
              </h3>
              <p className="truncate text-[9px] font-medium text-slate-500">
                {new Date(startTime).toLocaleString([], {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>

          {/* Compact Countdown Display */}
          <div className="flex items-center justify-center gap-1 md:gap-2">
            {/* Days */}
            <div
              className={`rounded-lg border border-white/5 bg-slate-950/50 px-2 py-1.5 text-center md:px-3 md:py-2 ${timeLeft.days === 0 ? "opacity-50" : ""}`}
            >
              <p
                className={`text-lg font-black italic tabular-nums md:text-xl ${
                  timeLeft.days > 0 ? "text-cyan-400" : "text-slate-600"
                }`}
              >
                {String(timeLeft.days).padStart(2, "0")}
              </p>
              <p className="text-[7px] font-bold tracking-wider text-slate-600 uppercase">
                D
              </p>
            </div>

            <span className="font-black text-slate-600">:</span>

            {/* Hours */}
            <div className="rounded-lg border border-white/5 bg-slate-950/50 px-2 py-1.5 text-center md:px-3 md:py-2">
              <p
                className={`text-lg font-black italic tabular-nums md:text-xl ${
                  isStartingSoon
                    ? "text-amber-400"
                    : timeLeft.hours > 0 || timeLeft.days > 0
                      ? "text-white"
                      : "text-slate-600"
                }`}
              >
                {String(timeLeft.hours).padStart(2, "0")}
              </p>
              <p className="text-[7px] font-bold tracking-wider text-slate-600 uppercase">
                H
              </p>
            </div>

            <span className="font-black text-slate-600">:</span>

            {/* Minutes */}
            <div className="rounded-lg border border-white/5 bg-slate-950/50 px-2 py-1.5 text-center md:px-3 md:py-2">
              <p
                className={`text-lg font-black italic tabular-nums md:text-xl ${
                  isUrgent
                    ? "animate-pulse text-rose-500"
                    : isStartingSoon
                      ? "text-amber-400"
                      : "text-white"
                }`}
              >
                {String(timeLeft.minutes).padStart(2, "0")}
              </p>
              <p className="text-[7px] font-bold tracking-wider text-slate-600 uppercase">
                M
              </p>
            </div>

            <span className="font-black text-slate-600">:</span>

            {/* Seconds */}
            <div className="rounded-lg border border-white/5 bg-slate-950/50 px-2 py-1.5 text-center md:px-3 md:py-2">
              <p
                className={`text-lg font-black italic tabular-nums md:text-xl ${
                  isUrgent
                    ? "animate-pulse text-rose-500"
                    : isStartingSoon
                      ? "text-amber-400"
                      : "text-emerald-400"
                }`}
              >
                {String(timeLeft.seconds).padStart(2, "0")}
              </p>
              <p className="text-[7px] font-bold tracking-wider text-slate-600 uppercase">
                S
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="animate-in slide-in-from-top-4 fixed top-24 left-1/2 z-50 -translate-x-1/2 duration-500 md:top-28">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/20 px-4 py-3 shadow-2xl backdrop-blur-xl md:px-6 md:py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 animate-pulse text-amber-400 md:h-6 md:w-6" />
              <p className="text-sm font-black tracking-tight text-white uppercase md:text-base">
                {notification === "60"
                  ? "1 Minute Remaining!"
                  : notification === "300"
                    ? "5 Minutes Until Start"
                    : "10 Minutes Warning"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
