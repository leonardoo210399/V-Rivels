"use client";
import { useState } from "react";
import {
  X,
  Smartphone,
  CheckCircle,
  Copy,
  ExternalLink,
  QrCode,
  IndianRupee,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

// UPI Configuration
const UPI_CONFIG = {
  vpa: "9028410543@okbizaxis",
  payeeName: "V-rivals Arena",
  currency: "INR",
};

/**
 * Generates a UPI deep link URL
 */
function generateUPILink(amount, transactionNote) {
  const params = new URLSearchParams({
    pa: UPI_CONFIG.vpa,
    pn: UPI_CONFIG.payeeName,
    am: amount.toString(),
    cu: UPI_CONFIG.currency,
    tn: transactionNote || "Tournament Entry Fee",
  });
  return `upi://pay?${params.toString()}`;
}

export default function UPIPaymentModal({
  isOpen,
  onClose,
  tournamentName,
  entryFee,
  onPaymentComplete,
  isProcessing = false,
}) {
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1); // 1: Pay, 2: Enter Transaction ID

  if (!isOpen) return null;

  const upiLink = generateUPILink(entryFee, `${tournamentName} Entry`);

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(UPI_CONFIG.vpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleOpenUPI = () => {
    window.location.href = upiLink;
    // Move to step 2 after a short delay to give time for the app to open
    setTimeout(() => setStep(2), 1000);
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
      <div className="animate-in fade-in zoom-in-95 relative w-full max-w-md duration-300">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
          {/* Glow Effects */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />

          {/* Header */}
          <div className="relative border-b border-white/10 bg-slate-950/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/20">
                  <IndianRupee className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-white">
                    Complete Payment
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
          </div>

          {/* Content */}
          <div className="relative p-6">
            {/* Amount Display */}
            <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
              <p className="mb-1 text-[10px] font-black tracking-widest text-rose-500/60 uppercase">
                Amount to Pay
              </p>
              <p className="text-4xl font-black tracking-tight text-white">
                ₹{entryFee}
              </p>
            </div>

            {step === 1 ? (
              <>
                {/* UPI ID Display */}
                <div className="mb-6">
                  <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Pay to UPI ID
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-4 py-3">
                      <p className="font-mono text-sm font-bold tracking-wide text-white">
                        {UPI_CONFIG.vpa}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyUPI}
                      className={`rounded-lg border p-3 transition-all ${
                        copied
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                          : "border-white/10 bg-slate-950 text-slate-400 hover:text-white"
                      }`}
                    >
                      {copied ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handleOpenUPI}
                  className="group mb-4 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-4 font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:shadow-rose-500/40"
                >
                  <Smartphone className="h-5 w-5" />
                  <span className="text-sm font-black tracking-wide uppercase">
                    Pay with UPI App
                  </span>
                  <ExternalLink className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                </button>

                {/* Already Paid Button */}
                <button
                  onClick={() => setStep(2)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-6 py-3 text-xs font-bold tracking-wide text-slate-400 uppercase transition-all hover:border-white/20 hover:text-white"
                >
                  I've Already Paid →
                </button>

                {/* Instructions */}
                <div className="mt-6 space-y-2 rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-3">
                  <p className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-cyan-500 uppercase">
                    <QrCode className="h-3 w-3" />
                    How to Pay
                  </p>
                  <ol className="space-y-1 text-xs text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-cyan-500">1.</span>
                      Click "Pay with UPI App" button above
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-cyan-500">2.</span>
                      Select your UPI app (GPay, PhonePe, Paytm, etc.)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-cyan-500">3.</span>
                      Complete the payment and note the Transaction ID
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-cyan-500">4.</span>
                      Come back and enter the Transaction ID
                    </li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                {/* Transaction ID Input */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      UPI Transaction ID / Reference Number
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. 401234567890"
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-white placeholder-slate-600 transition-all focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <p className="text-xs text-amber-500/80">
                      Your registration will be confirmed once we verify the
                      payment. This usually takes a few minutes.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!transactionId.trim() || isProcessing}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span className="text-sm font-black tracking-wide uppercase">
                          Processing...
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-black tracking-wide uppercase">
                          Confirm Payment
                        </span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-center text-xs font-bold text-slate-500 transition-colors hover:text-white"
                  >
                    ← Back to Payment Options
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 bg-slate-950/50 px-6 py-3">
            <p className="text-center text-[10px] font-medium text-slate-500">
              Powered by UPI • Secure Payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
