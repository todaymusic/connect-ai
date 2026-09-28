// OMU "노트닷" 로고 — 워드마크 + 코랄 음표 머리(작업지시서 8장)
// 작업지시서 원본 SVG(viewBox 220, 점 cx=205)는 실제 Space Grotesk 글자폭(≈135)보다 점이 멀리 떨어져 보여
// 점을 U 바로 오른쪽 위(cx=158)로 당기고 viewBox 폭을 172로 줄였다.
type LogoProps = {
  /** light: 라이트 배경(기본) / dark: 다크 배경 / coral: 코랄 배경 반전 */
  tone?: "light" | "dark" | "coral";
  className?: string;
};

const TEXT_FILL = { light: "#1E1B18", dark: "#FAF9F7", coral: "#FFFFFF" } as const;
const DOT_FILL = { light: "#F5623C", dark: "#F5623C", coral: "#FFFFFF" } as const;

export function Logo({ tone = "light", className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 172 90"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="OMU"
      className={className}
    >
      <text
        x="6"
        y="64"
        fontFamily="var(--font-space-grotesk), 'Space Grotesk', sans-serif"
        fontWeight="700"
        fontSize="62"
        fill={TEXT_FILL[tone]}
        letterSpacing="-1"
      >
        OMU
      </text>
      <circle cx="158" cy="30" r="9" fill={DOT_FILL[tone]} />
    </svg>
  );
}
