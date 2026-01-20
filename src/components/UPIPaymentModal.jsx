"use client";
import { useState } from "react";
import Link from "next/link";
import {
  X,
  Smartphone,
  CheckCircle,
  Copy,
  QrCode,
  IndianRupee,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Lock,
  HelpCircle,
} from "lucide-react";

// UPI Configuration
const UPI_CONFIG = {
  vpa: "9028410543@okbizaxis",
  payeeName: "V-rivals Arena",
  currency: "INR",
};

export default function UPIPaymentModal({
  isOpen,
  onClose,
  tournamentName,
  entryFee,
  onPaymentComplete,
  isProcessing = false,
  error = null, // New error prop
}) {
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1); // 1: Pay, 2: Enter Transaction ID

  if (!isOpen) return null;

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(UPI_CONFIG.vpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!transactionId.trim()) return;
    onPaymentComplete(transactionId.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="animate-in fade-in zoom-in-95 relative h-[90vh] w-full max-w-md duration-300 md:h-auto md:max-w-4xl">
        <div className="relative flex h-full w-full flex-col overflow-x-hidden overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl md:h-auto md:max-h-[85vh] md:flex-row md:overflow-hidden">
          {/* Glow Effects */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />

          {/* LEFT COLUMN: Summary & QR (Desktop) */}
          <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 relative flex shrink-0 flex-col border-b border-white/10 bg-slate-950/50 md:w-[40%] md:overflow-y-auto md:border-r md:border-b-0">
            {/* Header (Mobile Only) */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4 md:hidden">
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

            {/* Content Container */}
            <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
              {/* Header (Desktop Only) */}
              <div className="mb-4 hidden w-full items-center gap-3 md:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/20">
                  <IndianRupee className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight text-white uppercase">
                    Complete Payment
                  </h2>
                  <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    {tournamentName}
                  </p>
                </div>
              </div>

              {/* Amount Display */}
              <div className="mb-4 w-full rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-center md:mb-5 md:p-4">
                <p className="mb-1 text-[10px] font-black tracking-widest text-rose-500/60 uppercase">
                  Total Amount
                </p>
                <p className="text-3xl font-black tracking-tight text-white md:text-4xl">
                  ₹{entryFee}
                </p>
              </div>

              {/* QR Code (Visible on both, adapted size) */}
              <div className="group relative mb-2 h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-white/5 bg-white p-2 shadow-2xl transition-transform hover:scale-105 md:h-40 md:w-40 md:rounded-2xl">
                <img
                  src="/img/qr-code.png"
                  alt="UPI QR Code"
                  className="h-full w-full object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="text-xs font-black tracking-widest text-white uppercase">
                    Scan to Pay
                  </p>
                </div>
              </div>
              <p className="mb-3 text-[10px] font-medium tracking-widest text-slate-500 uppercase">
                Scan with any UPI app
              </p>

              {/* Transfer to UPI ID section moved up */}
              <div className="mb-4 w-full">
                <p className="mb-2 text-center text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Or Transfer to UPI ID
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-white/5 bg-slate-900/50 px-3 py-2.5">
                    <p className="font-mono text-xs font-bold tracking-wide text-white">
                      {UPI_CONFIG.vpa}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyUPI}
                    className={`rounded-xl border p-2.5 transition-all ${
                      copied
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                        : "border-white/5 bg-slate-900/50 text-slate-400 hover:text-white"
                    }`}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Trust Signals section moved down */}
              <div className="flex w-full flex-col gap-2 rounded-xl border border-white/5 bg-slate-900/50 p-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Paying to
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      {UPI_CONFIG.payeeName}
                    </span>
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Accepted via
                  </span>
                  <div className="flex gap-2">
                    {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
                      <span
                        key={app}
                        className="text-[10px] font-medium text-slate-400"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Action Area */}
          <div className="relative flex flex-1 flex-col bg-slate-900/50 md:w-[60%] md:overflow-hidden">
            {/* Close Button (Desktop Only) */}
            <div className="absolute top-4 right-4 z-10 hidden md:block">
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 flex-1 p-4 md:overflow-y-auto md:p-6">
              <div className="flex h-full flex-col">
                {/* Instructions */}
                <div className="mb-4">
                  <p className="mb-3 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    How to complete payment
                  </p>
                  <div className="rounded-xl border border-white/5 bg-slate-950/50 p-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-500">
                          1
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white uppercase">
                            Scan or Copy
                          </p>
                          <p className="text-justify text-[10px] text-slate-400">
                            Use the QR code or copy the UPI ID above to make the
                            transfer.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-500">
                          2
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white uppercase">
                            Make Payment
                          </p>
                          <p className="text-justify text-[10px] text-slate-400">
                            Transfer exact amount of <b>₹{entryFee}</b> using
                            your preferred UPI app.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-500">
                          3
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white uppercase">
                            Verify Transaction
                          </p>
                          <p className="text-justify text-[10px] text-slate-400">
                            Note down the 12-digit Transaction ID / UTR number
                            and verify it here.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Form */}
                <form onSubmit={handleSubmit} className="mt-auto flex flex-col">
                  <div className="mb-4 space-y-4 border-t border-white/5 pt-4">
                    <div>
                      <h3 className="mb-0.5 text-base font-black text-white uppercase">
                        Verification
                      </h3>
                      <p className="mb-3 text-[10px] text-slate-400">
                        Enter the reference number to verify your payment.
                      </p>
                      {error && (
                        <div className="animate-in slide-in-from-top-2 mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                          <p className="text-[10px] font-bold text-rose-500">
                            {error}
                          </p>
                        </div>
                      )}

                      <label className="mb-1.5 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                        UPI Transaction ID / UTR Number
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. 401234567890"
                        className={`w-full rounded-xl border bg-slate-950 px-3 py-3 font-mono text-sm text-white placeholder-slate-600 transition-all focus:ring-2 focus:outline-none ${
                          error
                            ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                            : "border-white/10 focus:border-rose-500/50 focus:ring-rose-500/20"
                        }`}
                        required
                      />
                    </div>

                    <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-amber-500 uppercase">
                          Important
                        </p>
                        <p className="text-justify text-[10px] leading-relaxed text-amber-500/80">
                          We will manually verify this transaction ID against
                          our records. Registration will be confirmed only after
                          successful verification. This usually takes 5-15
                          minutes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!transactionId.trim() || isProcessing}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span className="text-xs font-black tracking-wide uppercase">
                          Processing...
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-black tracking-wide uppercase">
                          Confirm & Register
                        </span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Footer (Right Side) */}
            <div className="flex shrink-0 items-center justify-between border-t border-white/5 bg-slate-950/50 px-6 py-4">
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
                  SSL Secured
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
