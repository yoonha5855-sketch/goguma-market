import {
  POST_CATEGORIES,
  DEFAULT_CATEGORY,
  categoryLabel,
} from "@/lib/categories";

// 글쓰기·수정 폼에서 쓰는 카테고리 선택 드롭다운.
// 폼 전송 시 name="category" 로 값이 함께 넘어갑니다.
export function CategorySelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="category" className="text-sm font-medium text-goguma-800">
        카테고리
      </label>
      <select
        id="category"
        name="category"
        defaultValue={defaultValue ?? DEFAULT_CATEGORY}
        className="rounded-xl border border-goguma-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-goguma-400 focus:ring-2 focus:ring-goguma-200"
      >
        {POST_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {categoryLabel(c)}
          </option>
        ))}
      </select>
    </div>
  );
}
