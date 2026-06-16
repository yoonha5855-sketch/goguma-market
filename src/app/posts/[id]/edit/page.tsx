import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditPostForm } from "./edit-post-form";
import { ImagesOnlyForm } from "./images-only-form";

type PostEdit = {
  id: string;
  author_id: string;
  title: string;
  price: number;
  content: string;
  images: string[];
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
    .select("id, author_id, title, price, content, images")
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

  // 댓글이 있으면 글 내용(제목·내용·가격)은 수정할 수 없지만, 사진은 바꿀 수 있어요.
  if ((count ?? 0) > 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Link
          href={`/posts/${id}`}
          className="mb-4 inline-block text-sm text-goguma-600 hover:underline"
        >
          ← 글로 돌아가기
        </Link>
        <h1 className="mb-2 text-2xl font-extrabold text-skin-600">
          사진 수정
        </h1>
        <p className="mb-6 rounded-xl bg-goguma-50 px-4 py-3 text-sm text-goguma-700">
          💬 댓글이 달린 글이라 <b>제목·내용·가격은 바꿀 수 없어요.</b> 사진은
          자유롭게 추가하거나 지울 수 있어요.
        </p>
        <ImagesOnlyForm
          postId={post.id}
          userId={userId}
          initialPaths={post.images ?? []}
        />
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
        userId={userId}
        defaultTitle={post.title}
        defaultPrice={post.price}
        defaultContent={post.content}
        defaultImages={post.images ?? []}
      />
    </div>
  );
}
