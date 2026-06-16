import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, timeAgo } from "@/lib/format";
import { postImageUrl } from "@/lib/storage";
import { categoryLabel } from "@/lib/categories";
import { GogumaLogo } from "@/components/GogumaLogo";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusChanger } from "@/app/posts/status-changer";
import { POST_STATUSES, isPostStatus, statusLabel } from "@/lib/post-status";

type Profile = {
  id: string;
  nickname: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

type PostRow = {
  id: string;
  title: string;
  price: number;
  created_at: string;
  images: string[];
  category: string;
  status: string;
  likes: { count: number }[];
  comments: { count: number }[];
};

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status: statusParam } = await searchParams;
  // 정해진 상태일 때만 거름. 그 외(없음/이상값)는 전체 보기.
  const activeStatus =
    statusParam && isPostStatus(statusParam) ? statusParam : null;
  const supabase = await createClient();

  // 1) 프로필 정보 가져오기
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nickname, bio, avatar_url, created_at")
    .eq("id", id)
    .maybeSingle<Profile>();

  if (!profile) notFound();

  // 2) 이 사람이 올린 판매글 모두 가져오기 (최신순)
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, price, created_at, images, category, status, likes(count), comments(count)")
    .eq("author_id", id)
    .order("created_at", { ascending: false })
    .returns<PostRow[]>();

  // 3) 지금 보고 있는 사람이 이 프로필의 주인인지 확인 (본인이면 수정/상태변경 노출)
  const { data: claims } = await supabase.auth.getClaims();
  const viewerId = claims?.claims?.sub as string | undefined;
  const isOwner = viewerId === profile.id;

  const allPosts = posts ?? [];
  const postCount = allPosts.length;

  // 상태별 개수 (필터 탭에 표시)
  const countByStatus = (s: string) =>
    allPosts.filter((p) => p.status === s).length;

  // 화면에 보여줄 목록: 선택한 상태만 (없으면 전체)
  const shownPosts = activeStatus
    ? allPosts.filter((p) => p.status === activeStatus)
    : allPosts;

  // 필터 탭 목록: 전체 + 3개 상태
  const statusTabs: { label: string; value: string | null; count: number }[] = [
    { label: "전체", value: null, count: postCount },
    ...POST_STATUSES.map((s) => ({
      label: statusLabel(s),
      value: s,
      count: countByStatus(s),
    })),
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/posts"
        className="mb-4 inline-block text-sm text-goguma-600 hover:underline"
      >
        ← 판매글 목록
      </Link>

      {/* 프로필 카드 */}
      <section className="rounded-2xl border border-goguma-100 bg-white p-6">
        <div className="flex items-center gap-5">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-goguma-200 bg-goguma-50">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={postImageUrl(profile.avatar_url)}
                alt={`${profile.nickname ?? "사용자"}의 프로필 사진`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-4xl">🙂</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-extrabold text-goguma-900">
              {profile.nickname ?? "이름 없음"}
            </h1>
            <p className="mt-1 text-sm text-goguma-500">
              고구마마켓 가입 {timeAgo(profile.created_at)} · 판매글 {postCount}개
            </p>
          </div>

          {isOwner && (
            <Link
              href="/profile/edit"
              className="shrink-0 rounded-full bg-goguma-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-goguma-600"
            >
              수정하기
            </Link>
          )}
        </div>

        {/* 자기소개 */}
        <div className="mt-5 border-t border-goguma-100 pt-5">
          <h2 className="mb-2 text-sm font-bold text-skin-600">자기소개</h2>
          {profile.bio ? (
            <p className="whitespace-pre-wrap leading-relaxed text-goguma-800">
              {profile.bio}
            </p>
          ) : (
            <p className="text-sm text-goguma-400">
              {isOwner
                ? "아직 자기소개가 없어요. ‘수정하기’를 눌러 나를 소개해보세요!"
                : "아직 자기소개를 작성하지 않았어요."}
            </p>
          )}
        </div>
      </section>

      {/* 이 사람의 판매글 모아보기 */}
      <section className="mt-6">
        <h2 className="mb-3 font-bold text-skin-600">
          {profile.nickname ?? "이 사용자"} 님의 판매글 {postCount}
        </h2>

        {/* 거래 상태별 필터 탭 */}
        {postCount > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {statusTabs.map((tab) => {
              const isActive = (tab.value ?? null) === (activeStatus ?? null);
              const href = tab.value
                ? `/profile/${id}?status=${encodeURIComponent(tab.value)}`
                : `/profile/${id}`;
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
                  {tab.label} {tab.count}
                </Link>
              );
            })}
          </div>
        )}

        {postCount === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-goguma-200 py-12 text-center">
            <GogumaLogo size={40} />
            <p className="text-sm text-goguma-600">아직 올린 판매글이 없어요.</p>
          </div>
        ) : shownPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-goguma-200 py-12 text-center text-sm text-goguma-600">
            ‘{activeStatus}’ 상태인 판매글이 없어요.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {shownPosts.map((post) => (
              <li
                key={post.id}
                className="overflow-hidden rounded-2xl border border-goguma-100 bg-white transition hover:border-goguma-300 hover:shadow-sm"
              >
                <Link href={`/posts/${post.id}`} className="flex gap-4 p-4">
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
                      <h3 className="truncate text-lg font-bold text-goguma-900">
                        {post.title}
                      </h3>
                      <span className="shrink-0 font-bold text-goguma-600">
                        {formatPrice(post.price)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={post.status} size="sm" />
                      <span className="rounded-full bg-goguma-100 px-2 py-0.5 text-[11px] font-semibold text-goguma-700">
                        {categoryLabel(post.category)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-goguma-500">
                      <span>{timeAgo(post.created_at)}</span>
                      <span className="ml-auto flex items-center gap-3">
                        <span>❤️ {post.likes?.[0]?.count ?? 0}</span>
                        <span>💬 {post.comments?.[0]?.count ?? 0}</span>
                      </span>
                    </div>
                  </div>
                </Link>

                {/* 본인 프로필이면: 이 글의 거래 상태를 바로 바꿀 수 있어요 */}
                {isOwner && (
                  <div className="border-t border-goguma-100 px-4 py-3">
                    <p className="mb-1.5 text-xs font-semibold text-goguma-500">
                      거래 상태 바꾸기
                    </p>
                    <StatusChanger
                      postId={post.id}
                      current={post.status}
                      size="sm"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
