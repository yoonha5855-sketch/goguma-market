"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PostState = { error?: string };

// 현재 로그인한 사용자 id를 돌려줍니다 (없으면 null).
async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

// 판매글 작성
export async function createPost(
  _prev: PostState,
  formData: FormData
): Promise<PostState> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return { error: "로그인이 필요해요." };

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").replace(/[^0-9]/g, "");
  const price = priceRaw ? parseInt(priceRaw, 10) : 0;

  if (!title || !content) {
    return { error: "제목과 내용을 입력해 주세요." };
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({ author_id: userId, title, content, price })
    .select("id")
    .single();

  if (error) return { error: "글 등록에 실패했어요: " + error.message };

  revalidatePath("/posts");
  redirect(`/posts/${data.id}`);
}

// 댓글 작성
export async function createComment(
  postId: string,
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: userId, content });

  revalidatePath(`/posts/${postId}`);
}

// 게시글 수정 — 댓글이 하나라도 있으면 수정 거부 (삭제와 동일 규칙)
export async function updatePost(
  postId: string,
  _prev: PostState,
  formData: FormData
): Promise<PostState> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return { error: "로그인이 필요해요." };

  // 댓글 개수 확인
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);

  if ((count ?? 0) > 0) {
    return {
      error:
        "댓글이 있는 글은 수정할 수 없어요. 댓글을 모두 삭제한 뒤 다시 시도해 주세요.",
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").replace(/[^0-9]/g, "");
  const price = priceRaw ? parseInt(priceRaw, 10) : 0;

  if (!title || !content) {
    return { error: "제목과 내용을 입력해 주세요." };
  }

  // RLS 덕분에 본인 글만 수정됩니다.
  const { error } = await supabase
    .from("posts")
    .update({ title, content, price })
    .eq("id", postId)
    .eq("author_id", userId);

  if (error) return { error: "수정에 실패했어요: " + error.message };

  revalidatePath("/posts");
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}

// 댓글 수정 — RLS 로 본인 댓글만 수정됩니다.
export async function updateComment(
  commentId: string,
  postId: string,
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  await supabase
    .from("comments")
    .update({ content })
    .eq("id", commentId)
    .eq("author_id", userId);

  revalidatePath(`/posts/${postId}`);
}

// 게시글 삭제 — 댓글이 하나라도 있으면 삭제 거부
export async function deletePost(
  postId: string
): Promise<{ error?: string } | void> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return { error: "로그인이 필요해요." };

  // 댓글 개수 확인 (head: true → 개수만 가져오기)
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);

  if ((count ?? 0) > 0) {
    return {
      error:
        "댓글이 있는 글은 삭제할 수 없어요. 댓글을 모두 삭제한 뒤 다시 시도해 주세요.",
    };
  }

  // RLS 덕분에 본인 글만 삭제됩니다.
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", userId);

  if (error) return { error: "삭제에 실패했어요: " + error.message };

  revalidatePath("/posts");
  redirect("/posts");
}

// 댓글 삭제 — RLS 로 본인 댓글만 삭제됩니다.
export async function deleteComment(
  commentId: string,
  postId: string
): Promise<void> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) redirect("/login");

  await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", userId);

  revalidatePath(`/posts/${postId}`);
}

// 좋아요 토글 (이미 눌렀으면 취소, 아니면 추가)
export async function toggleLike(postId: string): Promise<void> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const { data: existing } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
  } else {
    await supabase.from("likes").insert({ post_id: postId, user_id: userId });
  }

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/posts");
}
