"use client";
import api from "@/services/api";
import { LoginPayload, LoginResponse } from "@/types/auth";
import { LOGIN } from "@/utils/urls";
import { useMutation, useQueryClient } from "@tanstack/react-query";


export function useLogin() {
  const qc = useQueryClient();
  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: (data) =>
      api.post<LoginResponse>(LOGIN, data).then((res) => res.data),
    onSuccess: async (data) => {
      if (data?.data?.accessToken) {
        const accessToken = data?.data?.accessToken;
        if (!accessToken) throw new Error("No access token returned");
        const r = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        });
        if (!r.ok) throw new Error("Failed to persist session");
      }
      if (data?.data?.user) {
        qc.setQueryData(["me"], data.data.user);
      }
    },
  });
}
