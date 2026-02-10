import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
    {
        variants: {
            variant: {
                default: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
                success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
                warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
                error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                outline: "border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
