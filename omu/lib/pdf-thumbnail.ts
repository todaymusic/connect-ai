// 브라우저 전용: PDF 첫 페이지 → JPEG 미리보기 이미지
// pdfjs-dist 는 크기가 커서 악보 올리기 폼에서 PDF 를 고를 때만 동적으로 불러온다(다른 화면 번들에 들어가지 않음).
// legacy 빌드를 쓴다: 기본 빌드는 아주 최신 JS 기능(Map.getOrInsertComputed 등)을 요구해 조금만 오래된
// 브라우저(모바일 사파리 등)에서도 실패한다. legacy 빌드는 이런 기능을 polyfill 로 채워 넣는다.

export const THUMB_WIDTH = 720;
export const THUMB_QUALITY = 0.82;
/** 아주 긴 페이지도 이미지가 너무 커지지 않게 */
const MAX_HEIGHT = 2000;
const TIMEOUT_MS = 20_000;

type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
let pdfjsPromise: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
    // 워커도 번들러가 따로 묶는다(new URL + import.meta.url) — CDN·public 복사 없이 버전이 항상 맞는다
    if (!pdfjs.GlobalWorkerOptions.workerPort) {
      pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url), { type: "module" });
    }
    return pdfjs;
  });
  pdfjsPromise.catch(() => {
    pdfjsPromise = null; // 불러오기에 실패했으면 다음 번에 다시 시도
  });
  return pdfjsPromise;
}

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout();
      reject(new Error("PDF 미리보기 시간 초과"));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/** PDF 첫 페이지를 가로 THUMB_WIDTH px JPEG 로 만든다. 실패하면 예외 — 호출하는 쪽은 썸네일 없이 진행한다 */
export async function renderPdfFirstPage(file: File): Promise<Blob> {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data });

  const render = async () => {
    const pdf = await task.promise;
    try {
      const page = await pdf.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(THUMB_WIDTH / base.width, MAX_HEIGHT / base.height);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      // 배경은 흰색(기본값) — 투명한 PDF 가 JPEG 에서 검게 나오지 않게
      await page.render({ canvas, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", THUMB_QUALITY));
      canvas.width = canvas.height = 0; // 메모리 정리
      if (!blob) throw new Error("이미지로 바꾸지 못했어요");
      return blob;
    } finally {
      await task.destroy(); // 문서·워커 쪽 자원 정리 (전역 워커 포트는 다음 PDF 에 다시 쓴다)
    }
  };

  return withTimeout(render(), TIMEOUT_MS, () => void task.destroy());
}
