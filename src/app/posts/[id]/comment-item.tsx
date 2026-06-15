"use client";

import { useState, useTransition } from "react";
import { updateComment, deleteComment } from "@/app/posts/actions";
import { timeAgo } from "@/lib/format";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  author: { nickname: string } | null;
};

export function CommentItem({
  comment,
  postId,
  canModify,
}: {
  comment: Comment;
  postId: string;
  canModify: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <li className="rounded-xl border border-goguma-100 bg-white p-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-skin-500">
          {comment.author?.nickname ?? "알 수 없음"}
        </span>
        <span className="text-xs text-goguma-400">
          {timeAgo(comment.created_at)}
        </span>
        {canModify && !editing && (
          <span className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-goguma-400 transition hover:text-goguma-700"
            >
              수정
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("댓글을 삭제할까요?")) return;
                startTransition(async () => {
                  await deleteComment(comment.id, postId);
                });
              }}
              className="text-xs text-goguma-400 transition hover:text-red-500 disabled:opacity-60"
            >
              삭제
            </button>
          </span>
        )}
      </div>

      {editing ? (
        <form
          action={async (formData) => {
            await updateComment(comment.id, postId, formData);
            setEditing(false);
          }}
          className="mt-2 flex flex-col gap-2"
        >
          <textarea
            name="content"
            required
            rows={2}
            defaultValue={comment.content}
            className="resize-none rounded-lg border border-goguma-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-goguma-400 focus:ring-2 focus:ring-goguma-200"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-goguma-600 hover:bg-goguma-100"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-lg bg-goguma-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-goguma-600"
            >
              저장
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm text-goguma-800">
          {comment.content}
        </p>
      )}
    </li>
  );
}
