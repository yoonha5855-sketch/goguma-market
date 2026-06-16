"use client";

import { useActionState } from "react";
import { ImageUploader } from "@/app/posts/image-uploader";
import { CategorySelect } from "@/app/posts/category-select";
import { updatePostImages, type PostState } from "@/app/posts/actions";

const initialState: PostState = {};

// 사진·카테고리만 바꾸는 폼 (댓글이 있어 글 내용은 수정할 수 없을 때 사용).
export function ImagesOnlyForm({
  postId,
  userId,
  initialPaths,
  defaultCategory,
}: {
  postId: string;
  userId: string;
  initialPaths: string[];
  defaultCategory: string;
}) {
  const action = updatePostImages.bind(null, postId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ImageUploader userId={userId} initialPaths={initialPaths} />
      <CategorySelect defaultValue={defaultCategory} />

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-xl bg-goguma-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-goguma-600 disabled:opacity-60"
      >
        {pending ? "저장 중…" : "사진·카테고리 저장"}
      </button>
    </form>
  );
}
