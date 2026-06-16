"use client";

import { useActionState } from "react";
import { updatePost, type PostState } from "@/app/posts/actions";
import { ImageUploader } from "@/app/posts/image-uploader";

const initialState: PostState = {};

export function EditPostForm({
  postId,
  userId,
  defaultTitle,
  defaultPrice,
  defaultContent,
  defaultImages,
}: {
  postId: string;
  userId: string;
  defaultTitle: string;
  defaultPrice: number;
  defaultContent: string;
  defaultImages: string[];
}) {
  // postId 를 묶어 (prevState, formData) 형태로 맞춥니다.
  const action = updatePost.bind(null, postId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ImageUploader userId={userId} initialPaths={defaultImages} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-goguma-800">
          제목
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={60}
          defaultValue={defaultTitle}
          className="rounded-xl border border-goguma-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-goguma-400 focus:ring-2 focus:ring-goguma-200"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="price" className="text-sm font-medium text-goguma-800">
          가격 (원) · 비워두면 나눔
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min={0}
          defaultValue={defaultPrice > 0 ? defaultPrice : ""}
          className="rounded-xl border border-goguma-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-goguma-400 focus:ring-2 focus:ring-goguma-200"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium text-goguma-800">
          내용
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={8}
          defaultValue={defaultContent}
          className="resize-none rounded-xl border border-goguma-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-goguma-400 focus:ring-2 focus:ring-goguma-200"
        />
      </div>

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
        {pending ? "수정 중..." : "수정 완료"}
      </button>
    </form>
  );
}
