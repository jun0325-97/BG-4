// src/types/index.ts

export type MemberColor = "red" | "blue" | "green" | "yellow";

// 게임 결과 타입 추가
export type GameResultType = "winner_only" | "ranked" | "no_result";

export interface Member {
  id: string;
  name: string;
  color: MemberColor;
  winRate: number;
}

export interface BoardGame {
  id: string;
  name: string;
  genre: string;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number;
  ownerId: string;
  resultType: GameResultType; // 추가 ✨
  imageUrl?: string;
}

// PlayerResult는 resultType에 따라 쓰는 필드가 달라짐
export interface PlayerResult {
  memberId: string;
  rank?: number; // ranked일 때만
  score?: number; // ranked일 때만
  isWinner?: boolean; // winner_only일 때만
  // no_result면 memberId만 있으면 됨
}

export interface PlayLog {
  id: string;
  gameId: string;
  resultType: GameResultType; // 어떤 방식으로 기록됐는지
  durationMinutes: number;
  results: PlayerResult[];
}

export interface GatheringRecord {
  id: string;
  date: string;
  memo: string;
  photoUrl?: string;
  playLogs: PlayLog[];
}
