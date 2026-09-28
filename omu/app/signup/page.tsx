import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/AuthPanel";

export const metadata: Metadata = {
  title: "회원가입",
  robots: { index: false, follow: true },
};

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  return <AuthPanel mode="signup" searchParams={await searchParams} />;
}
