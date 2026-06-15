// 고구마 모양 미니 로고 (SVG) — 껍질은 퍼플, 속살은 골드 톤
export function GogumaLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* 고구마 몸통 */}
      <path
        d="M11 33c-5-5-4-13 2-18S28 6 35 11s8 15 3 22-13 8-19 4c-3-2-5-2-8-4z"
        fill="#7c4d9e"
      />
      {/* 속살 하이라이트 */}
      <path
        d="M19 30c-3-3-2-8 2-11s9-4 12-1-1 9-5 12-6 3-9 0z"
        fill="#e89a3c"
      />
      {/* 새싹 줄기 */}
      <path
        d="M33 12c1-4 4-6 7-6-1 4-3 6-7 6z"
        fill="#6fa25a"
      />
    </svg>
  );
}
