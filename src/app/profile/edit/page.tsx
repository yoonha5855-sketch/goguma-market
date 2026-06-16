import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "./edit-profile-form";

// 내 프로필 수정 페이지 (로그인 필요)
export default async function EditProfilePage() {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, bio, avatar_url")
    .eq("id", userId)
    .maybeSingle<{
      nickname: string | null;
      bio: string | null;
      avatar_url: string | null;
    }>();

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link
        href={`/profile/${userId}`}
        className="mb-4 inline-block text-sm text-goguma-600 hover:underline"
      >
        ← 내 프로필
      </Link>

      <h1 className="mb-6 text-2xl font-extrabold text-skin-600">
        프로필 수정
      </h1>

      <EditProfileForm
        userId={userId}
        defaultNickname={profile?.nickname ?? ""}
        defaultBio={profile?.bio ?? ""}
        defaultAvatar={profile?.avatar_url ?? null}
      />
    </div>
  );
}
