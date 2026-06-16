"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import {
  POST_IMAGES_BUCKET,
  MAX_POST_IMAGES,
  MAX_UPLOAD_BYTES,
  MAX_IMAGE_BYTES,
  postImageUrl,
} from "@/lib/storage";

// 화면에서 다루는 사진 한 장의 정보
type Item = {
  path: string; // 보관함 안 파일 경로 (예: "유저id/abcd.jpg")
  isNew: boolean; // 이번에 새로 올린 사진인지 (취소 시 즉시 삭제 대상)
};

// 판매글 사진 업로더.
// - 글쓰기/수정 폼 안에 넣어서 사용합니다.
// - 선택한 사진들의 "경로"를 같은 이름(name)의 숨은 input 으로 폼에 함께 보냅니다.
//   서버 액션에서 formData.getAll(name) 으로 읽어갑니다.
// - 올리기 전에 자동으로 용량을 줄이고(압축), 썸네일을 끌어서 순서를 바꿀 수 있습니다.
export function ImageUploader({
  userId,
  name = "images",
  initialPaths = [],
}: {
  userId: string;
  name?: string;
  initialPaths?: string[];
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>(
    initialPaths.map((path) => ({ path, isNew: false }))
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    // 같은 파일을 다시 고를 수 있도록 input 값을 비웁니다.
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;

    setError(null);

    const room = MAX_POST_IMAGES - items.length;
    if (room <= 0) {
      setError(`사진은 최대 ${MAX_POST_IMAGES}장까지 올릴 수 있어요.`);
      return;
    }
    const targets = files.slice(0, room);
    if (files.length > room) {
      setError(`사진은 최대 ${MAX_POST_IMAGES}장까지라 ${room}장만 올렸어요.`);
    }

    setUploading(true);
    try {
      for (const file of targets) {
        if (!file.type.startsWith("image/")) {
          setError("이미지 파일만 올릴 수 있어요.");
          continue;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          setError("사진이 너무 커요(25MB 초과). 더 작은 사진을 올려 주세요.");
          continue;
        }

        // 올리기 전에 자동으로 용량 줄이기
        const compressed = await compressImage(file);

        if (compressed.size > MAX_IMAGE_BYTES) {
          setError("압축해도 용량이 커서(5MB 초과) 이 사진은 건너뛰었어요.");
          continue;
        }

        const ext = compressed.type === "image/jpeg" ? "jpg" : "png";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(POST_IMAGES_BUCKET)
          .upload(path, compressed, {
            contentType: compressed.type,
            upsert: false,
          });

        if (upErr) {
          setError("사진 올리기에 실패했어요: " + upErr.message);
          continue;
        }
        setItems((prev) => [...prev, { path, isNew: true }]);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(target: Item) {
    // 화면에서 먼저 제거
    setItems((prev) => prev.filter((it) => it.path !== target.path));
    // 이번 세션에 새로 올린 사진이면, 창고에서도 바로 지웁니다(찌꺼기 방지).
    // 기존에 저장돼 있던 사진은 여기서 지우지 않고, '저장'할 때 서버가 정리합니다.
    if (target.isNew) {
      await supabase.storage.from(POST_IMAGES_BUCKET).remove([target.path]);
    }
  }

  function makeCover(target: Item) {
    setItems((prev) => [
      target,
      ...prev.filter((it) => it.path !== target.path),
    ]);
  }

  // 드래그로 순서 바꾸기: from 위치의 사진을 to 위치로 옮깁니다.
  function reorder(from: number, to: number) {
    if (from === to) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-goguma-800">
        사진 · 최대 {MAX_POST_IMAGES}장 · 끌어서 순서 변경 (첫 장이 대표 사진)
      </span>

      {/* 숨은 input: 선택된 사진 경로들을 폼에 함께 전송 */}
      {items.map((it) => (
        <input key={it.path} type="hidden" name={name} value={it.path} />
      ))}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((it, idx) => (
          <div
            key={it.path}
            draggable
            onDragStart={() => setDragIndex(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) reorder(dragIndex, idx);
              setDragIndex(null);
            }}
            onDragEnd={() => setDragIndex(null)}
            className={`group relative aspect-square cursor-move overflow-hidden rounded-xl border bg-goguma-50 transition ${
              dragIndex === idx
                ? "border-goguma-400 opacity-40"
                : "border-goguma-200"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={postImageUrl(it.path)}
              alt=""
              draggable={false}
              className="h-full w-full select-none object-cover"
            />

            {idx === 0 && (
              <span className="absolute left-1 top-1 rounded-md bg-goguma-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                대표
              </span>
            )}

            {/* 삭제(X) 버튼 */}
            <button
              type="button"
              onClick={() => handleRemove(it)}
              aria-label="사진 삭제"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-sm text-white transition hover:bg-black/75"
            >
              ✕
            </button>

            {/* 대표로 만들기 (첫 장이 아닐 때만) */}
            {idx !== 0 && (
              <button
                type="button"
                onClick={() => makeCover(it)}
                className="absolute inset-x-1 bottom-1 rounded-md bg-white/85 py-0.5 text-[11px] font-medium text-goguma-700 opacity-0 transition group-hover:opacity-100"
              >
                대표로
              </button>
            )}
          </div>
        ))}

        {/* 추가 버튼 */}
        {items.length < MAX_POST_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-goguma-200 text-goguma-400 transition hover:border-goguma-400 hover:text-goguma-600 disabled:opacity-60"
          >
            <span className="text-2xl leading-none">＋</span>
            <span className="text-[11px]">
              {uploading ? "올리는 중…" : "사진 추가"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
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
