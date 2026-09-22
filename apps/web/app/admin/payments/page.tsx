"use client";

import { useState } from "react";
import { CreditCard, Plus, Receipt, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  usePlatformPayments,
  usePlatformRestaurants,
  useRecordPlatformPayment,
} from "@/hooks/use-platform";

export default function PlatformPaymentsPage() {
  const { data: payments, isLoading, isError } = usePlatformPayments();
  const { data: restaurants } = usePlatformRestaurants();
  const recordPaymentMutation = useRecordPlatformPayment();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState<
    "MANUAL_BANK_TRANSFER" | "MANUAL_CASH" | "MANUAL_UPI" | "MANUAL_CHEQUE"
  >("MANUAL_BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const handleOpenRecord = () => {
    if (restaurants && restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
    }
    setModalError(null);
    setModalOpen(true);
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!selectedRestaurantId) {
      setModalError("Please select a restaurant.");
      return;
    }

    try {
      await recordPaymentMutation.mutateAsync({
        restaurantId: selectedRestaurantId,
        amount: Number(amount),
        currency: "INR",
        method,
        reference: reference || undefined,
        notes: notes || undefined,
      });
      setModalOpen(false);
      setAmount("");
      setReference("");
      setNotes("");
    } catch (err: any) {
      setModalError(err?.message || "Failed to record payment.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Subscription Payments
          </h1>
          <p className="text-sm text-slate-400">
            Log and audit all offline bank transfers, cash receipts, and platform transactions
          </p>
        </div>
        <Button
          onClick={handleOpenRecord}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" /> Record Manual Payment
        </Button>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto mb-3" />
            <span>Loading payment records...</span>
          </div>
        ) : isError || !payments ? (
          <div className="p-8 text-center text-rose-400">
            Failed to load payments.
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-400" />
            <div className="text-sm font-semibold text-slate-300">
              No subscription payments recorded yet
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference / UTR</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">
                        {p.restaurant?.name ?? "—"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {p.restaurant?.ownerName}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {p.method.replace("MANUAL_", "")}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {p.reference ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {p.recordedBy?.name ?? "System"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                Record Offline Payment
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModalOpen(false)}
                className="text-slate-400"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4 pt-4">
              {modalError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
                  {modalError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  Select Restaurant *
                </Label>
                <select
                  value={selectedRestaurantId}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                  className="w-full h-9 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs text-white"
                >
                  {restaurants?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.ownerName ?? "No Owner"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  Amount Received (₹) *
                </Label>
                <Input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="e.g. 26999"
                  className="bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Payment Method *
                  </Label>
                  <select
                    value={method}
                    onChange={(e: any) => setMethod(e.target.value)}
                    className="w-full h-9 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs text-white"
                  >
                    <option value="MANUAL_BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                    <option value="MANUAL_UPI">UPI / QR Code</option>
                    <option value="MANUAL_CASH">Cash</option>
                    <option value="MANUAL_CHEQUE">Cheque</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Transaction / UTR #
                  </Label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. UTR84729"
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  Notes
                </Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Annual renewal received via ICICI NEFT"
                  className="bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="border-slate-800 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={recordPaymentMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  {recordPaymentMutation.isPending
                    ? "Recording..."
                    : "Record Payment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
