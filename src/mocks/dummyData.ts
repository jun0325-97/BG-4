// src/mocks/dummyData.ts

import { Member, BoardGame, GatheringRecord } from "../types";

export const MEMBERS: Member[] = [
  { id: "m1", name: "레드", color: "red", winRate: 55 },
  { id: "m2", name: "블루", color: "blue", winRate: 60 },
  { id: "m3", name: "그린", color: "green", winRate: 30 },
  { id: "m4", name: "옐로우", color: "yellow", winRate: 45 },
];

export const BOARD_GAMES: BoardGame[] = [
  {
    id: "g1",
    name: "스플렌더",
    genre: "엔진빌딩",
    minPlayers: 2,
    maxPlayers: 4,
    playTimeMinutes: 30,
    ownerId: "m1",
    resultType: "ranked",
  },
  {
    id: "g2",
    name: "아발론",
    genre: "마피아/블러핑",
    minPlayers: 5,
    maxPlayers: 10,
    playTimeMinutes: 30,
    ownerId: "m4",
    resultType: "winner_only",
  },
  {
    id: "g3",
    name: "카탄",
    genre: "전략/협상",
    minPlayers: 3,
    maxPlayers: 4,
    playTimeMinutes: 90,
    ownerId: "m2",
    resultType: "ranked",
  },
  {
    id: "g4",
    name: "팬데믹",
    genre: "협력",
    minPlayers: 2,
    maxPlayers: 4,
    playTimeMinutes: 60,
    ownerId: "m3",
    resultType: "no_result",
  },
];

export const GATHERING_RECORDS: GatheringRecord[] = [
  {
    id: "r1",
    date: "2026-05-10",
    memo: "옐로우의 블러핑에 다들 속아 넘어간 날 😡",
    playLogs: [
      {
        id: "log1",
        gameId: "g1",
        resultType: "ranked",
        durationMinutes: 40,
        results: [
          { memberId: "m1", rank: 1, score: 15 },
          { memberId: "m4", rank: 2, score: 14 },
          { memberId: "m2", rank: 3, score: 12 },
          { memberId: "m3", rank: 4, score: 9 },
        ],
      },
      {
        id: "log2",
        gameId: "g2",
        resultType: "winner_only",
        durationMinutes: 35,
        results: [
          { memberId: "m4", isWinner: true },
          { memberId: "m1", isWinner: false },
          { memberId: "m2", isWinner: false },
          { memberId: "m3", isWinner: false },
        ],
      },
    ],
  },
];
