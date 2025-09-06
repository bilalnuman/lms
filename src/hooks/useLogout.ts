"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

async function doLogout() {
  // 1) Ask backend to clear refresh cookie (ignore errors if endpoint doesn't exist)
  try {
    await fetch("/api/backend/api/v1/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // same-origin via proxy route; credentials not needed here
    });
  } catch {}

  // 2) Clear frontend httpOnly session cookie
  const res = await fetch("/api/logout", { method: "POST" });
  if (!res.ok) throw new Error("Failed to clear session");
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: doLogout,
    onSuccess: () => {
      qc.clear(); // drop all cached data
      try {
        localStorage.removeItem("lms:user");
      } catch {}
      router.replace("/"); // back to login (your login is "/")
    },
  });
}
