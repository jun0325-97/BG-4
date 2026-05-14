export type MemberColor = "red" | "blue" | "green" | "yellow";

export interface Member {
  id: string;
  name: string;
  color: MemberColor;
  title: string; // 예: "블러핑 중독자"
  winRate: number; // 종합 승률
}

export interface BoardGame {
  id: string;
  name: string;
  genre: string; // 예: "마피아/블러핑", "전략", "파티"
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number;
  ownerId: string; // 누가 보유하고 있는지 (Member.id)
  imageUrl?: string; // 보드게임 박스 사진
}

export interface PlayerResult {
  memberId: string;
  score?: number; // 점수 (승패만 있는 게임은 없을 수 있음)
  isWinner: boolean; // 승자 여부 (👑)
}

export interface PlayLog {
  id: string;
  gameId: string; // 어떤 게임을 했는지 (BoardGame.id)
  durationMinutes: number;
  results: PlayerResult[]; // 그 판에 참여한 사람들과 결과
}

export interface GatheringRecord {
  id: string;
  date: string; // "YYYY-MM-DD"
  memo: string; // 한줄평
  photoUrl?: string; // 그날 찍은 단체 사진 등
  playLogs: PlayLog[]; // 그날 하루동안 한 게임들
}
