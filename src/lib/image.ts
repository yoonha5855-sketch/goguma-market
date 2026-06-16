// 브라우저에서 사진을 올리기 전에 '자동 압축'하는 도구입니다.
// 긴 변을 maxSize 픽셀로 줄이고, 화질 quality 의 JPEG 로 다시 저장해 용량을 낮춥니다.
// (브라우저 전용 — 클라이언트 컴포넌트에서만 호출하세요.)

// 다시 인코딩해도 안전한(애니메이션 아님) 형식만 압축합니다. gif 등은 원본 그대로 둡니다.
const COMPRESSIBLE = ["image/jpeg", "image/png", "image/webp"];

export async function compressImage(
  file: File,
  opts?: { maxSize?: number; quality?: number }
): Promise<File> {
  const maxSize = opts?.maxSize ?? 1600;
  const quality = opts?.quality ?? 0.82;

  if (!COMPRESSIBLE.includes(file.type)) return file;

  let bitmap: ImageBitmap;
  try {
    // 휴대폰 사진의 회전(EXIF) 정보를 반영해서 읽습니다.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // 못 읽으면 원본 사용
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }

  // 투명 부분이 검게 나오지 않도록 흰 배경을 먼저 깝니다.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close?.();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
  );
  if (!blob) return file;

  // 압축 결과가 원본보다 크면(이미 작은 사진 등) 원본을 그대로 씁니다.
  if (blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}
