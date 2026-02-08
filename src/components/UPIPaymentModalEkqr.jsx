"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
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
  Clock,
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
  const [qrImage, setQrImage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [checking, setChecking] = useState(false);

  // Handle expiration
  useEffect(() => {
    if (timeLeft === 0 && paymentData && !paymentComplete) {
      console.log("[Payment] Transaction expired locally");
      const markAsExpired = async () => {
        try {
          const { updatePaymentStatusAction } = await import("@/app/actions/payment");
          // Try 'failed' - the action will fallback to 'rejected' if needed
          await updatePaymentStatusAction(paymentData.clientTxnId, "failed");
        } catch (err) {
          console.error("[Payment] Failed to mark as expired:", err);
        }
      };
      markAsExpired();
    }
  }, [timeLeft, paymentData, paymentComplete]);

  // Timer countdown
  useEffect(() => {
    if (!paymentData || timeLeft <= 0 || paymentComplete) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentData, , paymentComplete]);

  // Poll for payment status every 5 seconds
  useEffect(() => {
    if (!paymentData?.clientTxnId || paymentComplete || timeLeft <= 0) {
      console.log("[Payment Poll] Not starting polling:", { 
        hasClientTxnId: !!paymentData?.clientTxnId, 
        paymentComplete, 
        timeLeft 
      });
      return;
    }

    console.log("[Payment Poll] Starting polling for:", paymentData.clientTxnId);

    const checkStatus = async () => {
      try {
        setChecking(true);
        const { checkPaymentStatusAction } = await import("@/app/actions/payment");
        const result = await checkPaymentStatusAction(paymentData.clientTxnId);
        
        console.log("[Payment Poll] Status check result:", result);
        
        // Check for various success status values
        const successStatuses = ["success", "completed", "approved", "paid"];
        if (result.success && successStatuses.includes(result.status?.toLowerCase())) {
          console.log("[Payment Poll] Payment successful! Status:", result.status);
          setPaymentComplete(true);
          // Auto-reload after short delay to show success
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          return true; // Stop polling
        }
        return false;
      } catch (err) {
        console.error("[Payment Poll] Status check failed:", err);
        return false;
      } finally {
        setChecking(false);
      }
    };

    // Check immediately, then every 5 seconds
    checkStatus();
    
    const pollInterval = setInterval(async () => {
      const done = await checkStatus();
      if (done) clearInterval(pollInterval);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [paymentData, paymentComplete, timeLeft]);

  // Format time as M:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentData(null);
      setError(null);
      setLoading(false);
      setTimeLeft(300);
      setQrImage(null);
      setPaymentComplete(false);
      setChecking(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInitiatePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Import server actions dynamically to avoid SSR issues
      const { createPaymentOrderAction } = await import("@/app/actions/payment");
      const { fetchQRCodeAction } = await import("@/app/actions/qrcode");

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
      
      // Fetch the QR code image from the payment page
      if (result.paymentUrl) {
        const qrResult = await fetchQRCodeAction(result.paymentUrl);
        if (qrResult.success) {
          if (qrResult.qrImage) {
            setQrImage(qrResult.qrImage);
          }
          // Use scraped timer if available
          if (qrResult.expirySeconds && qrResult.expirySeconds > 0) {
            setTimeLeft(qrResult.expirySeconds);
          }
        }
      }
      
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
      <div className="animate-in fade-in zoom-in-95 relative w-full max-w-md md:max-w-3xl duration-300">
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
          <div className="p-4 md:p-6">
            {/* Amount Display */}
            <div className="mb-3 md:mb-6 rounded-xl border border-rose-500/20 bg-rose-500/5 p-2 md:p-4 text-center">
              <p className="text-[10px] font-black tracking-widest text-rose-500/60 uppercase">
                Entry Fee
              </p>
              <p className="text-2xl md:text-4xl font-black tracking-tight text-white">
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

            {/* State: Payment Complete */}
            {paymentComplete && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-emerald-500">Payment Successful!</h3>
                <p className="text-sm text-slate-400">Refreshing page...</p>
                <Loader2 className="mt-4 h-5 w-5 animate-spin text-emerald-500" />
              </div>
            )}

            {/* State: Payment Ready */}
            {paymentData && !paymentComplete && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Left Column: QR Code */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800 to-slate-900 p-3 md:p-4">
                  {/* Expired State Overlay */}
                  {timeLeft <= 0 && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/90 p-4 text-center backdrop-blur-md">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20">
                        <Clock className="h-7 w-7 text-rose-500" />
                      </div>
                      <h3 className="mb-1 text-base font-bold text-white">Payment Timed Out</h3>
                      <p className="mb-4 text-[11px] leading-relaxed text-slate-400">
                        The QR code has expired for security. No worries, you haven't been charged.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-rose-600 active:scale-95"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Restart Payment
                      </button>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-2 md:mb-3 text-center">
                    <p className="text-base md:text-lg font-bold text-white">{userName || "Player"}</p>
                    <p className="text-xs md:text-sm text-slate-400">Scan to pay ₹{entryFee}</p>
                  </div>

                  {/* QR Code - Scraped image first, then custom QR, then iframe fallback */}
                  {qrImage ? (
                    <div className="mx-auto mb-2 md:mb-3 flex items-center justify-center rounded-xl bg-white p-3 md:p-4" style={{ width: "clamp(160px, 40vw, 220px)", height: "clamp(160px, 40vw, 220px)" }}>
                      <img 
                        src={qrImage} 
                        alt="Scan to Pay" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : paymentData.intentLinks?.upiLink ? (
                    <div className="mx-auto mb-2 md:mb-3 flex items-center justify-center rounded-xl bg-white p-3 md:p-4" style={{ width: "clamp(160px, 40vw, 220px)", height: "clamp(160px, 40vw, 220px)" }}>
                      <QRCodeSVG
                        value={paymentData.intentLinks.upiLink}
                        size={190}
                        style={{ width: "100%", height: "100%" }}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  ) : (
                    <div 
                      className="mx-auto mb-3 overflow-hidden rounded-xl bg-white"
                      style={{ width: "240px", height: "280px" }}
                    >
                      <iframe
                        src={paymentData.paymentUrl}
                        style={{ 
                          width: "100%", 
                          height: "450px", 
                          border: "none",
                          marginTop: "-70px",
                          pointerEvents: "auto"
                        }}
                        title="UPI Payment"
                        scrolling="no"
                      />
                    </div>
                  )}

                  {/* Timer */}
                  <div className="flex items-center justify-center gap-2">
                    <Clock className={`h-4 w-4 ${timeLeft < 60 ? "text-rose-500" : "text-emerald-500"}`} />
                    <span className={`text-sm font-bold ${timeLeft < 60 ? "text-rose-500" : "text-slate-300"}`}>
                      Valid for {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>

                {/* Right Column: Instructions & Actions - Desktop only */}
                <div className="hidden md:flex flex-col justify-between space-y-3">
                  {/* Instructions */}
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800 to-slate-900 p-4">
                    <h3 className="mb-2 text-sm font-bold text-white">How to Pay</h3>
                    <ol className="space-y-1.5 text-xs text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-400">1</span>
                        <span>Open any UPI app (GPay, PhonePe, Paytm, etc.)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-400">2</span>
                        <span>Scan the QR code shown here</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-400">3</span>
                        <span>Complete the payment of ₹{entryFee}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">✓</span>
                        <span>Payment will be verified automatically</span>
                      </li>
                    </ol>
                  </div>
                  {/* Bottom Actions - Desktop */}
                  <div className="space-y-2">
                    <button
                      onClick={() => window.location.reload()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-500"
                    >
                      <RefreshCw className="h-4 w-4" />
                      I've Completed Payment
                    </button>
                    <button
                      onClick={handleOpenPaymentUrl}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800/50 px-4 py-2.5 text-xs font-medium text-slate-400 transition-all hover:bg-slate-700 hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open payment page in new tab
                    </button>
                  </div>

                  {/* Compact Info */}
                  <p className="text-center text-[10px] text-slate-500">
                    <AlertCircle className="mr-1 inline h-3 w-3" />
                    Payment confirms automatically within 1 minute after payment is completed
                  </p>
                </div>

                {/* Mobile Only Actions - Below QR */}
                <div className="md:hidden space-y-3">
                  {/* UPI App Buttons - Mobile only */}
                  {(paymentData.intentLinks?.gpayLink || paymentData.intentLinks?.phonepeLink) && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {paymentData.intentLinks?.gpayLink && (
                        <a
                          href={paymentData.intentLinks.gpayLink}
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/5 bg-slate-800/50 p-2 text-center transition-all hover:bg-slate-700"
                        >
                          <span className="text-base md:text-lg">💳</span>
                          <span className="text-[9px] font-bold text-slate-300">GPay</span>
                        </a>
                      )}
                      {paymentData.intentLinks?.phonepeLink && (
                        <a
                          href={paymentData.intentLinks.phonepeLink}
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/5 bg-slate-800/50 p-2 text-center transition-all hover:bg-slate-700"
                        >
                          <span className="text-base md:text-lg">📱</span>
                          <span className="text-[9px] font-bold text-slate-300">PhonePe</span>
                        </a>
                      )}
                      {paymentData.intentLinks?.paytmLink && (
                        <a
                          href={paymentData.intentLinks.paytmLink}
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/5 bg-slate-800/50 p-2 text-center transition-all hover:bg-slate-700"
                        >
                          <span className="text-base md:text-lg">💰</span>
                          <span className="text-[9px] font-bold text-slate-300">Paytm</span>
                        </a>
                      )}
                      {paymentData.intentLinks?.bhimLink && (
                        <a
                          href={paymentData.intentLinks.bhimLink}
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/5 bg-slate-800/50 p-2 text-center transition-all hover:border-white/20 hover:bg-slate-700"
                        >
                          <span className="text-base md:text-lg">🏦</span>
                          <span className="text-[9px] font-bold text-slate-300">BHIM</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Action Buttons - Mobile */}
                  <button
                    onClick={() => window.location.reload()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 md:py-3 text-xs md:text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-500"
                  >
                    <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    I've Completed Payment
                  </button>
                  
                  <button
                    onClick={handleOpenPaymentUrl}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800/50 px-4 py-2 md:py-2.5 text-[10px] md:text-xs font-medium text-slate-400 transition-all hover:bg-slate-700 hover:text-white"
                  >
                    <ExternalLink className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    Open payment page
                  </button>

                  {/* Compact Info */}
                  <p className="text-center text-[10px] text-slate-500">
                    <AlertCircle className="mr-1 inline h-3 w-3" />
                    Payment confirms automatically within 1 minute
                  </p>
                </div>
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
