// src/types/index.ts

export type MemberColor = "red" | "blue" | "green" | "yellow";

// 게임 결과 타입 추가
export type GameResultType = "winner_only" | "ranked" | "no_result" | "unknown";

export const GAME_GENRES = [
  "파티/순발력",
  "전략/수싸움",
  "방탈출/추리",
  "테마/머더미스터리",
  "마피아/블러핑",
  "협력",
  "퍼즐/타일놓기",
  "카드게임",
  "엔진/덱빌딩",
  "기타",
] as const;

// 💡 2. 장르 타입을 위 리스트 중 하나만 되도록 강력하게 제한
export type BoardGameGenre = (typeof GAME_GENRES)[number];

export interface BoardGame {
  id: string;
  name: string;
  genre: BoardGameGenre; // 💡 string 대신 강력한 타입 적용!
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number;
  ownerId: string;
  resultType: GameResultType;
  imageUrl?: string;
  description?: string; // 💡 새 필드: 한 줄 메모
}

export interface Member {
  id: string;
  name: string;
  color: MemberColor;
  winRate: number;
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
  resultType: GameResultType;
  durationMinutes: number;
  participatingMembers?: string[]; // 💡 새 필드: 참여 멤버 ID 리스트
  results: PlayerResult[];
}

export interface GatheringRecord {
  id: string;
  date: string;
  emoji?: string;
  memo: string;
  photoUrl?: string;
  playLogs: PlayLog[];
}
