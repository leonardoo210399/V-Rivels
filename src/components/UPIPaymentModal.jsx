"use client";
import { useState, useEffect, useRef } from "react";
import { X, Smartphone, CheckCircle, QrCode, IndianRupee, ArrowRight, AlertCircle, ShieldCheck, Lock, HelpCircle, Loader2, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";

/**
 * UPI Payment Modal - Automated IMB Payment Flow
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
  registrationMetadata,
  onPaymentComplete,
}) {
  const [loading, setLoading] = useState(false);
  const [fetchingLinks, setFetchingLinks] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, success, failed
  
  const initRef = useRef(false);
  const completedRef = useRef(false);

  // Initialize payment when modal opens
  useEffect(() => {
    if (isOpen && !paymentData && !fetchingLinks && !initRef.current) {
      initRef.current = true;
      initiatePayment();
    }
  }, [isOpen]);

  // Polling for status
  useEffect(() => {
    let interval;
    if (isOpen && paymentData && paymentStatus === "pending") {
      interval = setInterval(async () => {
        try {
          const response = await fetch("/api/payments/check-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: paymentData.orderId })
          });
          const data = await response.json();
          if (data.success && data.status === "SUCCESS") {
            setPaymentStatus("success");
            clearInterval(interval);
            
            // Auto-trigger completion after 3s if user doesn't click continue
            setTimeout(() => {
                if (!completedRef.current) {
                    completedRef.current = true;
                    onPaymentComplete(data.utr || "AUTOMATED");
                }
            }, 3000);
          } else if (data.status === "FAILURE") {
            setPaymentStatus("failed");
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isOpen, paymentData, paymentStatus]);

  const initiatePayment = async () => {
    setFetchingLinks(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: entryFee,
          tournamentId,
          userId,
          teamName: userName, // Using userName as fallback for teamName
          customer_email: userEmail,
          customer_mobile: "9999999999", // Placeholder, ideally user should provide this
          metadata: registrationMetadata || { userName, userEmail }
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPaymentData(data);
      } else {
        setError(data.message || "Failed to initialize payment");
      }
    } catch (err) {
      setError("Failed to connect to payment gateway");
    } finally {
      setFetchingLinks(false);
    }
  };

  if (!isOpen) return null;

  if (!isOpen) return null;

  const handleManualContinue = () => {
    if (paymentStatus === "success" && !completedRef.current) {
        completedRef.current = true;
        onPaymentComplete("AUTOMATED");
    } else {
        onClose();
    }
  };

  const handleDownloadQr = async () => {
    if (!paymentData?.bhim_link) return;
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(paymentData.bhim_link)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payment-qr-${paymentData.orderId || 'tournament'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download QR code. Please take a screenshot instead.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal - Compact & Automated */}
      <div className="animate-in fade-in zoom-in-95 relative w-full max-w-sm duration-300">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
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
                <h2 className="text-sm font-bold tracking-tight text-white">Secure Payment</h2>
                <p className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">{tournamentName}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Unified Amount Header */}
            <div className="mb-4 text-center">
              <p className="text-[10px] font-black tracking-[0.2em] text-rose-500/80 uppercase mb-1">Total Amount Due</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-black text-white italic tracking-tighter">₹{entryFee}</span>
                <div className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-[8px] font-black text-rose-500 uppercase tracking-widest">Instant</div>
              </div>
            </div>

            {paymentStatus === "success" ? (
                <div className="flex flex-col items-center justify-center py-8 gap-6 animate-in fade-in zoom-in duration-500">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <CheckCircle className="h-12 w-12" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Payment Verified!</h3>
                        <p className="text-xs text-slate-400 mt-1">Your registration is being finalized...</p>
                    </div>
                    <button
                        onClick={handleManualContinue}
                        className="group flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 hover:scale-105 active:scale-95"
                    >
                        Continue
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            ) : fetchingLinks ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                <p className="text-xs font-medium text-slate-400">Initializing secure payment gateway...</p>
              </div>
            ) : error ? (
              <div className="mb-6 space-y-4">
                <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <p className="text-[10px] text-rose-500">{error}</p>
                </div>
                <button 
                  onClick={initiatePayment}
                  className="w-full rounded-xl border border-white/10 py-3 text-[10px] font-bold text-white uppercase hover:bg-white/5"
                >
                  Retry Initializing
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentData && (
                  <div className="flex flex-col items-center gap-5">
                    {/* QR Code Container - Compact */}
                    <div className="relative group p-3 rounded-2xl bg-white shadow-xl shadow-rose-500/5 transition-transform hover:scale-[1.02]">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-rose-500/40 to-indigo-500/40 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative bg-white rounded-xl p-1.5">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentData.bhim_link)}`}
                          alt="Payment QR Code"
                          className="w-44 h-44"
                        />
                      </div>
                    </div>

                    {/* Compact Status Indicator */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-500/10 bg-rose-500/5 scale-90">
                            <Loader2 className="h-3 w-3 animate-spin text-rose-500" />
                            <span className="text-[9px] font-black tracking-widest text-white uppercase italic">Awaiting API confirmation</span>
                        </div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight text-center max-w-[180px]">
                            Scan QR with any UPI app to complete
                        </p>
                    </div>

                    {/* Actions Grid - Mobile Only (Ultimate Premium Style) */}
                    <div className="grid grid-cols-1 gap-2 w-full md:hidden">
                      <a
                        href={paymentData?.paytm_link}
                        className="group relative flex items-center justify-center gap-2.5 rounded-full bg-[#1a1b1e] border border-white/10 py-3 transition-all hover:bg-black active:scale-[0.98] shadow-2xl overflow-hidden"
                      >
                        <span className="text-sm font-medium text-white/90 tracking-tight">Pay with</span>
                        <div className="flex items-center justify-center leading-none">
                           <span className="text-[20px] font-[1000] italic tracking-tighter flex mb-0.5">
                             <span className="text-[#002970]">Pay</span>
                             <span className="text-[#00baf2]">tm</span>
                           </span>
                        </div>
                        
                        {/* Shine Effect Animation */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                      </a>

                      <button
                        onClick={handleDownloadQr}
                        className="flex items-center justify-center gap-2 rounded-full border border-white/5 bg-white/5 py-2.5 transition-all hover:bg-white/10 active:scale-95"
                      >
                        <Download className="h-3 w-3 text-slate-500" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Download QR for Gallery</span>
                      </button>
                    </div>

                    <style jsx>{`
                      @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                      }
                    `}</style>
                  </div>
                )}
              </div>
            )}
          </div>


          {/* Footer - Professional Security Bar */}
          <div className="flex items-center justify-center border-t border-white/5 bg-black/40 px-6 py-3.5">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
              <ShieldCheck className="h-3 w-3 text-emerald-500/80" />
              <p className="text-[8px] font-black tracking-[0.15em] text-emerald-500/70 uppercase">
                Secure Automated Gateway | Powered by IMB
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

