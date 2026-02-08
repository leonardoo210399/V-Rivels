"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Smartphone,
  CheckCircle,
  QrCode,
  IndianRupee,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Lock,
  HelpCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";

/**
 * UPI Payment Modal - ekQR API Integration
 * 
 * This modal:
 * 1. Calls the server action to create a payment order
 * 2. Displays the payment URL/QR for user to pay
 * 3. Shows deep links for UPI apps (Enterprise plan)
 * 4. User is redirected back after payment confirmation
 */
export default function UPIPaymentModalEkqr({
  isOpen,
  onClose,
  tournamentId,
  tournamentName,
  entryFee,
  userId,
  userEmail,
  userName,
  teamName = "",
  metadata = {},
  onPaymentStarted,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentData(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInitiatePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Import server action dynamically to avoid SSR issues
      const { createPaymentOrderAction } = await import("@/app/actions/payment");

      const result = await createPaymentOrderAction({
        tournamentId,
        tournamentName,
        userId,
        amount: entryFee,
        customerName: userName || "Player",
        customerEmail: userEmail || "player@vrivalsarena.com",
        customerMobile: "9999999999", // Default since we don't collect phone
        teamName,
        metadata,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create payment");
      }

      setPaymentData(result);
      
      if (onPaymentStarted) {
        onPaymentStarted(result.clientTxnId);
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      setError(err.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentUrl = () => {
    if (paymentData?.paymentUrl) {
      window.open(paymentData.paymentUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="animate-in fade-in zoom-in-95 relative w-full max-w-lg duration-300">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
          {/* Glow Effects */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />

          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/20">
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-white">
                  Payment
                </h2>
                <p className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">
                  {tournamentName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Amount Display */}
            <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
              <p className="mb-1 text-[10px] font-black tracking-widest text-rose-500/60 uppercase">
                Entry Fee
              </p>
              <p className="text-4xl font-black tracking-tight text-white">
                ₹{entryFee}
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <p className="text-xs text-rose-500">{error}</p>
              </div>
            )}

            {/* State: Not Started */}
            {!paymentData && !loading && (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/5 bg-slate-950/50 p-4">
                  <p className="mb-3 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Secure UPI Payment
                  </p>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      Instant payment confirmation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      Supports all UPI apps (GPay, PhonePe, Paytm)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      Auto-registration on payment success
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleInitiatePayment}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40"
                >
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-sm font-black tracking-wide uppercase">
                    Proceed to Pay ₹{entryFee}
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            )}

            {/* State: Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                <p className="mt-4 text-sm font-bold text-slate-400">
                  Creating payment order...
                </p>
              </div>
            )}

            {/* State: Payment Ready */}
            {paymentData && (
              <div className="space-y-4">
                {/* QR Code / Payment Link */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                  <p className="mb-3 text-[10px] font-black tracking-widest text-emerald-500 uppercase">
                    Payment Ready
                  </p>
                  
                  {/* Primary CTA - Open Payment Page */}
                  <button
                    onClick={handleOpenPaymentUrl}
                    className="group mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40"
                  >
                    <QrCode className="h-5 w-5" />
                    <span className="text-sm font-black tracking-wide uppercase">
                      Open Payment Page
                    </span>
                    <ExternalLink className="h-4 w-4" />
                  </button>

                  {/* UPI App Deep Links (Enterprise) */}
                  {(paymentData.intentLinks?.gpayLink || paymentData.intentLinks?.phonepeLink) && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                        Or pay directly with
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentData.intentLinks?.gpayLink && (
                          <a
                            href={paymentData.intentLinks.gpayLink}
                            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-700"
                          >
                            GPay
                          </a>
                        )}
                        {paymentData.intentLinks?.phonepeLink && (
                          <a
                            href={paymentData.intentLinks.phonepeLink}
                            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-700"
                          >
                            PhonePe
                          </a>
                        )}
                        {paymentData.intentLinks?.paytmLink && (
                          <a
                            href={paymentData.intentLinks.paytmLink}
                            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-700"
                          >
                            Paytm
                          </a>
                        )}
                        {paymentData.intentLinks?.bhimLink && (
                          <a
                            href={paymentData.intentLinks.bhimLink}
                            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-700"
                          >
                            BHIM
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div className="text-[10px] text-amber-500/80">
                      <p className="mb-1 font-bold uppercase">After payment</p>
                      <p>
                        You'll be redirected back. Your registration will be
                        confirmed automatically within a minute.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Refresh/Check Status Button */}
                <button
                  onClick={() => window.location.reload()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-xs font-bold text-slate-400 transition-all hover:bg-slate-700 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  Completed payment? Click to refresh
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/5 bg-slate-950/50 px-6 py-4">
            <Link
              href="/support"
              target="_blank"
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase transition-colors hover:text-white"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Need Help?
            </Link>
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3 text-emerald-500" />
              <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                Secured by ekQR
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
