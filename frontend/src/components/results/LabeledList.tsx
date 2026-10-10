import type { ReactNode } from "react";

interface LabeledListProps {
  title: string;
  items: string[];
  icon?: ReactNode;
}

export function LabeledList({ title, items, icon }: LabeledListProps) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {icon}
        {title}
      </h3>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
