"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateProfile, type ProfileState } from "@/app/profile/actions";
import { AvatarUploader } from "@/app/profile/avatar-uploader";

const initialState: ProfileState = {};

export function EditProfileForm({
  userId,
  defaultNickname,
  defaultBio,
  defaultAvatar,
}: {
  userId: string;
  defaultNickname: string;
  defaultBio: string;
  defaultAvatar: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <AvatarUploader userId={userId} initialPath={defaultAvatar} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nickname" className="text-sm font-medium text-goguma-800">
          닉네임
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          required
          maxLength={20}
          defaultValue={defaultNickname}
          placeholder="고구마러버"
          className="rounded-xl border border-goguma-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-goguma-400 focus:ring-2 focus:ring-goguma-200"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-sm font-medium text-goguma-800">
          자기소개 · 비워두면 표시되지 않아요
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={5}
          maxLength={500}
          defaultValue={defaultBio}
          placeholder="안녕하세요! 어떤 물건을 주로 거래하는지, 어떤 사람인지 자유롭게 적어보세요."
          className="resize-none rounded-xl border border-goguma-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-goguma-400 focus:ring-2 focus:ring-goguma-200"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="mt-1 flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-goguma-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-goguma-600 disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장하기"}
        </button>
        <Link
          href={`/profile/${userId}`}
          className="rounded-xl border border-goguma-200 px-4 py-3 text-sm font-medium text-goguma-700 transition hover:bg-goguma-100"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
