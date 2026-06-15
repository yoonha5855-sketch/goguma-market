"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "@/app/auth/actions";
import { GogumaLogo } from "@/components/GogumaLogo";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <GogumaLogo size={56} />
        <h1 className="text-2xl font-extrabold text-skin-600">
          다시 오셨네요!
        </h1>
        <p className="text-sm text-goguma-700">
          고구마마켓에 로그인하고 거래를 시작해요.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
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
            autoComplete="current-password"
            required
            placeholder="••••••••"
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
          {pending ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-goguma-700">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="font-semibold text-skin-600 hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
