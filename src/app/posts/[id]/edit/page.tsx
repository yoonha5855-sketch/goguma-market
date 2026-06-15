import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditPostForm } from "./edit-post-form";

type PostEdit = {
  id: string;
  author_id: string;
  title: string;
  price: number;
  content: string;
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 로그인 확인
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) redirect("/login");

  // 글 가져오기
  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id, title, price, content")
    .eq("id", id)
    .maybeSingle<PostEdit>();

  if (!post) notFound();

  // 작성자가 아니면 상세로 돌려보냅니다.
  if (post.author_id !== userId) {
    redirect(`/posts/${id}`);
  }

  // 댓글이 있으면 수정 불가 — 안내 화면
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", id);

  if ((count ?? 0) > 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="text-3xl">🔒</p>
        <p className="mt-3 text-goguma-800">
          댓글이 있는 글은 수정할 수 없어요.
          <br />
          댓글을 모두 삭제한 뒤 다시 시도해 주세요.
        </p>
        <Link
          href={`/posts/${id}`}
          className="mt-5 inline-block rounded-xl bg-goguma-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-goguma-600"
        >
          글로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link
        href={`/posts/${id}`}
        className="mb-4 inline-block text-sm text-goguma-600 hover:underline"
      >
        ← 글로 돌아가기
      </Link>
      <h1 className="mb-6 text-2xl font-extrabold text-skin-600">판매글 수정</h1>
      <EditPostForm
        postId={post.id}
        defaultTitle={post.title}
        defaultPrice={post.price}
        defaultContent={post.content}
      />
    </div>
  );
}
