import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { postImageUrl } from "@/lib/storage";
import { GogumaLogo } from "./GogumaLogo";

// 서버 컴포넌트: 현재 로그인 상태를 읽어 헤더를 그립니다.
export async function Header() {
  const supabase = await createClient();

  // getClaims()는 JWT를 검증한 뒤 클레임을 돌려줍니다 (서버에서 신뢰 가능).
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;

  let nickname: string | null = null;
  let avatarUrl: string | null = null;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname, avatar_url")
      .eq("id", userId)
      .single();
    nickname = profile?.nickname ?? null;
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-goguma-100 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <GogumaLogo size={28} />
            <span className="text-lg font-extrabold tracking-tight text-skin-600">
              고구마마켓
            </span>
          </Link>
          <Link
            href="/posts"
            className="text-sm font-medium text-goguma-700 transition-colors hover:text-goguma-900"
          >
            판매글
          </Link>
        </div>

        {userId ? (
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm text-goguma-800 transition hover:bg-goguma-100"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-goguma-200 bg-goguma-50 text-sm">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={postImageUrl(avatarUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "🙂"
                )}
              </span>
              <span>
                <b className="font-semibold text-skin-600">{nickname}</b> 님
              </span>
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-goguma-200 px-3 py-1.5 text-sm font-medium text-goguma-700 transition-colors hover:bg-goguma-100"
              >
                로그아웃
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-goguma-700 transition-colors hover:bg-goguma-100"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-goguma-500 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-goguma-600"
            >
              회원가입
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
