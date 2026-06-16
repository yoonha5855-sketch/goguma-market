"use client";

import { useState, useTransition } from "react";
import { updatePostStatus } from "@/app/posts/actions";
import { POST_STATUSES, statusLabel } from "@/lib/post-status";

// 글 작성자에게만 보이는 거래 상태 변경 버튼 묶음.
// 3가지(거래가능/거래예약/거래종료) 중 하나를 눌러 즉시 바꿉니다.
export function StatusChanger({
  postId,
  current,
  size = "md",
}: {
  postId: string;
  current: string;
  size?: "sm" | "md";
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(status: string) {
    if (status === current || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await updatePostStatus(postId, status);
      if (res?.error) setError(res.error);
    });
  }

  const btnPad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1.5">
        {POST_STATUSES.map((s) => {
          const active = s === current;
          return (
            <button
              key={s}
              type="button"
              onClick={() => handleChange(s)}
              disabled={pending}
              aria-pressed={active}
              className={`rounded-full font-medium transition disabled:opacity-60 ${btnPad} ${
                active
                  ? "bg-goguma-500 text-white"
                  : "border border-goguma-200 text-goguma-700 hover:bg-goguma-100"
              }`}
            >
              {statusLabel(s)}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
