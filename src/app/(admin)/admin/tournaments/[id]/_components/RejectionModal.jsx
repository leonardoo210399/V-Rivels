import { useState } from "react";
import { ShieldCheck, Loader as LoaderIcon } from "lucide-react";
import { updatePaymentRequestStatus } from "@/lib/payment_requests";

const REJECTION_REASONS = [
  "Invalid Transaction ID",
  "Payment Not Received",
  "Incorrect Amount",
  "Duplicate Request",
  "Other",
];

export default function RejectionModal({
  isOpen,
  onClose,
  request,
  onSuccess,
  setPaymentRequests, // optimistic update
}) {
  const [rejectionReason, setRejectionReason] = useState(
    "Invalid Transaction ID",
  );
  const [customRejectionReason, setCustomRejectionReason] = useState("");
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !request) return null;

  const confirmReject = async () => {
    const finalReason =
      rejectionReason === "Other" ? customRejectionReason : rejectionReason;

    if (!finalReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setUpdating(true);

    // Optimistic Update
    setPaymentRequests((prev) =>
      prev.map((r) =>
        r.$id === request.$id
          ? { ...r, paymentStatus: "rejected", rejectionReason: finalReason }
          : r,
      ),
    );

    try {
      await updatePaymentRequestStatus(request.$id, "rejected", finalReason);
      onSuccess(); // usually just closing modal and maybe refreshing
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to reject: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="animate-in zoom-in-95 w-full max-w-md rounded-3xl border border-rose-500/20 bg-slate-900 p-6 shadow-2xl duration-200">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-full bg-rose-500/10 p-3 text-rose-500">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Reject Payment</h3>
            <p className="text-sm text-slate-400">
              Select a reason for rejection
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-3">
          {REJECTION_REASONS.map((reason) => (
            <label
              key={reason}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                rejectionReason === reason
                  ? "border-rose-500 bg-rose-500/10 text-white"
                  : "border-white/5 bg-slate-950/50 text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <input
                type="radio"
                name="rejectionReason"
                value={reason}
                checked={rejectionReason === reason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="h-4 w-4 accent-rose-500"
              />
              <span className="font-medium">{reason}</span>
            </label>
          ))}

          {rejectionReason === "Other" && (
            <div className="animate-in slide-in-from-top-2 mt-2 pl-4">
              <textarea
                value={customRejectionReason}
                onChange={(e) => setCustomRejectionReason(e.target.value)}
                placeholder="Enter specific reason..."
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={confirmReject}
            disabled={updating}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-900/20 transition-all hover:bg-rose-500 disabled:opacity-50"
          >
            {updating ? (
              <LoaderIcon className="h-4 w-4 animate-spin" />
            ) : (
              "Confirm Rejection"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
