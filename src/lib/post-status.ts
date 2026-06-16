// 판매글 거래 상태 정의 — 화면 곳곳에서 공통으로 쓰는 한 곳입니다.
// (창고의 posts.status 안전장치와 같은 값을 유지해야 합니다.)

export const POST_STATUSES = ["거래가능", "거래예약", "거래종료"] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

// 새 글의 기본 상태
export const DEFAULT_STATUS: PostStatus = "거래가능";

// 상태별 표시 정보 (이모지 + 배지 색상 클래스)
export const STATUS_META: Record<
  PostStatus,
  { emoji: string; badge: string }
> = {
  거래가능: { emoji: "🟢", badge: "bg-green-100 text-green-700" },
  거래예약: { emoji: "🟡", badge: "bg-amber-100 text-amber-700" },
  거래종료: { emoji: "⚫", badge: "bg-goguma-100 text-goguma-500" },
};

// 들어온 값이 정해진 상태인지 확인
export function isPostStatus(value: string): value is PostStatus {
  return (POST_STATUSES as readonly string[]).includes(value);
}

// 안전하게 상태값을 읽어옵니다 (이상한 값이면 기본값).
export function readStatus(value: string | null | undefined): PostStatus {
  return value && isPostStatus(value) ? value : DEFAULT_STATUS;
}

// "🟢 거래가능" 형태의 라벨
export function statusLabel(status: string): string {
  const s = readStatus(status);
  return `${STATUS_META[s].emoji} ${s}`;
}
