"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type LoginPayload = { email: string; password: string };
type LoginResponse = {
  data?: { accessToken?: string; user?: any };
  message?: string;
  error?: string;
};

async function loginRequest(payload: LoginPayload) {
  const res = await fetch("http://localhost:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = (await res.json().catch(() => ({}))) as LoginResponse;

  if (!res.ok) {
    throw new Error(json?.message || json?.error || "Login failed");
  }

  const accessToken = json?.data?.accessToken;
  if (!accessToken) throw new Error("No access token returned");
  const r = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  if (!r.ok) throw new Error("Failed to persist session");

  return { user: json?.data?.user ?? null };
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: ({ user }) => {
      // Optional: prime a 'me' cache for UI
      qc.setQueryData(["me"], user);
    },
  });
}
