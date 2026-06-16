import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, timeAgo } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { toggleLike } from "@/app/posts/actions";
import { CommentForm } from "./comment-form";
import { PostOwnerActions } from "./post-owner-actions";
import { CommentItem } from "./comment-item";
import { PostGallery } from "./post-gallery";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusChanger } from "@/app/posts/status-changer";

type PostDetail = {
  id: string;
  author_id: string;
  title: string;
  price: number;
  content: string;
  created_at: string;
  images: string[];
  category: string;
  status: string;
  author: { nickname: string } | null;
  likes: { count: number }[];
  comments: { count: number }[];
};

type CommentRow = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  author: { nickname: string } | null;
};

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, author_id, title, price, content, created_at, images, category, status, author:profiles!posts_author_id_fkey(nickname), likes(count), comments(count)"
    )
    .eq("id", id)
    .maybeSingle<PostDetail>();

  if (!post) notFound();

  const { data: comments } = await supabase
    .from("comments")
    .select(
      "id, author_id, content, created_at, parent_id, author:profiles(nickname)"
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true })
    .returns<CommentRow[]>();

  // 현재 사용자가 이 글을 좋아요 했는지 확인
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  let liked = false;
  if (userId) {
    const { data: myLike } = await supabase
      .from("likes")
      .select("post_id")
      .eq("post_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    liked = !!myLike;
  }

  const likeCount = post.likes?.[0]?.count ?? 0;
  const commentCount = post.comments?.[0]?.count ?? 0;
  const isAuthor = userId === post.author_id;

  // 댓글을 '최상위 댓글'과 그 아래 '답글'로 묶습니다.
  const allComments = comments ?? [];
  const roots = allComments.filter((c) => !c.parent_id);
  const repliesByParent = new Map<string, CommentRow[]>();
  for (const c of allComments) {
    if (c.parent_id) {
      const list = repliesByParent.get(c.parent_id) ?? [];
      list.push(c);
      repliesByParent.set(c.parent_id, list);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/posts"
        className="mb-4 inline-block text-sm text-goguma-600 hover:underline"
      >
        ← 판매글 목록
      </Link>

      {/* 글 본문 */}
      <article className="rounded-2xl border border-goguma-100 bg-white p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={post.status} />
          <Link
            href={`/posts?category=${encodeURIComponent(post.category)}`}
            className="inline-block rounded-full bg-goguma-100 px-3 py-1 text-xs font-semibold text-goguma-700 transition hover:bg-goguma-200"
          >
            {categoryLabel(post.category)}
          </Link>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-goguma-900">
          {post.title}
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-goguma-500">
          <Link
            href={`/profile/${post.author_id}`}
            className="font-medium text-skin-500 hover:underline"
          >
            {post.author?.nickname ?? "알 수 없음"}
          </Link>
          <span>· {timeAgo(post.created_at)}</span>
        </div>
        <p className="mt-4 text-2xl font-bold text-goguma-600">
          {formatPrice(post.price)}
        </p>

        {/* 작성자에게만: 거래 상태 바꾸기 */}
        {isAuthor && (
          <div className="mt-4 rounded-xl bg-goguma-50 p-3">
            <p className="mb-2 text-xs font-semibold text-goguma-600">
              거래 상태 바꾸기
            </p>
            <StatusChanger postId={post.id} current={post.status} />
          </div>
        )}

        {/* 사진 갤러리 (사진이 있을 때만) */}
        {post.images && post.images.length > 0 && (
          <div className="mt-5">
            <PostGallery paths={post.images} />
          </div>
        )}

        <p className="mt-4 whitespace-pre-wrap leading-relaxed text-goguma-800">
          {post.content}
        </p>

        {/* 좋아요(호감도) + 작성자라면 글 삭제 */}
        <div className="mt-6 flex items-start justify-between gap-3">
          <form action={toggleLike.bind(null, post.id)}>
            <button
              type="submit"
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                liked
                  ? "bg-goguma-500 text-white hover:bg-goguma-600"
                  : "border border-goguma-300 text-goguma-700 hover:bg-goguma-100"
              }`}
            >
              <span>{liked ? "❤️" : "🤍"}</span>
              <span>호감 {likeCount}</span>
            </button>
          </form>

          {isAuthor && (
            <PostOwnerActions postId={post.id} commentCount={commentCount} />
          )}
        </div>
      </article>

      {/* 댓글 */}
      <section className="mt-6">
        <h2 className="mb-3 font-bold text-skin-600">댓글 {commentCount}</h2>

        {userId ? (
          <div className="mb-5">
            <CommentForm postId={post.id} />
          </div>
        ) : (
          <p className="mb-5 rounded-xl bg-goguma-50 px-4 py-3 text-sm text-goguma-700">
            댓글을 쓰려면{" "}
            <Link href="/login" className="font-semibold text-skin-600 hover:underline">
              로그인
            </Link>
            이 필요해요.
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {roots.length > 0 ? (
            roots.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                postId={post.id}
                canModify={userId === c.author_id}
                canReply={!!userId}
                replies={(repliesByParent.get(c.id) ?? []).map((r) => ({
                  comment: r,
                  canModify: userId === r.author_id,
                }))}
              />
            ))
          ) : (
            <li className="py-6 text-center text-sm text-goguma-500">
              아직 댓글이 없어요. 첫 댓글을 남겨보세요!
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
