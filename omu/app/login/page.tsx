import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/AuthPanel";

export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false, follow: true },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  return <AuthPanel mode="login" searchParams={await searchParams} />;
}
