import { STATUS_META, statusLabel, readStatus } from "@/lib/post-status";

// 판매글의 거래 상태를 보여주는 작은 배지입니다.
// 서버/클라이언트 어디서나 쓸 수 있는 단순 표시용 컴포넌트입니다.
export function StatusBadge({
  status,
  size = "md",
}: {
  status: string;
  size?: "sm" | "md";
}) {
  const s = readStatus(status);
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-block shrink-0 rounded-full font-semibold ${padding} ${STATUS_META[s].badge}`}
    >
      {statusLabel(s)}
    </span>
  );
}
