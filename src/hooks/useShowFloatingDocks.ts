"use client";

import { usePathname } from "next/navigation";

/** FAB Telegram/Chat solo sulla mappa live — evita sovrapposizioni su pagine contenuto */
export function useShowFloatingDocks(): boolean {
  const pathname = usePathname();
  return pathname === "/";
}
