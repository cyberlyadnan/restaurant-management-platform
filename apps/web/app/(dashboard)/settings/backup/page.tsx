"use client";

import Link from "next/link";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BackupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your restaurant configuration and settings.</p>
      </div>

      <SettingsTabs />

      <Card className="max-w-2xl border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Platform Infrastructure Management</CardTitle>
              <CardDescription>Enterprise Data Redundancy & Backups</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            In our multi-tenant cloud architecture, automated database snapshots, continuous WAL archiving,
            and disaster recovery are handled automatically by the central platform infrastructure to guarantee
            zero data loss and absolute tenant isolation.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tenant-facing database restoration has been decommissioned to maintain SaaS data integrity. If you
            require a logical data export of your menu, orders, or customer directory, use the Data Export option
            under Reports.
          </p>
          <div className="pt-2">
            <Link
              href="/settings"
              className={cn(buttonVariants({ variant: "outline" }), "inline-flex items-center")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
