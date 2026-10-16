import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

// Destino do link "esqueci a senha": a pessoa chega aqui já logada pelo /auth/callback.
export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-sm py-8">
      <ResetPasswordForm />
    </div>
  );
}
