import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../utils/supabase';
import { Member, BoardGame, GatheringRecord, PlayLog, PlayerResult } from '../../types';

// --- Types & Helpers ---
// (We duplicate the helpers from useStore here, or we could extract them to utils. For now, keep them here)
function rowToMember(row: any): Member {
  return { id: row.id, name: row.name, color: row.color, winRate: 50 };
}
function rowToBoardGame(row: any): BoardGame {
  return {
    id: row.id, name: row.name, genre: row.genre,
    minPlayers: row.min_players, maxPlayers: row.max_players,
    playTimeMinutes: row.play_time_minutes, ownerId: row.owner_id,
    resultType: row.result_type, imageUrl: row.image_url ?? undefined,
    description: row.description ?? undefined,
  };
}
function rowsToGatheringRecord(recRow: any, logRows: any[], resultRows: any[]): GatheringRecord {
  const playLogs: PlayLog[] = logRows
    .filter((l) => l.gathering_record_id === recRow.id)
    .map((l) => {
      const results: PlayerResult[] = resultRows
        .filter((r) => r.play_log_id === l.id)
        .map((r) => ({
          memberId: r.member_id, rank: r.rank ?? undefined,
          score: r.score ?? undefined, isWinner: r.is_winner ?? undefined,
        }));
      return {
        id: l.id, gameId: l.game_id, resultType: l.result_type,
        durationMinutes: l.duration_minutes, participatingMembers: l.participating_members ?? undefined,
        results,
      };
    });

  return {
    id: recRow.id, date: recRow.date, emoji: recRow.emoji ?? '🎲',
    memo: recRow.memo ?? '', photoUrl: recRow.photo_url ?? undefined, playLogs,
  };
}

// --- Fetching Functions ---
export const fetchMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase.from('members').select('*').order('id');
  if (error) throw error;
  return (data ?? []).map(rowToMember);
};

export const fetchBoardGames = async (): Promise<BoardGame[]> => {
  const { data, error } = await supabase.from('board_games').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToBoardGame);
};

export const fetchRecords = async (): Promise<GatheringRecord[]> => {
  const { data: recData, error: recErr } = await supabase.from('gathering_records').select('*').order('date', { ascending: false });
  if (recErr) throw recErr;
  if (!recData || recData.length === 0) return [];
  const recIds = recData.map((r) => r.id);
  const { data: logData, error: logErr } = await supabase.from('play_logs').select('*').in('gathering_record_id', recIds);
  if (logErr) throw logErr;
  const logIds = (logData ?? []).map((l) => l.id);
  let resultData: any[] = [];
  if (logIds.length > 0) {
    const { data: rData, error: rErr } = await supabase.from('player_results').select('*').in('play_log_id', logIds);
    if (rErr) throw rErr;
    resultData = rData ?? [];
  }
  return recData.map((row) => rowsToGatheringRecord(row, logData ?? [], resultData));
};

// --- Hooks ---
export const useMembersQuery = () => useQuery({ queryKey: ['members'], queryFn: fetchMembers });
export const useBoardGamesQuery = () => useQuery({ queryKey: ['boardGames'], queryFn: fetchBoardGames });
export const useRecordsQuery = () => useQuery({ queryKey: ['records'], queryFn: fetchRecords });
