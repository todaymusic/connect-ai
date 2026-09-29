// supabase/setup-all.sql 만들기 — 새 Supabase 프로젝트 SQL Editor 에 한 번에 붙여 넣는 단일 파일
//   schema.sql → migrations/20260929_write_fields.sql → migrations/20260930_guest_community.sql 순서로 이어 붙인다.
//   (schema.sql 에도 10·11번 섹션으로 같은 내용이 들어 있어 겹치지만, 모두 IF NOT EXISTS / CREATE OR REPLACE 라 안전하다.
//    예전 schema.sql 만 실행해 둔 프로젝트에 이 파일을 실행해도 된다.)
// 사용: npm run db:setup-sql   (schema.sql 이나 마이그레이션을 고친 뒤 다시 실행)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase");
const parts = ["schema.sql", "migrations/20260929_write_fields.sql", "migrations/20260930_guest_community.sql"];

const header = `-- =====================================================================
--  OMU — Supabase 전체 설치 SQL (단일 파일, 자동 생성: npm run db:setup-sql)
-- =====================================================================
--  새 Supabase 프로젝트: SQL Editor → New query → 이 파일 전체 붙여넣기 → Run
--  · 포함: ${parts.join(" → ")}
--  · DROP 없음, 여러 번 실행해도 안전(재실행 시 이미 있는 것은 건너뛴다)
--  · 각 파일이 자기 트랜잭션(BEGIN … COMMIT)을 가진다 — 한 파일이 실패하면 그 파일 내용은 반영되지 않는다
--  · 실행 전 위험 요소는 supabase/SCHEMA_README.md 참고
--  ⚠️ 이 파일을 직접 고치지 말고 원본(schema.sql, migrations/*)을 고친 뒤 다시 생성한다.
-- =====================================================================
`;

const body = parts
  .map((p) => `\n\n-- ▼▼▼ ${p} ▼▼▼\n\n${readFileSync(join(root, p), "utf8").trim()}\n\n-- ▲▲▲ ${p} ▲▲▲`)
  .join("");
writeFileSync(join(root, "setup-all.sql"), `${header}${body}\n`);
console.log(`supabase/setup-all.sql 생성 (${parts.length}개 파일)`);
