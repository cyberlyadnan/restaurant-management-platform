"use client";

import Link from "next/link";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Server, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UpdatesPage() {
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
              <Server className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Continuous Cloud Deployment</CardTitle>
              <CardDescription>Managed Platform Updates</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your restaurant application is deployed on our multi-tenant SaaS cloud infrastructure. All feature updates,
            security patches, and performance optimizations are rolled out automatically with zero downtime via
            continuous integration and deployment (CI/CD) pipelines.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Host-level update triggers and container orchestration are strictly managed by platform engineers and
            are inaccessible to tenant accounts.
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
