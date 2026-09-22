"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ActivateSubscriptionDto,
  CreatePlanDto,
  CreateRestaurantEnrollmentDto,
  PlanDto,
  PlatformDashboardStats,
  PlatformLoginDto,
  PlatformSessionUser,
  RecordPaymentDto,
  UpdatePlanDto,
  UpdateRestaurantStatusDto,
} from "@nodedr-restaurant/types";
import { api } from "@/lib/api";

export function usePlatformMe() {
  return useQuery({
    queryKey: ["platform", "me"],
    queryFn: () =>
      api.get<{ user: PlatformSessionUser }>("/platform/auth/me"),
    retry: false,
  });
}

export function usePlatformLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: PlatformLoginDto) =>
      api.post<{ token: string; user: PlatformSessionUser }>(
        "/platform/auth/login",
        dto,
      ),
    onSuccess: (data) => {
      qc.setQueryData(["platform", "me"], { user: data.user });
    },
  });
}

export function usePlatformLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/platform/auth/logout"),
    onSuccess: () => {
      qc.clear();
    },
  });
}

export function usePlatformDashboard() {
  return useQuery({
    queryKey: ["platform", "dashboard"],
    queryFn: () => api.get<PlatformDashboardStats>("/platform/dashboard"),
    refetchInterval: 30000,
  });
}

export function usePlatformRestaurants(search?: string, status?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  const q = params.toString() ? `?${params.toString()}` : "";

  return useQuery({
    queryKey: ["platform", "restaurants", search, status],
    queryFn: () => api.get<any[]>(`/platform/restaurants${q}`),
  });
}

export function usePlatformRestaurant(id: string) {
  return useQuery({
    queryKey: ["platform", "restaurants", id],
    queryFn: () => api.get<any>(`/platform/restaurants/${id}`),
    enabled: Boolean(id),
  });
}

export function useEnrollRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRestaurantEnrollmentDto) =>
      api.post("/platform/restaurants", dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform", "restaurants"] });
      qc.invalidateQueries({ queryKey: ["platform", "dashboard"] });
    },
  });
}

export function useUpdateRestaurantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateRestaurantStatusDto;
    }) => api.patch(`/platform/restaurants/${id}/status`, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["platform", "restaurants"] });
      qc.invalidateQueries({ queryKey: ["platform", "restaurants", vars.id] });
      qc.invalidateQueries({ queryKey: ["platform", "dashboard"] });
    },
  });
}

export function useActivateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: ActivateSubscriptionDto;
    }) => api.post(`/platform/restaurants/${id}/subscriptions`, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["platform", "restaurants"] });
      qc.invalidateQueries({ queryKey: ["platform", "restaurants", vars.id] });
      qc.invalidateQueries({ queryKey: ["platform", "subscriptions"] });
      qc.invalidateQueries({ queryKey: ["platform", "dashboard"] });
    },
  });
}

export function usePlatformPlans() {
  return useQuery({
    queryKey: ["platform", "plans"],
    queryFn: () => api.get<PlanDto[]>("/platform/plans"),
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePlanDto) => api.post("/platform/plans", dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform", "plans"] });
      qc.invalidateQueries({ queryKey: ["public", "plans"] });
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePlanDto }) =>
      api.patch(`/platform/plans/${id}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform", "plans"] });
      qc.invalidateQueries({ queryKey: ["public", "plans"] });
    },
  });
}

export function usePlatformSubscriptions(status?: string) {
  const q = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: ["platform", "subscriptions", status],
    queryFn: () => api.get<any[]>(`/platform/subscriptions${q}`),
  });
}

export function useExtendSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      api.post(`/platform/subscriptions/${id}/extend`, { days }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform", "subscriptions"] });
      qc.invalidateQueries({ queryKey: ["platform", "restaurants"] });
      qc.invalidateQueries({ queryKey: ["platform", "dashboard"] });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/platform/subscriptions/${id}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform", "subscriptions"] });
      qc.invalidateQueries({ queryKey: ["platform", "restaurants"] });
      qc.invalidateQueries({ queryKey: ["platform", "dashboard"] });
    },
  });
}

export function usePlatformPayments(restaurantId?: string) {
  const q = restaurantId ? `?restaurantId=${restaurantId}` : "";
  return useQuery({
    queryKey: ["platform", "payments", restaurantId],
    queryFn: () => api.get<any[]>(`/platform/payments${q}`),
  });
}

export function useRecordPlatformPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: RecordPaymentDto & { restaurantId: string }) =>
      api.post("/platform/payments", dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform", "payments"] });
      qc.invalidateQueries({ queryKey: ["platform", "invoices"] });
      qc.invalidateQueries({ queryKey: ["platform", "dashboard"] });
    },
  });
}

export function usePlatformInvoices(restaurantId?: string) {
  const q = restaurantId ? `?restaurantId=${restaurantId}` : "";
  return useQuery({
    queryKey: ["platform", "invoices", restaurantId],
    queryFn: () => api.get<any[]>(`/platform/invoices${q}`),
  });
}

export function usePlatformInvoice(id: string) {
  return useQuery({
    queryKey: ["platform", "invoices", id],
    queryFn: () => api.get<any>(`/platform/invoices/${id}`),
    enabled: Boolean(id),
  });
}
