import { useState, useEffect, useCallback } from "react";
import {
  getTournament,
  updateTournament,
  getRegistrations,
} from "@/lib/tournaments";
import { getTournamentPaymentRequests } from "@/lib/payment_requests";
import { getMatches } from "@/lib/brackets";

export function useTournamentData(id) {
  const [tournament, setTournament] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Format helper needed for initial state settings in the main page, 
  // but for data fetching we typically just need the raw data.
  // However, the original page did some syncing of editForm here. 
  // We might mostly return the raw data and let the consumer handle forms.

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [tData, regsRes, matchesRes, payReqsRes] = await Promise.all([
        getTournament(id),
        getRegistrations(id),
        getMatches(id),
        getTournamentPaymentRequests(id),
      ]);

      // Auto-fix count discrepancy (kept from original code)
      if (tData.registeredTeams !== regsRes.total) {
        console.warn(
          `Fixing count discrepancy: ${tData.registeredTeams} -> ${regsRes.total}`,
        );
        await updateTournament(id, { registeredTeams: regsRes.total });
        tData.registeredTeams = regsRes.total;
      }

      setTournament(tData);
      setRegistrations(regsRes.documents);
      setMatches(matchesRes);
      setPaymentRequests(payReqsRes);
      
      return tData; // useful for chaining
    } catch (error) {
      console.error("Failed to load tournament data", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, loadData]);

  return {
    tournament,
    setTournament,
    registrations,
    setRegistrations,
    paymentRequests,
    setPaymentRequests,
    matches,
    setMatches,
    loading,
    setLoading,
    loadData
  };
}
