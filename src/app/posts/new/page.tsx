import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPostForm } from "./new-post-form";

export default async function NewPostPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;

  // 로그인하지 않았으면 로그인 페이지로 보냅니다.
  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-skin-600">
        판매글 쓰기
      </h1>
      <NewPostForm />
    </div>
  );
}
