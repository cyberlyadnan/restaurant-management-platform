"use client";

import { ArrowRight, Github } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { downloadHref } from "@/lib/downloads";
import { PosMockup } from "@/components/marketing/pos-mockup";

const words = ["Run", "your", "entire", "restaurant", "from", "one", "platform."];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-20 sm:px-6 sm:pt-24">
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_88%),transparent)]"
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400"
        >
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          The Modern Restaurant Operating System SaaS
        </motion.div>

        <h1 className="flex flex-wrap justify-center gap-x-2.5 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          {words.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className={word === "platform." ? "text-emerald-500" : undefined}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-2xl text-balance text-base sm:text-lg text-muted-foreground"
        >
          Everything you need to operate at peak speed: lightning POS, real-time Kitchen Display (KDS), interactive dining room floor plans, recipe-costed inventory, guest loyalty, and multi-branch central analytics.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-col items-center gap-3.5 sm:flex-row"
        >
          <Link href="/register">
            <Button size="lg" className="h-11 px-7 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/10">
              Start 14-Day Free Trial
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-6 text-sm font-semibold border-border hover:bg-muted"
            >
              View Plans & Pricing
            </Button>
          </Link>
        </motion.div>
      </div>

      <div className="mt-14 sm:mt-16">
        <PosMockup />
      </div>
    </section>
  );
}
