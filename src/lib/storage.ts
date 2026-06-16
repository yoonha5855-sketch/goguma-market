// 판매글 사진 보관함(Storage 버킷) 관련 공용 설정·도구입니다.

// 사진을 보관하는 버킷 이름
export const POST_IMAGES_BUCKET = "post-images";

// 한 글에 올릴 수 있는 최대 사진 수
export const MAX_POST_IMAGES = 8;

// 압축 전 원본 한도 (바이트). 너무 큰 파일로 브라우저가 멈추는 걸 막습니다. 25MB.
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

// 압축 후 한 장당 최대 용량 (바이트). 5MB.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// 보관함 안 파일 "경로"를 실제 화면에서 보이는 공개 주소(URL)로 바꿔줍니다.
// 예) "유저id/사진.jpg" → "https://....supabase.co/storage/v1/object/public/post-images/유저id/사진.jpg"
// 이미 전체 주소(http...)가 들어오면 그대로 돌려줍니다(예전 데이터 호환).
export function postImageUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${POST_IMAGES_BUCKET}/${path}`;
}
