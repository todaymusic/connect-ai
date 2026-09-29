"use client";

// 데모 모드 글 보관함 — 이 브라우저의 localStorage 에만 저장된다(서버·다른 사람에게 안 보임).
import type { DemoRecord } from "./actions";

const KEY = "omu-demo-writes";
const EVENT = "omu-demo-writes-change";
const MAX = 20;

export function readDemoWrites(): DemoRecord[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as DemoRecord[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveDemoWrite(record: DemoRecord) {
  try {
    const next = [record, ...readDemoWrites().filter((r) => r.id !== record.id)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // 저장 공간이 막혀 있어도(사생활 보호 모드 등) 작성 흐름은 그대로 진행한다
  }
}

export function updateDemoWrite(id: string, patch: Partial<DemoRecord>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(readDemoWrites().map((r) => (r.id === id ? { ...r, ...patch } : r))));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* 무시 */
  }
}

export function removeDemoWrite(id: string) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(readDemoWrites().filter((r) => r.id !== id)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* 무시 */
  }
}

export function clearDemoWrites() {
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* 무시 */
  }
}

export function subscribeDemoWrites(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
