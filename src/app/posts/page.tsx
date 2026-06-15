import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, timeAgo } from "@/lib/format";
import { GogumaLogo } from "@/components/GogumaLogo";

type PostRow = {
  id: string;
  title: string;
  price: number;
  content: string;
  created_at: string;
  author: { nickname: string } | null;
  likes: { count: number }[];
  comments: { count: number }[];
};

export default async function PostsPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select(
      "id, title, price, content, created_at, author:profiles!posts_author_id_fkey(nickname), likes(count), comments(count)"
    )
    .order("created_at", { ascending: false })
    .returns<PostRow[]>();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-skin-600">판매글</h1>
        <Link
          href="/posts/new"
          className="rounded-full bg-goguma-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-goguma-600"
        >
          ✏️ 글쓰기
        </Link>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-goguma-200 py-16 text-center">
          <GogumaLogo size={48} />
          <p className="text-goguma-700">아직 올라온 판매글이 없어요.</p>
          <Link
            href="/posts/new"
            className="font-semibold text-skin-600 hover:underline"
          >
            첫 판매글을 올려보세요!
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/posts/${post.id}`}
                className="block rounded-2xl border border-goguma-100 bg-white p-4 transition hover:border-goguma-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-goguma-900">
                    {post.title}
                  </h2>
                  <span className="shrink-0 font-bold text-goguma-600">
                    {formatPrice(post.price)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-goguma-700">
                  {post.content}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-goguma-500">
                  <span className="font-medium text-skin-500">
                    {post.author?.nickname ?? "알 수 없음"}
                  </span>
                  <span>· {timeAgo(post.created_at)}</span>
                  <span className="ml-auto flex items-center gap-3">
                    <span>❤️ {post.likes?.[0]?.count ?? 0}</span>
                    <span>💬 {post.comments?.[0]?.count ?? 0}</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
