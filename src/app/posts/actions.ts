"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { POST_IMAGES_BUCKET, MAX_POST_IMAGES } from "@/lib/storage";
import { isPostCategory, DEFAULT_CATEGORY } from "@/lib/categories";
import { isPostStatus } from "@/lib/post-status";

// 폼에서 넘어온 카테고리를 안전하게 읽어옵니다 (정해진 5개가 아니면 '기타').
function readCategory(formData: FormData): string {
  const raw = String(formData.get("category") ?? "").trim();
  return isPostCategory(raw) ? raw : DEFAULT_CATEGORY;
}

export type PostState = { error?: string };

// 현재 로그인한 사용자 id를 돌려줍니다 (없으면 null).
async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

// 폼에서 넘어온 사진 경로들을 안전하게 읽어옵니다.
// - 본인 폴더("userId/...")로 시작하는 것만 인정 (남의 사진 끼워넣기 방지)
// - 최대 장수 제한
function readImagePaths(formData: FormData, userId: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const v of formData.getAll("images")) {
    const path = String(v).trim();
    if (!path || seen.has(path)) continue;
    if (!path.startsWith(`${userId}/`)) continue;
    seen.add(path);
    result.push(path);
    if (result.length >= MAX_POST_IMAGES) break;
  }
  return result;
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

  const images = readImagePaths(formData, userId);
  const category = readCategory(formData);

  const { data, error } = await supabase
    .from("posts")
    .insert({ author_id: userId, title, content, price, images, category })
    .select("id")
    .single();

  if (error) return { error: "글 등록에 실패했어요: " + error.message };

  revalidatePath("/posts");
  redirect(`/posts/${data.id}`);
}

// 사진·카테고리만 저장 (제목·내용·가격은 건드리지 않음)
// 댓글이 있어도 사진과 카테고리는 바꿀 수 있도록, 여기서는 댓글 검사를 하지 않습니다.
export async function updatePostImages(
  postId: string,
  _prev: PostState,
  formData: FormData
): Promise<PostState> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return { error: "로그인이 필요해요." };

  const images = readImagePaths(formData, userId);
  const category = readCategory(formData);

  // 기존 사진 목록 확보 (본인 글만) — 빠진 사진은 보관함에서 정리하기 위함
  const { data: before } = await supabase
    .from("posts")
    .select("images")
    .eq("id", postId)
    .eq("author_id", userId)
    .maybeSingle<{ images: string[] }>();

  if (!before) return { error: "본인 글의 사진만 바꿀 수 있어요." };

  // RLS 로 본인 글만 수정됩니다.
  // (제목·내용·가격은 바꾸지 않으므로 댓글이 있어도 DB 보호 규칙을 통과합니다.)
  const { error } = await supabase
    .from("posts")
    .update({ images, category })
    .eq("id", postId)
    .eq("author_id", userId);

  if (error) return { error: "저장에 실패했어요: " + error.message };

  // 더 이상 쓰지 않는 사진은 보관함에서 삭제
  const removed = (before.images ?? []).filter((p) => !images.includes(p));
  if (removed.length > 0) {
    await supabase.storage.from(POST_IMAGES_BUCKET).remove(removed);
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
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

  // 답글이면 parent_id 가 함께 넘어옵니다 (일반 댓글이면 비어 있음 → null).
  const parentId = String(formData.get("parent_id") ?? "").trim() || null;

  await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: userId, content, parent_id: parentId });

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

  const images = readImagePaths(formData, userId);
  const category = readCategory(formData);

  // 기존 사진 목록을 가져와서, 이번에 빠진 사진은 보관함에서 정리합니다.
  const { data: before } = await supabase
    .from("posts")
    .select("images")
    .eq("id", postId)
    .maybeSingle<{ images: string[] }>();

  // RLS 덕분에 본인 글만 수정됩니다.
  const { error } = await supabase
    .from("posts")
    .update({ title, content, price, images, category })
    .eq("id", postId)
    .eq("author_id", userId);

  if (error) return { error: "수정에 실패했어요: " + error.message };

  // 더 이상 쓰지 않는 사진을 보관함에서 삭제 (본인 폴더만 RLS 로 허용됨)
  const removed = (before?.images ?? []).filter((p) => !images.includes(p));
  if (removed.length > 0) {
    await supabase.storage.from(POST_IMAGES_BUCKET).remove(removed);
  }

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

  // 삭제 전에 이 글의 사진 목록을 확보 (삭제 후 보관함 정리에 사용)
  const { data: before } = await supabase
    .from("posts")
    .select("images")
    .eq("id", postId)
    .maybeSingle<{ images: string[] }>();

  // RLS 덕분에 본인 글만 삭제됩니다.
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", userId);

  if (error) return { error: "삭제에 실패했어요: " + error.message };

  // 글에 딸린 사진도 보관함에서 함께 정리
  if (before?.images && before.images.length > 0) {
    await supabase.storage.from(POST_IMAGES_BUCKET).remove(before.images);
  }

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

// 거래 상태 변경 (거래가능 / 거래예약 / 거래종료)
// 본인 글만 바꿀 수 있습니다(RLS). 댓글이 있어도 상태는 자유롭게 바꿀 수 있어요.
export async function updatePostStatus(
  postId: string,
  status: string
): Promise<{ error?: string } | void> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return { error: "로그인이 필요해요." };

  if (!isPostStatus(status)) {
    return { error: "알 수 없는 거래 상태예요." };
  }

  const { error } = await supabase
    .from("posts")
    .update({ status })
    .eq("id", postId)
    .eq("author_id", userId);

  if (error) return { error: "상태 변경에 실패했어요: " + error.message };

  revalidatePath("/posts");
  revalidatePath(`/posts/${postId}`);
  revalidatePath(`/profile/${userId}`);
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
