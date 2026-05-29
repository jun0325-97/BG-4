// src/utils/getKoreanName.ts
// 이메일 username → 한글 이름 매핑 유틸 (중복 제거용 통합 함수)

const NAME_MAP: Record<string, string> = {
  hansol: "한솔",
  yoonhyuk: "윤혁",
  gayoung: "가영",
  youngjun: "영준",
};

export function getKoreanName(username: string): string {
  return NAME_MAP[username.toLowerCase()] ?? "";
}
