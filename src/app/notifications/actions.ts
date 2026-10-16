"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { NOTIFICATIONS_SEEN_COOKIE } from "@/lib/notifications";

// Abriu a página de notificações: tudo até agora fica como lido (zera o número do menu).
export async function markNotificationsSeen() {
  (await cookies()).set(NOTIFICATIONS_SEEN_COOKIE, new Date().toISOString(), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  refresh();
}
