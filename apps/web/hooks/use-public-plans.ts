"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PublicRegisterDto, SessionUser } from "@nodedr-restaurant/types";
import { api } from "@/lib/api";

export interface PublicPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPrice: number;
  quarterlyPrice: number | null;
  halfYearlyPrice: number | null;
  yearlyPrice: number;
  currency: string;
  trialDays: number;
  isPopular: boolean;
  limits: {
    maxBranches: number;
    maxUsers: number;
    maxTables: number;
    maxProducts: number;
  };
  features: string[];
}

export function usePublicPlans() {
  return useQuery({
    queryKey: ["public", "plans"],
    queryFn: () => api.get<PublicPlan[]>("/public/plans"),
    staleTime: 60000,
  });
}

export function usePublicRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: PublicRegisterDto) =>
      api.post<{ token: string; user: SessionUser }>("/public/register", dto),
    onSuccess: (data) => {
      qc.setQueryData(["auth", "me"], { user: data.user });
    },
  });
}
