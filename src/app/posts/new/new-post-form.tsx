"use client";

import { useActionState } from "react";
import { createPost, type PostState } from "@/app/posts/actions";
import { ImageUploader } from "@/app/posts/image-uploader";

const initialState: PostState = {};

export function NewPostForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(createPost, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ImageUploader userId={userId} />
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
          placeholder="예) 잘 익은 호박고구마 한 박스 팔아요"
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
          placeholder="0"
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
          placeholder="상품 상태, 거래 방법 등을 적어주세요."
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
        {pending ? "올리는 중..." : "판매글 올리기"}
      </button>
    </form>
  );
}
