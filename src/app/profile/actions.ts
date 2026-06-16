"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { POST_IMAGES_BUCKET } from "@/lib/storage";

export type ProfileState = { error?: string };

// 현재 로그인한 사용자 id를 돌려줍니다 (없으면 null).
async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

// 폼에서 넘어온 프로필 사진 "경로"를 안전하게 읽어옵니다.
// - 본인 폴더("userId/...")로 시작하는 것만 인정 (남의 사진 끼워넣기 방지)
// - 비어 있으면 null (사진 없음)
function readAvatarPath(formData: FormData, userId: string): string | null {
  const path = String(formData.get("avatar") ?? "").trim();
  if (!path) return null;
  if (!path.startsWith(`${userId}/`)) return null;
  return path;
}

// 프로필 수정 (자기소개·닉네임·프로필 사진 저장)
// CRUD 의 'Update' 에 해당합니다. (행 자체는 가입 때 자동으로 만들어져 있어요)
export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return { error: "로그인이 필요해요." };

  const nickname = String(formData.get("nickname") ?? "").trim();
  const bioRaw = String(formData.get("bio") ?? "").trim();
  const bio = bioRaw || null; // 비워두면 자기소개 없음(null)
  const avatar = readAvatarPath(formData, userId);

  if (!nickname) return { error: "닉네임을 입력해 주세요." };
  if (nickname.length > 20) return { error: "닉네임은 20자 이하로 적어 주세요." };
  if (bio && bio.length > 500)
    return { error: "자기소개는 500자 이하로 적어 주세요." };

  // 바뀌기 전 프로필 사진을 확인해 둡니다 (사진이 바뀌면 옛 사진 정리용).
  const { data: before } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .maybeSingle<{ avatar_url: string | null }>();

  // RLS 덕분에 본인 프로필만 수정됩니다.
  const { error } = await supabase
    .from("profiles")
    .update({ nickname, bio, avatar_url: avatar, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: "저장에 실패했어요: " + error.message };

  // 사진이 바뀌었거나 지워졌으면, 더 이상 쓰지 않는 옛 사진을 보관함에서 정리합니다.
  // (전체 주소(http)로 저장된 옛 데이터는 건드리지 않습니다.)
  const old = before?.avatar_url ?? null;
  if (old && old !== avatar && !old.startsWith("http")) {
    await supabase.storage.from(POST_IMAGES_BUCKET).remove([old]);
  }

  revalidatePath("/profile");
  revalidatePath(`/profile/${userId}`);
  revalidatePath("/", "layout"); // 헤더의 닉네임도 갱신
  redirect(`/profile/${userId}`);
}
