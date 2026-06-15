"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { createComment } from "@/app/posts/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-xl bg-goguma-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-goguma-600 disabled:opacity-60"
    >
      {pending ? "등록 중..." : "등록"}
    </button>
  );
}

export function CommentForm({ postId }: { postId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createComment(postId, formData);
        formRef.current?.reset();
      }}
      className="flex items-end gap-2"
    >
      <textarea
        name="content"
        required
        rows={2}
        placeholder="사고 싶다면 댓글로 말 걸어보세요!"
        className="flex-1 resize-none rounded-xl border border-goguma-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-goguma-400 focus:ring-2 focus:ring-goguma-200"
      />
      <SubmitButton />
    </form>
  );
}
