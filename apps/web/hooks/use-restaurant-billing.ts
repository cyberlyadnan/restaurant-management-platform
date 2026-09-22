"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  RestaurantBillingOverview,
  RestaurantUpgradeDto,
} from "@nodedr-restaurant/types";
import { api } from "@/lib/api";

export function useRestaurantBilling() {
  return useQuery({
    queryKey: ["restaurant", "billing"],
    queryFn: () => api.get<RestaurantBillingOverview>("/restaurant/billing"),
    staleTime: 30000,
  });
}

export function useUpgradePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RestaurantUpgradeDto) =>
      api.post<RestaurantBillingOverview>("/restaurant/billing/upgrade", dto),
    onSuccess: (data) => {
      queryClient.setQueryData(["restaurant", "billing"], data);
      queryClient.invalidateQueries({ queryKey: ["restaurant", "billing"] });
    },
  });
}
