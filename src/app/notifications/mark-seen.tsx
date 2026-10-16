"use client";

import { useEffect } from "react";
import { markNotificationsSeen } from "./actions";

// Marca as notificações como lidas assim que a página abre.
export function MarkSeen() {
  useEffect(() => {
    markNotificationsSeen();
  }, []);
  return null;
}
