import Link from "next/link";
import { FileWarning } from "lucide-react";
import type { ReactNode } from "react";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** 약관·방침 문서 틀 — 목차 + 초안 안내 */
export function LegalDoc({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro?: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-ink-3">시행일: {updated} (초안)</p>

      <div role="note" className="mt-5 flex items-start gap-2 rounded-xl border border-coral-soft bg-coral-soft/25 px-4 py-3 text-sm leading-relaxed text-ink-2">
        <FileWarning aria-hidden className="mt-0.5 size-4 shrink-0 text-coral-deep" />
        <span>
          <strong className="text-ink">확정본이 아닌 초안입니다.</strong> 서비스 오픈과 소셜 로그인 심사 준비를 위한 골격이며, 대괄호([ ]) 항목은 운영 주체 정보로
          채우고 법률 검토를 거쳐 확정합니다.
        </span>
      </div>

      {intro && <div className="mt-6 text-[15px] leading-relaxed text-ink-2">{intro}</div>}

      <nav aria-label="목차" className="mt-6 rounded-2xl border border-line bg-card p-4">
        <p className="text-sm font-bold text-ink">목차</p>
        <ol className="mt-2 grid gap-1 text-sm text-ink-2 sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <Link href={`#${s.id}`} className="hover:text-ink hover:underline">
                {i + 1}. {s.title}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-9">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="scroll-mt-28">
            <h2 id={`${s.id}-t`} className="text-lg font-extrabold text-ink">
              제{i + 1}조 {s.title}
            </h2>
            <div className="legal-body mt-2 space-y-2 text-[15px] leading-relaxed text-ink-2">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function Ul({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-stone text-ink">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-3 py-2 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-card">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
