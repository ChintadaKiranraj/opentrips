import type { ReactNode } from "react";

interface CardHeaderProps {
  title: string;
  badge?: ReactNode;
}

export function CardHeader({ title, badge }: CardHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
      {badge}
    </div>
  );
}
