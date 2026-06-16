"use client";

import { useState } from "react";
import { postImageUrl } from "@/lib/storage";

// 판매글 상세의 사진 갤러리.
// 큰 사진 1장 + 아래 작은 썸네일들. 썸네일을 누르면 큰 사진이 바뀝니다.
export function PostGallery({ paths }: { paths: string[] }) {
  const [active, setActive] = useState(0);
  if (!paths || paths.length === 0) return null;

  const current = paths[Math.min(active, paths.length - 1)];

  return (
    <div className="mb-5 flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-goguma-100 bg-goguma-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={postImageUrl(current)}
          alt=""
          className="max-h-[28rem] w-full object-contain"
        />
      </div>

      {paths.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {paths.map((p, idx) => (
            <button
              key={p}
              type="button"
              onClick={() => setActive(idx)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                idx === active
                  ? "border-goguma-500"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={postImageUrl(p)}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
