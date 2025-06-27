import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils.tsx";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-100 text-primary-900",
        secondary: "border-transparent bg-secondary-100 text-secondary-900",
        accent: "border-transparent bg-accent-100 text-accent-900",
        destructive: "border-transparent bg-red-100 text-red-900",
        outline: "text-gray-900 border-gray-200 dark:text-slate-200 dark:border-slate-600",
        success: "border-transparent bg-success-100 text-success-900",
        warning: "border-transparent bg-warning-100 text-warning-900",
        error: "border-transparent bg-error-100 text-error-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };