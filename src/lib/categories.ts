// 판매글 카테고리 정의 — 화면 곳곳에서 공통으로 쓰는 한 곳입니다.
// (창고의 posts.category 안전장치와 같은 값을 유지해야 합니다.)

export const POST_CATEGORIES = [
  "전자기기",
  "가전",
  "식물",
  "의류",
  "기타",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

// 어디에도 안 맞을 때 기본값
export const DEFAULT_CATEGORY: PostCategory = "기타";

// 카테고리별 이모지 (배지·선택지에 함께 표시)
export const CATEGORY_EMOJI: Record<PostCategory, string> = {
  전자기기: "📱",
  가전: "🔌",
  식물: "🪴",
  의류: "👕",
  기타: "📦",
};

// 들어온 값이 정해진 카테고리인지 확인
export function isPostCategory(value: string): value is PostCategory {
  return (POST_CATEGORIES as readonly string[]).includes(value);
}

// "📱 전자기기" 형태의 라벨
export function categoryLabel(category: string): string {
  if (isPostCategory(category)) {
    return `${CATEGORY_EMOJI[category]} ${category}`;
  }
  return category;
}
