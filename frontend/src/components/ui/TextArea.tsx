import type { ReactNode, TextareaHTMLAttributes } from "react";

import { fieldControlClasses } from "@/components/ui/TextInput";
import { cn } from "@/lib/utils/cn";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Optional lucide icon rendered inside the field, top-left aligned. */
  icon?: ReactNode;
}

export function TextArea({ className = "", icon, ...props }: TextAreaProps) {
  if (!icon) {
    return <textarea className={cn(fieldControlClasses, "resize-none", className)} {...props} />;
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-3 left-3 text-zinc-400 dark:text-zinc-500">
        {icon}
      </span>
      <textarea className={cn(fieldControlClasses, "resize-none pl-9", className)} {...props} />
    </div>
  );
}
