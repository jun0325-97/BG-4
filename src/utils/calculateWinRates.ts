import { Member, PlayLog, GatheringRecord } from "../types";

export function getDynamicMembers(members: Member[], records: GatheringRecord[]): Member[] {
  const stats: Record<string, { plays: number; wins: number }> = {};
  members.forEach((m) => {
    stats[m.id] = { plays: 0, wins: 0 };
  });

  records.forEach((rec) => {
    rec.playLogs.forEach((log: PlayLog) => {
      if (log.resultType === "no_result") return;

      const participants = log.participatingMembers || members.map((m) => m.id);
      const n = participants.length;

      participants.forEach((memberId) => {
        if (!stats[memberId]) return;

        const res = log.results.find((r) => r.memberId === memberId);
        let winValue = 0;

        if (log.resultType === "ranked") {
          const myRank = res?.rank;
          if (myRank) {
            if (n <= 1) {
              winValue = 1.0;
            } else {
              const safeRank = Math.min(myRank, n);
              winValue = Math.max(0, (n - safeRank) / (n - 1));
            }
          }
        } else if (log.resultType === "winner_only") {
          winValue = res?.isWinner ? 1.0 : 0.0;
        }

        stats[memberId].plays += 1;
        stats[memberId].wins += winValue;
      });
    });
  });

  return members.map((m) => {
    const s = stats[m.id];
    const calculatedWinRate = s.plays === 0 ? 0 : Math.round((s.wins / s.plays) * 100);
    return { ...m, winRate: calculatedWinRate };
  });
}
