import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
    max?: number;
    showLabel?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value = 0, max = 100, showLabel = false, ...props }, ref) => {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));

        return (
            <div className={cn("relative", className)} ref={ref} {...props}>
                <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {showLabel && (
                    <span className="absolute right-0 top-4 text-xs text-zinc-500 dark:text-zinc-400">
                        {Math.round(percentage)}%
                    </span>
                )}
            </div>
        );
    }
);
Progress.displayName = "Progress";

export { Progress };
