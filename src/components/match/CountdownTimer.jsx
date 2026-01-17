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
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl md:rounded-3xl md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3 md:mb-6">
        <div
          className={`rounded-xl border p-2.5 transition-all md:p-3 ${
            isUrgent
              ? "animate-pulse border-rose-500/30 bg-rose-500/20 text-rose-500"
              : isStartingSoon
                ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                : "border-cyan-500/20 bg-cyan-500/10 text-cyan-500"
          }`}
        >
          <Clock className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <div>
          <h3 className="text-base font-black tracking-tight text-white uppercase md:text-lg">
            {isStarted ? "Match Started" : "Match Countdown"}
          </h3>
          <p className="text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase md:text-[10px]">
            {isStarted
              ? "Battle in progress"
              : isStartingSoon
                ? "Get ready - starting soon!"
                : "Time until match begins"}
          </p>
        </div>
      </div>

      {isStarted ? (
        // Match Started State
        <div className="flex flex-col items-center justify-center py-8 md:py-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 md:h-20 md:w-20">
            <Zap className="h-8 w-8 text-emerald-500 md:h-10 md:w-10" />
          </div>
          <p className="mb-2 text-2xl font-black tracking-tight text-white uppercase italic md:text-3xl">
            Match Live!
          </p>
          <p className="text-xs text-slate-500 md:text-sm">
            Good luck and have fun!
          </p>
        </div>
      ) : (
        <>
          {/* Countdown Display */}
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            {/* Days */}
            <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/50 p-3 text-center transition-all hover:border-cyan-500/20 md:rounded-2xl md:p-4">
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <p
                className={`relative mb-1 text-2xl font-black italic tabular-nums md:text-4xl lg:text-5xl ${
                  timeLeft.days > 0 ? "text-cyan-400" : "text-slate-700"
                }`}
              >
                {String(timeLeft.days).padStart(2, "0")}
              </p>
              <p className="relative text-[8px] font-black tracking-[0.2em] text-slate-600 uppercase md:text-[9px]">
                Days
              </p>
            </div>

            {/* Hours */}
            <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/50 p-3 text-center transition-all hover:border-amber-500/20 md:rounded-2xl md:p-4">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <p
                className={`relative mb-1 text-2xl font-black italic tabular-nums md:text-4xl lg:text-5xl ${
                  isStartingSoon
                    ? "text-amber-400"
                    : timeLeft.hours > 0 || timeLeft.days > 0
                      ? "text-white"
                      : "text-slate-700"
                }`}
              >
                {String(timeLeft.hours).padStart(2, "0")}
              </p>
              <p className="relative text-[8px] font-black tracking-[0.2em] text-slate-600 uppercase md:text-[9px]">
                Hours
              </p>
            </div>

            {/* Minutes */}
            <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/50 p-3 text-center transition-all hover:border-rose-500/20 md:rounded-2xl md:p-4">
              <div className="absolute inset-0 bg-gradient-to-t from-rose-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <p
                className={`relative mb-1 text-2xl font-black italic tabular-nums md:text-4xl lg:text-5xl ${
                  isUrgent
                    ? "animate-pulse text-rose-500"
                    : isStartingSoon
                      ? "text-amber-400"
                      : "text-white"
                }`}
              >
                {String(timeLeft.minutes).padStart(2, "0")}
              </p>
              <p className="relative text-[8px] font-black tracking-[0.2em] text-slate-600 uppercase md:text-[9px]">
                Minutes
              </p>
            </div>

            {/* Seconds */}
            <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/50 p-3 text-center transition-all hover:border-emerald-500/20 md:rounded-2xl md:p-4">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <p
                className={`relative mb-1 text-2xl font-black italic tabular-nums transition-all md:text-4xl lg:text-5xl ${
                  isUrgent
                    ? "animate-pulse text-rose-500"
                    : isStartingSoon
                      ? "text-amber-400"
                      : "text-emerald-400"
                }`}
              >
                {String(timeLeft.seconds).padStart(2, "0")}
              </p>
              <p className="relative text-[8px] font-black tracking-[0.2em] text-slate-600 uppercase md:text-[9px]">
                Seconds
              </p>
            </div>
          </div>

          {/* Status Alert */}
          <div className="mt-4 md:mt-6">
            {isUrgent ? (
              <div className="animate-in fade-in flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 duration-500 md:gap-3 md:p-4">
                <AlertCircle className="h-5 w-5 shrink-0 animate-pulse text-rose-500 md:h-6 md:w-6" />
                <div className="flex-1">
                  <p className="mb-0.5 text-[10px] font-black tracking-widest text-rose-500 uppercase md:text-xs">
                    Final Call - Less than 1 minute!
                  </p>
                  <p className="text-[9px] text-rose-400/80 md:text-[10px]">
                    Ensure you&apos;re in the lobby and ready to play
                  </p>
                </div>
              </div>
            ) : isStartingSoon ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 md:gap-3 md:p-4">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 md:h-6 md:w-6" />
                <div className="flex-1">
                  <p className="mb-0.5 text-[10px] font-black tracking-widest text-amber-500 uppercase md:text-xs">
                    Starting Soon
                  </p>
                  <p className="text-[9px] text-amber-400/80 md:text-[10px]">
                    Be prepared to join the match lobby
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 md:gap-3 md:p-4">
                <CheckCircle className="h-5 w-5 shrink-0 text-cyan-500 md:h-6 md:w-6" />
                <div className="flex-1">
                  <p className="mb-0.5 text-[10px] font-black tracking-widest text-cyan-500 uppercase md:text-xs">
                    Scheduled
                  </p>
                  <p className="text-[9px] text-cyan-400/80 md:text-[10px]">
                    Match will begin at{" "}
                    <span className="font-bold" suppressHydrationWarning>
                      {new Date(startTime).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
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
