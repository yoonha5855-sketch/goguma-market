"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import {
  POST_IMAGES_BUCKET,
  MAX_UPLOAD_BYTES,
  MAX_IMAGE_BYTES,
  postImageUrl,
} from "@/lib/storage";

// 프로필 사진 업로더 (한 장만).
// - 고른 사진의 "경로"를 숨은 input(name="avatar")으로 폼에 함께 보냅니다.
// - 올리기 전에 자동으로 용량을 줄입니다(압축).
export function AvatarUploader({
  userId,
  initialPath = null,
}: {
  userId: string;
  initialPath?: string | null;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState<string | null>(initialPath);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // 같은 파일을 다시 고를 수 있도록 input 값을 비웁니다.
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 올릴 수 있어요.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("사진이 너무 커요(25MB 초과). 더 작은 사진을 올려 주세요.");
      return;
    }

    setUploading(true);
    try {
      // 프로필 사진은 작아도 되니 더 작게(512px) 압축합니다.
      const compressed = await compressImage(file, { maxSize: 512 });

      if (compressed.size > MAX_IMAGE_BYTES) {
        setError("압축해도 용량이 커서(5MB 초과) 올리지 못했어요.");
        return;
      }

      const ext = compressed.type === "image/jpeg" ? "jpg" : "png";
      const newPath = `${userId}/avatar-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(POST_IMAGES_BUCKET)
        .upload(newPath, compressed, {
          contentType: compressed.type,
          upsert: false,
        });

      if (upErr) {
        setError("사진 올리기에 실패했어요: " + upErr.message);
        return;
      }

      // 이번에 새로 올리기 직전 화면에 있던 사진이 '방금 올린' 임시 사진이면 창고에서 정리.
      // (기존에 저장돼 있던 사진은 '저장'할 때 서버가 정리합니다.)
      if (path && path !== initialPath) {
        await supabase.storage.from(POST_IMAGES_BUCKET).remove([path]);
      }
      setPath(newPath);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    // 방금 올린 임시 사진이면 창고에서도 바로 지웁니다.
    if (path && path !== initialPath) {
      await supabase.storage.from(POST_IMAGES_BUCKET).remove([path]);
    }
    setPath(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-goguma-800">프로필 사진</span>

      {/* 숨은 input: 선택된 사진 경로를 폼에 함께 전송 (없으면 빈 값) */}
      <input type="hidden" name="avatar" value={path ?? ""} />

      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-goguma-200 bg-goguma-50">
          {path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={postImageUrl(path)}
              alt="프로필 사진 미리보기"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-3xl">🙂</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-xl border border-goguma-300 px-3 py-1.5 text-sm font-medium text-goguma-700 transition hover:bg-goguma-100 disabled:opacity-60"
          >
            {uploading ? "올리는 중…" : path ? "사진 바꾸기" : "사진 올리기"}
          </button>
          {path && (
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-xl px-3 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
            >
              사진 지우기
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
        className="hidden"
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
