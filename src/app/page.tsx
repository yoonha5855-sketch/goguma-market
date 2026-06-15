import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GogumaLogo } from "@/components/GogumaLogo";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;

  let nickname: string | null = null;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", userId)
      .single();
    nickname = profile?.nickname ?? null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <section className="flex flex-col items-center gap-5 text-center">
        <GogumaLogo size={72} />
        <h1 className="text-3xl font-extrabold leading-tight text-skin-600 sm:text-4xl">
          우리 동네 중고거래,
          <br />
          따뜻한 <span className="text-goguma-500">고구마마켓</span>
        </h1>
        <p className="max-w-md text-goguma-700">
          이웃과 따뜻하게 사고파는 동네 중고마켓이에요. 믿을 수 있는 거래를
          고구마마켓에서 시작해 보세요.
        </p>

        {userId ? (
          <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-goguma-200 bg-goguma-50 px-6 py-5">
            <p className="text-goguma-800">
              <b className="text-skin-600">{nickname}</b> 님, 환영해요! 🍠
            </p>
            <div className="flex gap-3">
              <Link
                href="/posts"
                className="rounded-full border border-goguma-300 px-5 py-2.5 text-sm font-semibold text-goguma-700 transition hover:bg-goguma-100"
              >
                판매글 둘러보기
              </Link>
              <Link
                href="/posts/new"
                className="rounded-full bg-goguma-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-goguma-600"
              >
                ✏️ 글쓰기
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="flex gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-goguma-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-goguma-600"
              >
                회원가입
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-goguma-300 px-6 py-3 text-sm font-semibold text-goguma-700 transition hover:bg-goguma-100"
              >
                로그인
              </Link>
            </div>
            <Link
              href="/posts"
              className="text-sm font-medium text-skin-600 hover:underline"
            >
              먼저 판매글 둘러보기 →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
