"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "@/app/auth/actions";
import { GogumaLogo } from "@/components/GogumaLogo";

const initialState: AuthState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <GogumaLogo size={56} />
        <h1 className="text-2xl font-extrabold text-skin-600">
          고구마마켓 시작하기
        </h1>
        <p className="text-sm text-goguma-700">
          이웃과 따뜻하게 거래하는 동네 중고마켓
        </p>
      </div>

      {state.message ? (
        // 가입 성공(이메일 인증 대기) 안내 화면
        <div className="rounded-2xl border border-goguma-200 bg-goguma-50 p-6 text-center">
          <p className="text-3xl">📬</p>
          <p className="mt-3 text-sm leading-relaxed text-goguma-800">
            {state.message}
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-xl bg-goguma-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-goguma-600"
          >
            로그인하러 가기
          </Link>
        </div>
      ) : (
        <>
          <form action={formAction} className="flex flex-col gap-4">
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
                placeholder="동네고구마"
                className="rounded-xl border border-goguma-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-goguma-400 focus:ring-2 focus:ring-goguma-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-goguma-800">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="goguma@example.com"
                className="rounded-xl border border-goguma-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-goguma-400 focus:ring-2 focus:ring-goguma-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-goguma-800">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="6자 이상"
                className="rounded-xl border border-goguma-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-goguma-400 focus:ring-2 focus:ring-goguma-200"
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
              {pending ? "가입 중..." : "가입하기"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-goguma-700">
            이미 회원이신가요?{" "}
            <Link href="/login" className="font-semibold text-skin-600 hover:underline">
              로그인
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
