"use client";

import { useState } from "react";
import { Download, FileText, Printer, Receipt, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlatformInvoices } from "@/hooks/use-platform";

export default function PlatformInvoicesPage() {
  const { data: invoices, isLoading, isError } = usePlatformInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const statusColors: Record<string, string> = {
    PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ISSUED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    DRAFT: "bg-slate-800 text-slate-300 border-slate-700",
    VOID: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    CANCELLED: "bg-slate-800 text-slate-400 border-slate-700",
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Subscription Invoices
          </h1>
          <p className="text-sm text-slate-400">
            View, audit, and print customer subscription invoices & receipts
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto mb-3" />
            <span>Loading invoices...</span>
          </div>
        ) : isError || !invoices ? (
          <div className="p-8 text-center text-rose-400">
            Failed to load invoices.
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-400" />
            <div className="text-sm font-semibold text-slate-300">
              No invoices generated yet
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-emerald-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">
                        {inv.restaurant?.name ?? "—"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {inv.restaurant?.ownerEmail}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {inv.subscription?.plan?.name ?? "Subscription Plan"}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      ₹{Number(inv.totalAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          statusColors[inv.status] || "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedInvoice(inv)}
                        className="h-7 text-xs text-slate-300 hover:text-emerald-400 hover:bg-slate-800"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" /> View Invoice
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
            {/* Top Bar with actions */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 print:hidden">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Subscription Tax Invoice
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrint}
                  className="border-slate-800 text-slate-300"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div className="pt-6 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xl font-black text-white">
                    OrderRestro Platform
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Cloud Restaurant Operating System
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    GSTIN: 07AABCO1928K1Z5 • billing@orderrestro.com
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400">
                    INVOICE
                  </div>
                  <div className="font-mono text-xs text-slate-300">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Date: {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="rounded-lg bg-slate-900/60 p-4 border border-slate-800/80 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Billed To:
                </span>
                <div className="font-bold text-sm text-white">
                  {selectedInvoice.restaurant?.name}
                </div>
                {selectedInvoice.restaurant?.legalName && (
                  <div className="text-slate-400">
                    {selectedInvoice.restaurant.legalName}
                  </div>
                )}
                <div className="text-slate-400 mt-0.5">
                  Contact: {selectedInvoice.restaurant?.ownerName} (
                  {selectedInvoice.restaurant?.ownerEmail})
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-y border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">
                        {selectedInvoice.subscription?.plan?.name ?? "Restaurant SaaS"} Subscription
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Cloud access, POS, KDS, inventory, tables, and mobile apps
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {selectedInvoice.subscription?.billingPeriod ?? "Yearly"}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white">
                      ₹{Number(selectedInvoice.subtotal).toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>₹{Number(selectedInvoice.subtotal).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>GST / Taxes:</span>
                    <span>₹{Number(selectedInvoice.taxAmount).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-slate-800">
                    <span>Total Paid:</span>
                    <span className="text-emerald-400">
                      ₹{Number(selectedInvoice.totalAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Proof Footer */}
              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
                <div>
                  Status:{" "}
                  <span className="text-emerald-400 font-semibold uppercase">
                    {selectedInvoice.status}
                  </span>{" "}
                  {selectedInvoice.paidAt &&
                    `• Settled on ${new Date(selectedInvoice.paidAt).toLocaleDateString()}`}
                </div>
                <div>Thank you for choosing OrderRestro!</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
