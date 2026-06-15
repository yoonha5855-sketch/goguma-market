"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
};

// Supabase 영문 에러 메시지를 한국어로 살짝 다듬어줍니다 (학습용 최소 매핑).
function toKorean(message: string): string {
  if (/Invalid login credentials/i.test(message))
    return "이메일 또는 비밀번호가 올바르지 않아요.";
  if (/Email not confirmed/i.test(message))
    return "이메일 인증이 아직 완료되지 않았어요. 메일함을 확인해 주세요.";
  if (/User already registered/i.test(message))
    return "이미 가입된 이메일이에요.";
  if (/Password should be at least/i.test(message))
    return "비밀번호는 6자 이상이어야 해요.";
  return message;
}

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: toKorean(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nickname = String(formData.get("nickname") ?? "").trim();

  if (!email || !password || !nickname) {
    return { error: "이메일, 비밀번호, 닉네임을 모두 입력해 주세요." };
  }
  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상으로 만들어 주세요." };
  }

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname }, // 트리거(handle_new_user)가 profiles.nickname 으로 저장합니다.
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    return { error: toKorean(error.message) };
  }

  // 이메일 인증이 켜져 있으면 session 이 없습니다 → 안내 메시지 노출.
  if (!data.session) {
    return {
      message:
        "가입 확인 메일을 보냈어요! 메일함에서 링크를 눌러 인증을 완료해 주세요.",
    };
  }

  // 이메일 인증이 꺼져 있으면 바로 로그인 상태가 됩니다.
  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
