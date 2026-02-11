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
  Download,
} from "lucide-react";

/**
 * UPI Payment Modal - IMB Payment Gateway Integration
 * 
 * This modal:
 * 1. Calls the server action to create a payment order
 * 2. Displays the QR for user to pay
 * 3. Shows deep links for UPI apps (GPay, PhonePe, Paytm)
 * 4. User is redirected back after payment confirmation
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
  teamName = "",
  metadata = {},
  onPaymentStarted,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [isManualVerification, setIsManualVerification] = useState(false);
  const [checking, setChecking] = useState(false);
  const [utr, setUtr] = useState("");
  const [showUtrField, setShowUtrField] = useState(false);
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);

  // Handle expiration
  useEffect(() => {
    if (timeLeft === 0 && paymentData && !paymentComplete && !isManualVerification) {
      const markAsExpired = async () => {
        try {
          const { updatePaymentStatusAction } = await import("@/app/actions/payment");
          await updatePaymentStatusAction(paymentData.clientTxnId, "failed");
        } catch (err) {
          // Silent fail - webhook will handle if needed
        }
      };
      markAsExpired();
    }
  }, [timeLeft, paymentData, paymentComplete, isManualVerification]);

  // Timer countdown
  useEffect(() => {
    if (!paymentData || timeLeft <= 0 || paymentComplete || isManualVerification) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentData, paymentComplete, isManualVerification]);

  // Poll for payment status
  const checkStatus = async (isManual = false) => {
    if (!paymentData?.clientTxnId || paymentComplete || isManualVerification) return false;

    try {
      if (isManual) setChecking(true);
      
      const { checkPaymentStatusAction } = await import("@/app/actions/payment");
      const result = await checkPaymentStatusAction(paymentData.clientTxnId);
      
      const successStatuses = ["success", "completed", "approved", "paid"];
      const failureStatuses = ["failure", "failed", "rejected"];
      const currentStatus = result.status?.toLowerCase();

      if (currentStatus === "manual_verification") {
        setIsManualVerification(true);
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        return true;
      }

      if (result.success && successStatuses.includes(currentStatus)) {
        setPaymentComplete(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return true;
      }
      
      if (currentStatus === "rejected") {
        setError("Your payment verification was rejected by the admin. Please try again or contact support.");
        setIsManualVerification(false); // Stop showing pending screen
        return true; // Stop polling
      }
      
      // Only alert on failure if manual check and NOT rejected (captured above)
      if (failureStatuses.includes(currentStatus)) {
        if (isManual) {
          alert("The payment gateway reported a failure. If you have already paid, please use the 'Enter UTR manually' option below to submit your receipt.");
        }
        return false;
      }
      
      if (isManual) {
        alert("Payment not detected yet. It can take up to a minute to reflect after completion. Please wait a moment or ensure you've paid.");
      }
      return false;
    } catch (err) {
      if (isManual) alert("Error checking status. Please try again.");
      return false;
    } finally {
      if (isManual) setChecking(false);
    }
  };

  useEffect(() => {
    if (!paymentData?.clientTxnId || paymentComplete || isManualVerification || timeLeft <= 0) {
      return;
    }

    // Check immediately, then every 5 seconds
    checkStatus();
    
    const pollInterval = setInterval(async () => {
      const done = await checkStatus();
      if (done) clearInterval(pollInterval);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [paymentData, paymentComplete, isManualVerification]);

  // Extract VPA from UPI Link
  const getUPIId = () => {
    const link = paymentData?.intentLinks?.upiLink || "";
    if (!link.startsWith("upi://pay")) return null;
    try {
      const url = new URL(link.replace("upi://pay", "http://pay"));
      return url.searchParams.get("pa");
    } catch (e) {
      // Fallback regex
      const match = link.match(/pa=([^&]+)/);
      return match ? match[1] : null;
    }
  };

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
      setPaymentComplete(false);
      setIsManualVerification(false);
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
      let customError = err.message || "Failed to initiate payment";
      setError(customError);
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
        // onClick={onClose} // Disabled to prevent accidental closure during payment
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
                  disabled={loading || (error && error.includes("Gateway Error"))}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale"
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

            {/* State: Manual Verification */}
            {isManualVerification && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
                  <Clock className="h-10 w-10 text-yellow-500" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-yellow-500">Verification Pending</h3>
                <p className="text-sm text-slate-400 text-center px-4">
                  We have received your UTR. Your registration will be approved after admin verification.
                </p>
                <p className="text-xs text-slate-500 mt-2">Refreshing page...</p>
                <Loader2 className="mt-4 h-5 w-5 animate-spin text-yellow-500" />
              </div>
            )}

            {/* State: Payment Ready */}
            {paymentData && !paymentComplete && !isManualVerification && (
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
                        The QR code has expired. No worries, you haven't been charged.
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={async () => {
                            try {
                              setChecking(true);
                              const { checkPaymentStatusAction } = await import("@/app/actions/payment");
                              const result = await checkPaymentStatusAction(paymentData.clientTxnId);
                              const successStatuses = ["success", "completed", "approved", "paid"];
                              if (result.success && successStatuses.includes(result.status?.toLowerCase())) {
                                setPaymentComplete(true);
                                setTimeout(() => window.location.reload(), 2000);
                              } else {
                                alert("Payment not received. Please restart if you haven't paid.");
                              }
                            } catch (err) {
                              alert("Could not check status. Please try again.");
                            } finally {
                              setChecking(false);
                            }
                          }}
                          disabled={checking}
                          className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-slate-800 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-700 active:scale-95 disabled:opacity-50"
                        >
                          {checking ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          {checking ? "Checking..." : "Check Payment Status"}
                        </button>
                        <button
                          onClick={() => window.location.reload()}
                          className="flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-rose-600 active:scale-95"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Restart Payment
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-2 md:mb-3 text-center">
                    <p className="text-base md:text-lg font-bold text-white">{userName || "Player"}</p>
                    <p className="text-xs md:text-sm text-slate-400">Scan to pay ₹{entryFee}</p>
                  </div>

                  {/* QR Code */}
                  <div className="mx-auto mb-2 md:mb-3 flex items-center justify-center rounded-xl bg-white p-3 md:p-4" style={{ width: "clamp(160px, 40vw, 220px)", height: "clamp(160px, 40vw, 220px)" }}>
                    {paymentData.intentLinks?.upiLink ? (
                      <QRCodeSVG
                        value={paymentData.intentLinks.upiLink}
                        size={190}
                        style={{ width: "100%", height: "100%" }}
                        level="M"
                        includeMargin={false}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full text-xs text-rose-500">
                        Details Unavailable
                      </div>
                    )}
                  </div>

                  {/* Timer & VPA Copy */}
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className={`h-4 w-4 ${timeLeft < 60 ? "text-rose-500" : "text-emerald-500"}`} />
                      <span className={`text-sm font-bold ${timeLeft < 60 ? "text-rose-500" : "text-slate-300"}`}>
                        Valid for {formatTime(timeLeft)}
                      </span>
                    </div>

                    {getUPIId() && (
                      <button
                        onClick={() => {
                          const vpa = getUPIId();
                          navigator.clipboard.writeText(vpa);
                          alert(`UPI ID ${vpa} copied to clipboard!`);
                        }}
                        className="flex items-center gap-2 rounded-lg border border-white/5 bg-slate-800/50 px-3 py-1.5 text-[10px] font-bold text-slate-400 transition-all hover:bg-slate-700 hover:text-white"
                      >
                        <Smartphone className="h-3 w-3" />
                        Copy UPI ID: {getUPIId()}
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column: Instructions & Actions - Desktop */}
                <div className="hidden md:flex flex-col justify-between space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800 to-slate-900 p-4">
                    <h3 className="mb-2 text-sm font-bold text-white">How to Pay</h3>
                    <ol className="space-y-1.5 text-xs text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-400">1</span>
                        <span>Open any UPI app (GPay, PhonePe, Paytm)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-400">2</span>
                        <span>Scan the QR code shown here</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-400">3</span>
                        <span>Complete the payment of ₹{entryFee}</span>
                      </li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => checkStatus(true)}
                      disabled={checking}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {checking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      {checking ? "Verifying..." : "I've Completed Payment"}
                    </button>
                    <button
                      onClick={handleOpenPaymentUrl}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800/50 px-4 py-2.5 text-xs font-medium text-slate-400 transition-all hover:bg-slate-700 hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open generic payment page
                    </button>

                    {/* UTR Fallback Button */}
                    {!showUtrField && (
                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => setShowUtrField(true)}
                          className="text-[10px] font-bold text-slate-500 underline decoration-slate-500/30 transition-all hover:text-slate-300"
                        >
                          Paying but not detecting? Enter UTR manually
                        </button>
                      </div>
                    )}

                    {showUtrField && (
                      <div className="animate-in fade-in slide-in-from-top-2 space-y-2 rounded-xl border border-white/5 bg-slate-950/50 p-3">
                        <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                          12-Digit UTR/Transaction ID
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={12}
                            value={utr}
                            onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))}
                            placeholder="3xxxxxxxxxxx"
                            className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                          />
                          <button
                            onClick={async () => {
                              if (utr.length < 12) {
                                alert("Please enter a valid 12-digit UTR number.");
                                return;
                              }
                              setIsSubmittingUtr(true);
                              try {
                                const { submitUtrAction } = await import("@/app/actions/payment");
                                const result = await submitUtrAction(paymentData.clientTxnId, utr);
                                if (result.success) {
                                  alert("UTR submitted! We'll verify and approve your registration shortly.");
                                  // Trigger one final check
                                  checkStatus(true);
                                } else {
                                  alert(result.error || "Failed to submit UTR");
                                }
                              } catch (e) {
                                alert("Error submitting UTR. Please try again.");
                              } finally {
                                setIsSubmittingUtr(false);
                              }
                            }}
                            disabled={isSubmittingUtr || utr.length < 12}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-black text-white hover:bg-emerald-500 disabled:opacity-50"
                          >
                            {isSubmittingUtr ? "..." : "Submit"}
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-600 italic">
                          Found in your UPI app receipt/history as "UTR" or "Ref No."
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Only Actions - Below QR */}
                <div className="md:hidden space-y-3">
                  {/* GPay Button */}
                  {paymentData.intentLinks?.upiLink && (
                    <a
                      href={paymentData.intentLinks.upiLink}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm font-bold text-gray-800 shadow-md active:scale-95"
                    >
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" 
                        alt="GPay" 
                        className="h-6 w-auto" 
                      />
                      Open GPay
                    </a>
                  )}

                  {/* Paytm Button */}
                  {paymentData.intentLinks?.paytmLink && (
                    <a
                      href={paymentData.intentLinks.paytmLink}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00baf2] px-4 py-3 text-sm font-bold text-white shadow-md active:scale-95"
                    >
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" 
                        alt="Paytm" 
                        className="h-5 w-auto" 
                      />
                      Open Paytm
                    </a>
                  )}

                  {/* Fallback Intent - already covered by GPay button which now uses upiLink if gpayLink is missing, but keeping a generic "Any App" button is good practice if neither specific one is preferred */}
                  {!paymentData.intentLinks?.paytmLink && (
                     <a
                     href={paymentData.intentLinks.upiLink}
                     className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg active:scale-95"
                   >
                     <Smartphone className="h-5 w-5" />
                     Open Any UPI App
                   </a>
                  )}

                  <button
                    onClick={() => checkStatus(true)}
                    disabled={checking}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white border border-white/10 active:scale-95 disabled:opacity-50"
                  >
                    {checking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {checking ? "Checking Status..." : "I've Completed Payment"}
                  </button>

                  {/* UTR Fallback Button Mobile */}
                    {!showUtrField && (
                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => setShowUtrField(true)}
                          className="text-[10px] font-bold text-slate-500 underline decoration-slate-500/30 transition-all hover:text-slate-300"
                        >
                          Paying but not detecting? Enter UTR manually
                        </button>
                      </div>
                    )}

                    {showUtrField && (
                      <div className="animate-in fade-in slide-in-from-top-2 space-y-2 rounded-xl border border-white/5 bg-slate-950/50 p-3">
                        <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                          12-Digit UTR/Transaction ID
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={12}
                            value={utr}
                            onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))}
                            placeholder="3xxxxxxxxxxx"
                            className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                          />
                          <button
                            onClick={async () => {
                              if (utr.length < 12) {
                                alert("Please enter a valid 12-digit UTR number.");
                                return;
                              }
                              setIsSubmittingUtr(true);
                              try {
                                const { submitUtrAction } = await import("@/app/actions/payment");
                                const result = await submitUtrAction(paymentData.clientTxnId, utr);
                                if (result.success) {
                                  alert("UTR submitted! We'll verify and approve your registration shortly.");
                                  // Trigger one final check
                                  checkStatus(true);
                                } else {
                                  alert(result.error || "Failed to submit UTR");
                                }
                              } catch (e) {
                                alert("Error submitting UTR. Please try again.");
                              } finally {
                                setIsSubmittingUtr(false);
                              }
                            }}
                            disabled={isSubmittingUtr || utr.length < 12}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-black text-white hover:bg-emerald-500 disabled:opacity-50"
                          >
                            {isSubmittingUtr ? "..." : "Submit"}
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-600 italic">
                          Found in your UPI app receipt/history as "UTR" or "Ref No."
                        </p>
                      </div>
                    )}
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
                Secured by IMB Payment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
