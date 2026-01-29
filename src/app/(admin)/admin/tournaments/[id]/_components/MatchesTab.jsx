import { useMemo } from "react";
import BracketView from "./BracketView";
import DeathmatchView from "./DeathmatchView";
import MatchEditorModal from "./MatchEditorModal";

export default function MatchesTab({
  tournament,
  matches,
  registrations,
  setRegistrations,
  setMatches,
  setTournament,
  actions,
  tournamentActions,
  loadData,
}) {
  const isBracketMode = ["5v5", "1v1", "2v2", "3v3"].includes(
    tournament.gameType,
  );

  const participantMap = useMemo(() => {
    return (
      registrations?.reduce((acc, r) => {
        const meta =
          typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata;
        acc[r.$id] = r.teamName
          ? { name: r.teamName }
          : meta
            ? { name: meta?.playerName || "Unknown" }
            : { name: "Player" };
        return acc;
      }, {}) || {}
    );
  }, [registrations]);

  return (
    <>
      {isBracketMode ? (
        <BracketView
          tournament={tournament}
          matches={matches}
          registrations={registrations}
          participantMap={participantMap}
          actions={actions}
          tournamentActions={tournamentActions}
        />
      ) : (
        <DeathmatchView
          tournament={tournament}
          matches={matches}
          registrations={registrations}
          setRegistrations={setRegistrations}
          setMatches={setMatches}
          setTournament={setTournament}
          actions={actions}
          tournamentActions={tournamentActions}
          loadData={loadData}
        />
      )}

      {/* Shared Match Editor Modal */}
      <MatchEditorModal
        isOpen={!!actions.selectedMatch}
        onClose={actions.closeMatchEditor}
        match={actions.selectedMatch}
        actions={actions}
        tournament={tournament}
        participantMap={participantMap}
      />
    </>
  );
}
