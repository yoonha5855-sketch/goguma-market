import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, timeAgo } from "@/lib/format";
import { postImageUrl } from "@/lib/storage";
import {
  POST_CATEGORIES,
  categoryLabel,
  isPostCategory,
} from "@/lib/categories";
import { GogumaLogo } from "@/components/GogumaLogo";

type PostRow = {
  id: string;
  title: string;
  price: number;
  content: string;
  created_at: string;
  images: string[];
  category: string;
  author: { nickname: string } | null;
  likes: { count: number }[];
  comments: { count: number }[];
};

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  // 정해진 카테고리일 때만 거름. 그 외(없음/이상값)는 전체 보기.
  const activeCategory = category && isPostCategory(category) ? category : null;

  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(
      "id, title, price, content, created_at, images, category, author:profiles!posts_author_id_fkey(nickname), likes(count), comments(count)"
    )
    .order("created_at", { ascending: false });

  if (activeCategory) {
    query = query.eq("category", activeCategory);
  }

  const { data: posts } = await query.returns<PostRow[]>();

  // 필터 탭 목록: 전체 + 5개 카테고리
  const tabs: { label: string; value: string | null }[] = [
    { label: "전체", value: null },
    ...POST_CATEGORIES.map((c) => ({ label: categoryLabel(c), value: c })),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-skin-600">판매글</h1>
        <Link
          href="/posts/new"
          className="rounded-full bg-goguma-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-goguma-600"
        >
          ✏️ 글쓰기
        </Link>
      </div>

      {/* 카테고리 필터 탭 */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive =
            (tab.value ?? null) === (activeCategory ?? null);
          const href = tab.value
            ? `/posts?category=${encodeURIComponent(tab.value)}`
            : "/posts";
          return (
            <Link
              key={tab.label}
              href={href}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-goguma-500 text-white"
                  : "border border-goguma-200 text-goguma-700 hover:bg-goguma-100"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {!posts || posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-goguma-200 py-16 text-center">
          <GogumaLogo size={48} />
          <p className="text-goguma-700">
            {activeCategory
              ? `'${categoryLabel(activeCategory)}' 카테고리에 글이 아직 없어요.`
              : "아직 올라온 판매글이 없어요."}
          </p>
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
                className="flex gap-4 rounded-2xl border border-goguma-100 bg-white p-4 transition hover:border-goguma-300 hover:shadow-sm"
              >
                {/* 대표 사진 썸네일 (없으면 고구마 로고 자리표시) */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-goguma-50">
                  {post.images && post.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={postImageUrl(post.images[0])}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <GogumaLogo size={32} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="truncate text-lg font-bold text-goguma-900">
                      {post.title}
                    </h2>
                    <span className="shrink-0 font-bold text-goguma-600">
                      {formatPrice(post.price)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="shrink-0 rounded-full bg-goguma-100 px-2 py-0.5 text-[11px] font-semibold text-goguma-700">
                      {categoryLabel(post.category)}
                    </span>
                    <p className="line-clamp-1 text-sm text-goguma-700">
                      {post.content}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-goguma-500">
                    <span className="font-medium text-skin-500">
                      {post.author?.nickname ?? "알 수 없음"}
                    </span>
                    <span>· {timeAgo(post.created_at)}</span>
                    <span className="ml-auto flex items-center gap-3">
                      {post.images && post.images.length > 1 && (
                        <span>🖼 {post.images.length}</span>
                      )}
                      <span>❤️ {post.likes?.[0]?.count ?? 0}</span>
                      <span>💬 {post.comments?.[0]?.count ?? 0}</span>
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
