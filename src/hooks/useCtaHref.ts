"use client";
import { useApp } from "@/context/AppContext";

/**
 * useCta – Akıllı CTA yönlendirme hook'u.
 *
 * Kullanıcı login değilse → /checkout (satın alma sayfası)
 * Kullanıcı login olduysa ve paketi varsa → /dashboard
 */
export function useCtaHref(): string {
  const { isLoggedIn } = useApp();
  return isLoggedIn ? "/dashboard" : "/checkout";
}
