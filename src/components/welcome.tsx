import { cookies } from "next/headers";
import type { Profile } from "@/lib/types";
import { WELCOME_COOKIE, WelcomeDialog } from "./welcome-dialog";

// Até 30 dias depois de criar a conta, mostra as boas-vindas uma vez (quem já usava o Orbi não vê).
const NEW_ACCOUNT_DAYS = 30;

function isNewAccount(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() <= NEW_ACCOUNT_DAYS * 86400000;
}

export async function Welcome({ viewer }: { viewer: Profile }) {
  if ((await cookies()).get(WELCOME_COOKIE) || !isNewAccount(viewer.created_at)) return null;
  return <WelcomeDialog />;
}
