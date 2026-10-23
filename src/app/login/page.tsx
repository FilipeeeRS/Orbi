import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { getDict } from "@/lib/session";

// Título da aba do navegador no idioma da pessoa
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.auth.signInTitle };
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-8">
      <LoginForm />
    </div>
  );
}
