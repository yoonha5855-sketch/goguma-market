"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/app/posts/actions";

// 글 작성자에게만 보이는 수정/삭제 버튼.
// 두 동작 모두 댓글이 있으면 막고 같은 안내를 보여줍니다.
export function PostOwnerActions({
  postId,
  commentCount,
}: {
  postId: string;
  commentCount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleEdit() {
    setError(null);
    if (commentCount > 0) {
      setError(
        "댓글이 있는 글은 수정할 수 없어요. 댓글을 모두 삭제한 뒤 다시 시도해 주세요."
      );
      return;
    }
    router.push(`/posts/${postId}/edit`);
  }

  function handleDelete() {
    setError(null);
    if (commentCount > 0) {
      setError(
        "댓글이 있는 글은 삭제할 수 없어요. 댓글을 모두 삭제한 뒤 다시 시도해 주세요."
      );
      return;
    }
    if (!window.confirm("이 판매글을 삭제할까요? 되돌릴 수 없어요.")) return;
    startTransition(async () => {
      const res = await deletePost(postId);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleEdit}
          disabled={pending}
          className="rounded-full border border-goguma-300 px-4 py-2 text-sm font-medium text-goguma-700 transition hover:bg-goguma-100 disabled:opacity-60"
        >
          수정
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-60"
        >
          {pending ? "삭제 중..." : "삭제"}
        </button>
      </div>
      {error && (
        <p className="max-w-[16rem] text-right text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
