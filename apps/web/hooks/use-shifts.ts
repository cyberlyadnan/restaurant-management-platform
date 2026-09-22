"use client";

import type {
  CashMovementDto,
  CloseShiftDto,
  OpenShiftDto,
  RegisterShiftDto,
  XReportDto,
  ZReportDto,
} from "@nodedr-restaurant/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCurrentShift(branchId: string | null) {
  return useQuery({
    queryKey: ["shifts", "current", branchId],
    queryFn: async () => {
      if (!branchId) return null;
      const res = await api.get<RegisterShiftDto | null>(`/shifts/current?branchId=${branchId}`);
      // If empty object returned, treat as null
      if (!res || Object.keys(res).length === 0) return null;
      return res;
    },
    enabled: !!branchId,
    refetchInterval: 30_000,
  });
}

export function useOpenShift(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: OpenShiftDto) =>
      api.post<RegisterShiftDto>(`/shifts/open?branchId=${branchId}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts", "current", branchId] });
      queryClient.invalidateQueries({ queryKey: ["shifts", "list", branchId] });
    },
  });
}

export function useRecordCashMovement(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, dto }: { shiftId: string; dto: CashMovementDto }) =>
      api.post<RegisterShiftDto>(`/shifts/${shiftId}/movements?branchId=${branchId}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts", "current", branchId] });
    },
  });
}

export function useCloseShift(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, dto }: { shiftId: string; dto: CloseShiftDto }) =>
      api.post<ZReportDto>(`/shifts/${shiftId}/close?branchId=${branchId}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts", "current", branchId] });
      queryClient.invalidateQueries({ queryKey: ["shifts", "list", branchId] });
    },
  });
}

export function useXReport(branchId: string | null, shiftId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["shifts", "x-report", branchId, shiftId],
    queryFn: () => {
      if (!branchId || !shiftId) return null;
      return api.get<XReportDto>(`/shifts/${shiftId}/x-report?branchId=${branchId}`);
    },
    enabled: !!branchId && !!shiftId && enabled,
  });
}

export function useShiftsHistory(branchId: string | null, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["shifts", "list", branchId, page, limit],
    queryFn: () => {
      if (!branchId) return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      return api.get<{
        items: RegisterShiftDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/shifts?branchId=${branchId}&page=${page}&limit=${limit}`);
    },
    enabled: !!branchId,
  });
}
