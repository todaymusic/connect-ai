import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 개인 화면·작성 화면·인증 경로·검색 결과는 수집하지 않는다
        disallow: ["/admin", "/write", "/auth/", "/login", "/signup", "/search"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
