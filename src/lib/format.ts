// 가격을 "12,000원" 형태로 표시합니다.
export function formatPrice(price: number): string {
  if (!price || price <= 0) return "나눔 🍠";
  return `${price.toLocaleString("ko-KR")}원`;
}

// 작성 시각을 "방금 전 / 3분 전 / 2일 전" 형태로 표시합니다.
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}
