import { useState } from "react";
import {
  Users,
  User,
  Calendar,
  Check,
  X,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import {
  updateRegistrationPaymentStatus,
  deleteRegistration,
} from "@/lib/tournaments";
import { updatePaymentRequestStatus } from "@/lib/payment_requests";

export default function ParticipantsTab({
  tournament,
  registrations,
  setRegistrations,
  paymentRequests,
  loadData,
}) {
  const [updating, setUpdating] = useState(false);
  const isTeamMode = ["5v5", "2v2", "3v3"].includes(tournament.gameType);
  const isDeathmatch = tournament.gameType === "Deathmatch";

  const parseMetadata = (metadata) => {
    try {
      return typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    } catch (e) {
      return null;
    }
  };

  const handleTogglePayment = async (regId, newStatus) => {
    try {
      setUpdating(true);
      await updateRegistrationPaymentStatus(regId, newStatus);
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.$id === regId ? { ...reg, paymentStatus: newStatus } : reg,
        ),
      );
    } catch (e) {
      alert("Failed to update payment: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRevokeRegistration = async (registration) => {
    if (
      !confirm(
        "Are you sure you want to REVOKE this registration? This will delete the entry and reject the payment.",
      )
    )
      return;

    setUpdating(true);
    try {
      // 1. Delete Registration
      await deleteRegistration(registration.$id, tournament.$id);

      // 2. Find associated payment request and update it
      const relatedRequest = paymentRequests?.find(
        (pr) =>
          pr.userId === registration.userId && pr.paymentStatus === "verified",
      );

      if (relatedRequest) {
        await updatePaymentRequestStatus(
          relatedRequest.$id,
          "rejected",
          "Registration Revoked by Admin",
        );
      }

      await loadData(false);
      alert("Registration revoked successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to revoke: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="grid gap-4">
      {registrations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/5 bg-slate-950/30 p-12 text-center">
          <div className="mx-auto mb-4 w-fit rounded-full bg-slate-900 p-4">
            <Users className="h-8 w-8 text-slate-700" />
          </div>
          <h3 className="text-xl font-bold tracking-widest text-slate-500 uppercase">
            No Registrations Yet
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            When players sign up, they will appear here.
          </p>
        </div>
      ) : (
        registrations.map((reg) => {
          const meta = parseMetadata(reg.metadata);
          return (
            <div
              key={reg.$id}
              className="group overflow-hidden rounded-3xl border border-white/5 bg-slate-950/30 backdrop-blur-sm transition-all hover:border-rose-500/20"
            >
              <div className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-white/5 bg-slate-900 p-4 text-rose-500">
                    {isTeamMode ? (
                      <Users className="h-6 w-6" />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="mb-1 text-xl font-bold tracking-tight text-white">
                      {isTeamMode
                        ? reg.teamName
                        : meta?.playerName || reg.teamName}
                    </h3>
                    <p
                      className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase"
                      suppressHydrationWarning
                    >
                      <Calendar className="h-3 w-3" />
                      Registered{" "}
                      {new Date(reg.registeredAt).toLocaleDateString()}
                    </p>
                    {reg.checkedIn && (
                      <div className="mt-2 flex w-fit items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-[9px] font-black tracking-widest text-teal-400 uppercase">
                        <Check className="h-2.5 w-2.5" /> Checked In
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isDeathmatch && (
                    <div className="mr-6 flex items-center gap-6 border-r border-white/5 pr-6">
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-black text-slate-500 uppercase">
                          Kills
                        </p>
                        <p className="text-xl font-black text-white italic">
                          {meta?.kills || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-black text-slate-500 uppercase">
                          Deaths
                        </p>
                        <p className="text-xl font-black text-slate-600 italic">
                          {meta?.deaths || 0}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col items-end gap-2">
                    {reg.transactionId && (
                      <div className="text-right">
                        <p className="text-[9px] font-medium tracking-wide text-slate-600 uppercase">
                          Transaction ID
                        </p>
                        <p className="font-mono text-xs text-white">
                          {reg.transactionId}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {reg.paymentStatus === "pending" ? (
                        <>
                          <button
                            onClick={() =>
                              handleTogglePayment(reg.$id, "verified")
                            }
                            disabled={updating}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black tracking-wider text-emerald-500 uppercase transition-all hover:bg-emerald-500/20"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Verify
                          </button>
                          <button
                            onClick={() =>
                              handleTogglePayment(reg.$id, "rejected")
                            }
                            disabled={updating}
                            className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[10px] font-black tracking-wider text-rose-500 uppercase transition-all hover:bg-rose-500/20"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <>
                          <div
                            className={`rounded-xl border px-4 py-2 text-[10px] font-black tracking-widest uppercase ${
                              reg.paymentStatus === "verified"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                : reg.paymentStatus === "rejected"
                                  ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                                  : reg.paymentStatus === "free"
                                    ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-500"
                                    : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {reg.paymentStatus === "verified"
                              ? "✓ Paid"
                              : reg.paymentStatus === "rejected"
                                ? "✗ Rejected"
                                : reg.paymentStatus === "free"
                                  ? "Free Entry"
                                  : "Pending"}
                          </div>
                          <button
                            onClick={() => handleRevokeRegistration(reg)}
                            disabled={updating}
                            title="Revoke Registration"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 transition-all hover:bg-rose-500 hover:text-white disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isTeamMode && (
                <div className="border-t border-white/5 bg-slate-950/30 p-6 pb-8">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <h4 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      Verified Roster
                    </h4>
                  </div>

                  {(() => {
                    const members = meta?.members || meta?.roster || [];
                    if (!members || members.length === 0) {
                      return (
                        <p className="text-[10px] text-slate-500 italic">
                          No roster information available for this team.
                        </p>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                        {members.map((m, i) => {
                          let name = "";
                          let tag = "";

                          if (typeof m === "string") {
                            const parts = m.split("#");
                            name = parts[0];
                            tag = parts[1] || "";
                          } else {
                            name = m.name || m.playerName || "Unknown";
                            tag = m.tag || "";
                          }

                          return (
                            <div
                              key={i}
                              className="flex flex-col rounded-xl border border-white/5 bg-slate-900/50 p-3 transition-all hover:border-rose-500/30"
                            >
                              <span className="mb-1 text-[10px] font-bold text-slate-600 uppercase">
                                Member {i + 1}
                              </span>
                              <span className="truncate text-xs font-bold text-white">
                                {name}
                              </span>
                              {tag && (
                                <span className="font-mono text-[10px] text-rose-500 italic">
                                  #{tag}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
