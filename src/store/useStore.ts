// src/store/useStore.ts
// Supabase DB 연동 버전

import { create } from 'zustand';
import { supabase } from '../utils/supabase';
import { Member, BoardGame, GatheringRecord, PlayLog, PlayerResult } from '../types';

interface AppState {
  members: Member[];
  boardGames: BoardGame[];
  records: GatheringRecord[];
  isLoading: boolean;
  error: string | null;

  // 초기 데이터 로드
  fetchAll: () => Promise<void>;
  fetchMembers: () => Promise<void>;
  fetchBoardGames: () => Promise<void>;
  fetchRecords: () => Promise<void>;

  // 액션
  addRecord: (newRecord: GatheringRecord) => Promise<void>;
  updateRecord: (updated: GatheringRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  addGame: (newGame: BoardGame) => Promise<void>;
  updateGame: (updated: BoardGame) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  updateMemberFavoriteGame: (memberId: string, gameId: string | null) => Promise<void>;
}

// ── URL -> Storage Path 변환 헬퍼 ─────────────────────────────
function extractStoragePath(url: string | undefined): string | null {
  if (!url) return null;
  const parts = url.split('/public/images/');
  return parts.length > 1 ? parts[1] : null;
}

// ── DB 행 → 앱 타입 변환 헬퍼 ─────────────────────────────

function rowToMember(row: any): Member {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    winRate: 50, // 실시간 계산으로 덮어씌워짐
    favoriteGameId: row.favorite_game_id ?? null,
  };
}

function rowToBoardGame(row: any): BoardGame {
  return {
    id: row.id,
    name: row.name,
    genre: row.genre,
    minPlayers: row.min_players,
    maxPlayers: row.max_players,
    playTimeMinutes: row.play_time_minutes,
    ownerId: row.owner_id,
    resultType: row.result_type,
    imageUrl: row.image_url ?? undefined,
    description: row.description ?? undefined,
  };
}

function rowsToGatheringRecord(
  recRow: any,
  logRows: any[],
  resultRows: any[]
): GatheringRecord {
  const playLogs: PlayLog[] = logRows
    .filter((l) => l.gathering_record_id === recRow.id)
    .map((l) => {
      const results: PlayerResult[] = resultRows
        .filter((r) => r.play_log_id === l.id)
        .map((r) => ({
          memberId: r.member_id,
          rank: r.rank ?? undefined,
          score: r.score ?? undefined,
          isWinner: r.is_winner ?? undefined,
        }));
      return {
        id: l.id,
        gameId: l.game_id,
        resultType: l.result_type,
        durationMinutes: l.duration_minutes,
        participatingMembers: l.participating_members ?? undefined,
        results,
      };
    });

  return {
    id: recRow.id,
    date: recRow.date,
    emoji: recRow.emoji ?? '🎲',
    memo: recRow.memo ?? '',
    photoUrl: recRow.photo_url ?? undefined,
    playLogs,
  };
}

// ── 앱 타입 → DB 삽입 헬퍼 ───────────────────────────────

async function insertRecord(record: GatheringRecord): Promise<void> {
  // 1. gathering_records 삽입
  const { error: recErr } = await supabase
    .from('gathering_records')
    .insert({
      id: record.id,
      date: record.date,
      emoji: record.emoji ?? '🎲',
      memo: record.memo,
      photo_url: record.photoUrl ?? null,
    });
  if (recErr) throw recErr;

  // 2. play_logs 삽입
  for (const log of record.playLogs) {
    const { error: logErr } = await supabase
      .from('play_logs')
      .insert({
        id: log.id,
        gathering_record_id: record.id,
        game_id: log.gameId,
        result_type: log.resultType,
        duration_minutes: log.durationMinutes,
        participating_members: log.participatingMembers ?? null,
      });
    if (logErr) throw logErr;

    // 3. player_results 삽입
    if (log.results.length > 0) {
      const resultRows = log.results.map((r) => ({
        id: `pr-${Date.now()}-${Math.random()}`,
        play_log_id: log.id,
        member_id: r.memberId,
        rank: r.rank ?? null,
        score: r.score ?? null,
        is_winner: r.isWinner ?? null,
      }));
      const { error: resErr } = await supabase
        .from('player_results')
        .insert(resultRows);
      if (resErr) throw resErr;
    }
  }
}

async function upsertRecord(record: GatheringRecord): Promise<void> {
  // 기존 play_logs / player_results를 모두 삭제 후 재삽입 (간단한 전략)
  const { error: delErr } = await supabase
    .from('play_logs')
    .delete()
    .eq('gathering_record_id', record.id);
  if (delErr) throw delErr;

  // gathering_records 업데이트
  const { error: recErr } = await supabase
    .from('gathering_records')
    .update({
      date: record.date,
      emoji: record.emoji ?? '🎲',
      memo: record.memo,
      photo_url: record.photoUrl ?? null,
    })
    .eq('id', record.id);
  if (recErr) throw recErr;

  // play_logs + player_results 재삽입
  for (const log of record.playLogs) {
    const { error: logErr } = await supabase
      .from('play_logs')
      .insert({
        id: log.id,
        gathering_record_id: record.id,
        game_id: log.gameId,
        result_type: log.resultType,
        duration_minutes: log.durationMinutes,
        participating_members: log.participatingMembers ?? null,
      });
    if (logErr) throw logErr;

    if (log.results.length > 0) {
      const resultRows = log.results.map((r) => ({
        id: `pr-${Date.now()}-${Math.random()}`,
        play_log_id: log.id,
        member_id: r.memberId,
        rank: r.rank ?? null,
        score: r.score ?? null,
        is_winner: r.isWinner ?? null,
      }));
      const { error: resErr } = await supabase
        .from('player_results')
        .insert(resultRows);
      if (resErr) throw resErr;
    }
  }
}

