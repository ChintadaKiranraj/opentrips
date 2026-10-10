import type { ReactNode } from "react";

export function DisclaimerText({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 border-t border-black/5 pt-3 text-xs italic text-zinc-500 dark:border-white/10 dark:text-zinc-400">
      {children}
    </p>
  );
}
