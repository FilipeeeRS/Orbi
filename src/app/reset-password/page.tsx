import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";
import { getDict } from "@/lib/session";

// Título da aba do navegador no idioma da pessoa
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.auth.newPasswordTitle };
}

// Destino do link "esqueci a senha": a pessoa chega aqui já logada pelo /auth/callback.
export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-sm py-8">
      <ResetPasswordForm />
    </div>
  );
}
