// src/store/useStore.ts

import { create } from 'zustand';
import { MEMBERS, BOARD_GAMES, GATHERING_RECORDS } from '../mocks/dummyData';
import { Member, BoardGame, GatheringRecord } from '../types';

// 1. 우리 저장소(Store)에 어떤 데이터와 함수들이 들어갈지 타입(Type)을 정의해 줘.
interface AppState {
  members: Member[];
  boardGames: BoardGame[];
  records: GatheringRecord[];
  
  // 상태를 변경하는 함수들 (Actions)
  addRecord: (newRecord: GatheringRecord) => void;
  addGame: (newGame: BoardGame) => void;
}

// 2. 실제 저장소를 생성! 이제 앱 어디서든 useStore를 호출하면 이 데이터에 접근할 수 있어.
export const useStore = create<AppState>((set) => ({
  // 초기 데이터는 일단 우리가 만들어둔 더미 데이터로 세팅!
  members: MEMBERS,
  boardGames: BOARD_GAMES,
  records: GATHERING_RECORDS,

  // 🌟 새로운 모임 기록을 추가하는 함수
  addRecord: (newRecord) =>
    set((state) => ({
      records: [...state.records, newRecord], // 기존 기록들에 새 기록을 덧붙임
    })),

  // 🌟 새로운 보드게임을 추가하는 함수
  addGame: (newGame) =>
    set((state) => ({
      boardGames: [...state.boardGames, newGame], // 기존 게임들에 새 게임을 덧붙임
    })),
}));