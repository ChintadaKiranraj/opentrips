import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export const fieldControlClasses =
  "w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2.5 text-sm text-zinc-900 shadow-sm transition-all placeholder:text-zinc-400 focus:border-emerald-500/60 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-400/50 dark:focus:ring-emerald-400/15";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional lucide icon rendered inside the field, left-aligned. */
  icon?: ReactNode;
}

export function TextInput({ className = "", icon, ...props }: TextInputProps) {
  if (!icon) {
    return <input className={cn(fieldControlClasses, className)} {...props} />;
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
        {icon}
      </span>
      <input className={cn(fieldControlClasses, "pl-9", className)} {...props} />
    </div>
  );
}
