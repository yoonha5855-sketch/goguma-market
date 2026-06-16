"use client";

import { useRef, useState, useTransition } from "react";
import {
  createComment,
  updateComment,
  deleteComment,
} from "@/app/posts/actions";
import { timeAgo } from "@/lib/format";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  author: { nickname: string } | null;
};

// 한 댓글 아래 달린 답글 하나의 정보
export type Reply = {
  comment: Comment;
  canModify: boolean;
};

export function CommentItem({
  comment,
  postId,
  canModify,
  canReply = false,
  replies = [],
  isReply = false,
}: {
  comment: Comment;
  postId: string;
  canModify: boolean;
  canReply?: boolean; // 답글 버튼 표시 여부 (로그인 + 최상위 댓글일 때)
  replies?: Reply[]; // 이 댓글에 달린 답글들
  isReply?: boolean; // 답글이면 들여쓰기 스타일, 답글 버튼 없음
}) {
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [pending, startTransition] = useTransition();
  const replyRef = useRef<HTMLFormElement>(null);

  return (
    <li
      className={
        isReply
          ? "rounded-xl border border-goguma-100 bg-goguma-50/60 p-3"
          : "rounded-xl border border-goguma-100 bg-white p-4"
      }
    >
      <div className="flex items-center gap-2 text-sm">
        {isReply && <span className="text-goguma-300">↳</span>}
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

      {/* 답글 버튼 (최상위 댓글 + 로그인 상태에서만) */}
      {canReply && !isReply && !editing && (
        <button
          type="button"
          onClick={() => setReplying((v) => !v)}
          className="mt-2 text-xs font-medium text-goguma-500 transition hover:text-goguma-700"
        >
          {replying ? "답글 닫기" : "💬 답글"}
        </button>
      )}

      {/* 답글 목록 (있으면 들여쓰기로 표시) */}
      {replies.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2 border-l-2 border-goguma-100 pl-3">
          {replies.map((r) => (
            <CommentItem
              key={r.comment.id}
              comment={r.comment}
              postId={postId}
              canModify={r.canModify}
              isReply
            />
          ))}
        </ul>
      )}

      {/* 답글 입력 폼 */}
      {replying && (
        <form
          ref={replyRef}
          action={async (formData) => {
            await createComment(postId, formData);
            replyRef.current?.reset();
            setReplying(false);
          }}
          className="mt-3 flex flex-col gap-2"
        >
          <input type="hidden" name="parent_id" value={comment.id} />
          <textarea
            name="content"
            required
            rows={2}
            placeholder="답글을 입력하세요"
            className="resize-none rounded-lg border border-goguma-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-goguma-400 focus:ring-2 focus:ring-goguma-200"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReplying(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-goguma-600 hover:bg-goguma-100"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-lg bg-goguma-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-goguma-600"
            >
              답글 등록
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
