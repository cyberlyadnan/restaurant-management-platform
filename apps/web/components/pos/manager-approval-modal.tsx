"use client";

import { KeyRound, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";

interface ManagerApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  actionLabel?: string;
  onApproved: () => void;
}

export function ManagerApprovalModal({
  open,
  onOpenChange,
  title = "Manager Approval Required",
  description = "Please enter a Manager or Owner PIN to authorize this action.",
  actionLabel = "Authorize Action",
  onApproved,
}: ManagerApprovalModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      toast.error("Please enter a PIN");
      return;
    }

    setLoading(true);
    try {
      // Authenticate PIN against pin-login endpoint or manager verification
      const res = await api.post<{ user: { role: { name: string } } }>("/auth/pin-login", {
        pin: pin.trim(),
      });

      const roleName = res.user?.role?.name?.toUpperCase() ?? "";
      const isManagerOrOwner = ["OWNER", "ADMINISTRATOR", "RESTAURANT_MANAGER"].includes(roleName);

      if (!isManagerOrOwner) {
        toast.error("Provided PIN does not belong to a Manager or Owner role");
        setLoading(false);
        return;
      }

      toast.success("Manager approval authorized!");
      setPin("");
      onOpenChange(false);
      onApproved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "PIN authorization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">{title}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="manager-pin" className="text-xs font-semibold">
              4-Digit Manager PIN
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <KeyRound className="h-4 w-4" />
              </span>
              <Input
                id="manager-pin"
                type="password"
                maxLength={6}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="pl-9 text-center font-mono text-lg tracking-widest"
                autoFocus
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPin("");
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !pin.trim()}
              className="gap-1.5 font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              <ShieldCheck className="h-4 w-4" />
              {loading ? "Verifying..." : actionLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
