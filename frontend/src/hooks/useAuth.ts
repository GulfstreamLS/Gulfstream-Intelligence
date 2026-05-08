"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, clearTokenCookies } from "../lib/api";
import { useChatStore } from "../store/chatStore";
import type { User } from "../types";

export function useAuth() {
  const { user, setUser } = useChatStore();
  const [loading, setLoading] = useState(!user);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((u: User) => {
        setUser(u);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        router.replace("/login");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshUser() {
    const u = await authApi.me();
    setUser(u);
    return u;
  }

  function logout() {
    clearTokenCookies();
    setUser(null);
    router.replace("/login");
  }

  return { user, loading, logout, refreshUser };
}
