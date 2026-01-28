import { useState } from "react";
import { FileText, Check, X, Clock } from "lucide-react";
import {
  updateRegistrationPaymentStatus,
  registerForTournament,
} from "@/lib/tournaments";
import { updatePaymentRequestStatus } from "@/lib/payment_requests";
import { getUserProfile } from "@/lib/users";
import {
  assignTournamentRoleAction,
  announceRegistrationApprovedAction,
} from "@/app/actions/discord";
import RejectionModal from "./RejectionModal";

export default function RequestsTab({
  tournament,
  paymentRequests,
  setPaymentRequests,
  registrations,
  setRegistrations,
  loadData,
}) {
  const [updating, setUpdating] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedRequestForRejection, setSelectedRequestForRejection] =
    useState(null);

  const is5v5 = tournament.gameType === "5v5";

  const parseMetadata = (metadata) => {
    try {
      return typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    } catch (e) {
      return null;
    }
  };

  const handleApproveRequest = async (request) => {
    if (!confirm("Approve this payment and register the user?")) return;
    setUpdating(true);

    // Optimistic Update
    setPaymentRequests((prev) =>
      prev.map((r) =>
        r.$id === request.$id ? { ...r, paymentStatus: "verified" } : r,
      ),
    );

    try {
      // Check if user is already registered
      const existingReg = registrations.find(
        (r) => r.userId === request.userId,
      );

      if (existingReg) {
        if (
          confirm(
            `User is already registered as "${existingReg.teamName}". Update their existing registration to VERIFIED?`,
          )
        ) {
          await updateRegistrationPaymentStatus(
            existingReg.$id,
            "verified",
            request.transactionId,
          );
        } else {
          setUpdating(false); // cancel optimistic?
          // Ideally revert optimistic update here but for admin panel it's fine to just reload or let it be 'verified' in UI until refresh
          await loadData(false);
          return;
        }
      } else {
        // 1. Create New Registration
        await registerForTournament(
          request.tournamentId,
          request.userId,
          request.teamName,
          {
            metadata: request.metadata,
            transactionId: request.transactionId,
            paymentStatus: "verified",
          },
        );
      }

      // 2. Update Request Status
      await updatePaymentRequestStatus(request.$id, "verified");

      // 3. Assign Discord Role
      try {
        const userProfile = await getUserProfile(request.userId);
        if (userProfile?.discordId && tournament.discordRoleId) {
          const discordResult = await assignTournamentRoleAction(
            tournament.discordRoleId,
            userProfile.discordId,
          );
          if (discordResult && discordResult.error) {
            alert(
              `Payment verified, but Discord Role assignment failed: ${discordResult.error}\n\nAsk the user to join the Discord server.`,
            );
          }
        }
      } catch (discordErr) {
        console.warn("Failed to assign Discord role:", discordErr);
      }

      // 4. Announce Registration
      const meta = parseMetadata(request.metadata);
      const registrantName = is5v5
        ? request.teamName
        : meta?.playerName || request.teamName;

      try {
        await announceRegistrationApprovedAction(
          tournament.name,
          registrantName,
          request.transactionId,
        );
      } catch (announceErr) {
        console.warn("Failed to announce registration:", announceErr);
      }

      await loadData(false);
      alert("User registered/updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to approve: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequestForRejection(request);
    setRejectionModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {paymentRequests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/5 bg-slate-950/30 p-12 text-center">
          <div className="mx-auto mb-4 w-fit rounded-full bg-slate-900 p-4">
            <FileText className="h-8 w-8 text-slate-700" />
          </div>
          <h3 className="text-xl font-bold tracking-widest text-slate-500 uppercase">
            No Payment Requests
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Pending payment requests will appear here.
          </p>
        </div>
      ) : (
        paymentRequests.map((req) => {
          const meta = parseMetadata(req.metadata);
          return (
            <div
              key={req.$id}
              className="group overflow-hidden rounded-3xl border border-white/5 bg-slate-950/30 backdrop-blur-sm transition-all hover:border-indigo-500/20"
            >
              <div className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                  <div
                    className={`rounded-2xl border border-white/5 p-4 ${
                      req.paymentStatus === "pending"
                        ? "bg-amber-500/10 text-amber-500"
                        : req.paymentStatus === "verified"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-rose-500/10 text-rose-500"
                    }`}
                  >
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-white">
                        {is5v5
                          ? req.teamName
                          : meta?.playerName || req.teamName}
                      </h3>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                          req.paymentStatus === "pending"
                            ? "border border-amber-500/20 bg-amber-500/10 text-amber-500"
                            : req.paymentStatus === "verified"
                              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                              : "border border-rose-500/20 bg-rose-500/10 text-rose-500"
                        }`}
                      >
                        {req.paymentStatus}
                      </span>
                    </div>
                    <p className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      <Clock className="h-3 w-3" />
                      Requested {new Date(req.requestedAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Transaction ID:{" "}
                      <span className="font-mono text-white">
                        {req.transactionId}
                      </span>
                    </p>
                  </div>
                </div>

                {req.paymentStatus === "pending" && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRejectClick(req)}
                      disabled={updating}
                      className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[10px] font-black tracking-widest text-rose-500 uppercase transition-all hover:bg-rose-500 hover:text-white disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveRequest(req)}
                      disabled={updating}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                  </div>
                )}
                {req.paymentStatus === "rejected" && (
                  <div className="text-right">
                    <p className="text-[10px] font-black text-rose-500 uppercase">
                      Rejection Reason
                    </p>
                    <p className="text-xs text-slate-400">
                      {req.rejectionReason || "No reason provided"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Shared Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        request={selectedRequestForRejection}
        onSuccess={() => loadData(false)}
        setPaymentRequests={setPaymentRequests}
      />
    </div>
  );
}
