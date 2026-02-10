"use client";
import { useState } from "react";
import { X, Smartphone, CheckCircle, QrCode, IndianRupee, ArrowRight, AlertCircle, ShieldCheck, Lock, HelpCircle, Loader2 } from "lucide-react";

/**
 * UPI Payment Modal - Manual UTR Submission Flow
 */
export default function UPIPaymentModal({
  isOpen,
  onClose,
  tournamentId,
  tournamentName,
  entryFee,
  userId,
  userEmail,
  userName,
  onPaymentComplete,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [utr, setUtr] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (utr.length !== 12) {
      setError("Please enter a valid 12-digit UTR number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onPaymentComplete(utr);
    } catch (err) {
      setError(err.message || "Failed to submit payment request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="animate-in fade-in zoom-in-95 relative w-full max-w-md duration-300">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
          {/* Glow Effects */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />

          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 shadow-lg shadow-rose-500/20">
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-white">Payment Verification</h2>
                <p className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">{tournamentName}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
              <p className="text-[10px] font-black tracking-widest text-rose-500/60 uppercase">Entry Fee</p>
              <p className="text-3xl font-black tracking-tight text-white">₹{entryFee}</p>
            </div>

            {/* QR Section - Showing static QR or instructions */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-950/50 p-6">
                 <div className="mb-4 rounded-xl bg-white p-3">
                    {/* Manual QR instruction - Re-using IMB QR logic but without link */}
                    <QrCode className="h-32 w-32 text-slate-900" />
                 </div>
                 <p className="text-center text-xs font-medium text-slate-400">
                   Scan and pay ₹{entryFee} using any UPI app
                 </p>
                 <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
                    <Smartphone className="h-3 w-3 text-rose-500" />
                    <span className="text-[10px] font-bold text-slate-300">UPI ID: vrivals@ybl</span>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  12-Digit UTR / Transaction ID
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter the 12-digit number from your receipt"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-rose-500 focus:outline-none transition-colors"
                />
                <p className="text-[9px] text-slate-500 italic">
                  Check your UPI app history for "UTR" or "Ref No." after payment
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <p className="text-[10px] text-rose-500">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || utr.length !== 12}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-rose-900/20 transition-all hover:bg-rose-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Submit for Verification
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-center border-t border-white/5 bg-slate-950/50 px-6 py-4 mt-2">
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3 text-emerald-500" />
              <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                Secured Manual Verification
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
