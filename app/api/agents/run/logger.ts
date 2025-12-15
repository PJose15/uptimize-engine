/**
 * Centralized logging utility with context tracking
 */

export enum LogLevel {
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
}

interface LogContext {
    requestId?: string;
    provider?: string;
    taskSummary?: string;
}

class Logger {
    private formatTimestamp(): string {
        return new Date().toISOString();
    }

    private formatMessage(
        level: LogLevel,
        message: string,
        context?: LogContext,
        data?: unknown
    ): string {
        const timestamp = this.formatTimestamp();
        const contextStr = context
            ? ` [${Object.entries(context)
                .map(([key, value]) => `${key}=${value}`)
                .join(", ")}]`
            : "";
        const dataStr = data ? ` ${JSON.stringify(data)}` : "";
        return `[${timestamp}] [${level}]${contextStr} ${message}${dataStr}`;
    }

    info(message: string, context?: LogContext, data?: unknown): void {
        console.log(this.formatMessage(LogLevel.INFO, message, context, data));
    }

    warn(message: string, context?: LogContext, data?: unknown): void {
        console.warn(this.formatMessage(LogLevel.WARN, message, context, data));
    }

    error(message: string, context?: LogContext, data?: unknown): void {
        console.error(this.formatMessage(LogLevel.ERROR, message, context, data));
    }

    // Helper to summarize long tasks
    summarizeTask(task: string, maxLength: number = 50): string {
        if (task.length <= maxLength) return task;
        return task.substring(0, maxLength) + "...";
    }
}

// Export singleton instance
export const logger = new Logger();
