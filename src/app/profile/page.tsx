import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// '/profile' 로 오면 내 프로필(/profile/내id)로 보내줍니다. 로그인 안 했으면 로그인으로.
export default async function MyProfileRedirect() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;

  if (!userId) redirect("/login");
  redirect(`/profile/${userId}`);
}