// ── Zustand Store ─────────────────────────────────────────

export const useStore = create<AppState>((set, get) => ({
  members: [],
  boardGames: [],
  records: [],
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().fetchMembers(),
        get().fetchBoardGames(),
        get().fetchRecords(),
      ]);
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMembers: async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('id');
    if (error) throw error;
    set({ members: (data ?? []).map(rowToMember) });
  },

  fetchBoardGames: async () => {
    const { data, error } = await supabase
      .from('board_games')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    set({ boardGames: (data ?? []).map(rowToBoardGame) });
  },

  fetchRecords: async () => {
    // gathering_records 전체
    const { data: recData, error: recErr } = await supabase
      .from('gathering_records')
      .select('*')
      .order('date', { ascending: false });
    if (recErr) throw recErr;

    if (!recData || recData.length === 0) {
      set({ records: [] });
      return;
    }

    const recIds = recData.map((r) => r.id);

    // play_logs
    const { data: logData, error: logErr } = await supabase
      .from('play_logs')
      .select('*')
      .in('gathering_record_id', recIds);
    if (logErr) throw logErr;

    const logIds = (logData ?? []).map((l) => l.id);

    // player_results
    let resultData: any[] = [];
    if (logIds.length > 0) {
      const { data: rData, error: rErr } = await supabase
        .from('player_results')
        .select('*')
        .in('play_log_id', logIds);
      if (rErr) throw rErr;
      resultData = rData ?? [];
    }

    const records = recData.map((row) =>
      rowsToGatheringRecord(row, logData ?? [], resultData)
    );
    set({ records });
  },

  addRecord: async (newRecord) => {
    await insertRecord(newRecord);
    // 낙관적 업데이트 후 서버 재조회로 데이터 정합성 보장
    set((state) => ({ records: [newRecord, ...state.records] }));
    await get().fetchRecords();
  },

  updateRecord: async (updated) => {
    await upsertRecord(updated);
    set((state) => ({
      records: state.records.map((r) => (r.id === updated.id ? updated : r)),
    }));
    // 수정 후 서버 재조회로 데이터 정합성 보장
    await get().fetchRecords();
  },

  deleteRecord: async (id) => {
    const record = get().records.find((r) => r.id === id);
    if (record?.photoUrl) {
      const path = extractStoragePath(record.photoUrl);
      if (path) {
        await supabase.storage.from('images').remove([path]);
      }
    }

    const { error } = await supabase
      .from('gathering_records')
      .delete()
      .eq('id', id);
    if (error) throw error;
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
    }));
  },

  updateMemberFavoriteGame: async (memberId: string, gameId: string | null) => {
    // DB 업데이트
    const { error } = await supabase
      .from('members')
      .update({ favorite_game_id: gameId })
      .eq('id', memberId);
    if (error) throw error;
    
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId ? { ...m, favoriteGameId: gameId } : m
      ),
    }));
  },

  addGame: async (newGame) => {
    const { error } = await supabase.from('board_games').insert({
      id: newGame.id,
      name: newGame.name,
      genre: newGame.genre,
      min_players: newGame.minPlayers,
      max_players: newGame.maxPlayers,
      play_time_minutes: newGame.playTimeMinutes,
      owner_id: newGame.ownerId,
      result_type: newGame.resultType,
      image_url: newGame.imageUrl ?? null,
      description: newGame.description ?? null,
    });
    if (error) throw error;
    set((state) => ({ boardGames: [...state.boardGames, newGame] }));
  },

  updateGame: async (updated) => {
    const { error } = await supabase
      .from('board_games')
      .update({
        name: updated.name,
        genre: updated.genre,
        min_players: updated.minPlayers,
        max_players: updated.maxPlayers,
        play_time_minutes: updated.playTimeMinutes,
        owner_id: updated.ownerId,
        result_type: updated.resultType,
        image_url: updated.imageUrl ?? null,
        description: updated.description ?? null,
      })
      .eq('id', updated.id);
    if (error) throw error;
    set((state) => ({
      boardGames: state.boardGames.map((g) => (g.id === updated.id ? updated : g)),
    }));
  },

  deleteGame: async (id) => {
    const game = get().boardGames.find((g) => g.id === id);
    if (game?.imageUrl) {
      const path = extractStoragePath(game.imageUrl);
      if (path) {
        await supabase.storage.from('images').remove([path]);
      }
    }

    const { error } = await supabase.from('board_games').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({
      boardGames: state.boardGames.filter((g) => g.id !== id),
    }));
  },
}));