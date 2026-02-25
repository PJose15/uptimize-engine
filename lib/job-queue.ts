/**
 * Job Queue — Lightweight Background Processing
 *
 * Separates interactive UI requests from long-running agent steps.
 * Each job has a unique ID, status tracking, and timeout management.
 */

// ============================================================================
// TYPES
// ============================================================================

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled" | "expired";

export interface Job<T = unknown> {
    job_id: string;
    queue_name: string;
    status: JobStatus;
    /** Pipeline run/step reference */
    run_id: string;
    step_id: string | null;
    /** The work to execute */
    payload: Record<string, unknown>;
    /** Result when completed */
    result: T | null;
    error: string | null;
    /** Timing */
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    timeout_ms: number;
    /** Priority (lower = higher priority) */
    priority: number;
    /** Retry tracking */
    attempt: number;
    max_attempts: number;
}

export interface JobQueueOptions {
    /** Max concurrent jobs */
    concurrency: number;
    /** Default timeout per job in ms */
    defaultTimeoutMs: number;
    /** Default max retry attempts */
    defaultMaxAttempts: number;
}

// ============================================================================
// JOB QUEUE
// ============================================================================

export class JobQueue {
    private name: string;
    private options: JobQueueOptions;
    private jobs: Map<string, Job> = new Map();
    private activeCount: number = 0;
    private handlers: Map<string, (job: Job) => Promise<unknown>> = new Map();

    constructor(name: string, options?: Partial<JobQueueOptions>) {
        this.name = name;
        this.options = {
            concurrency: options?.concurrency ?? 3,
            defaultTimeoutMs: options?.defaultTimeoutMs ?? 120_000,
            defaultMaxAttempts: options?.defaultMaxAttempts ?? 3,
        };
    }

    /**
     * Register a handler for jobs in this queue
     */
    registerHandler(queueName: string, handler: (job: Job) => Promise<unknown>): void {
        this.handlers.set(queueName, handler);
    }

    /**
     * Enqueue a new job
     */
    enqueue(params: {
        queueName: string;
        runId: string;
        stepId?: string;
        payload: Record<string, unknown>;
        priority?: number;
        timeoutMs?: number;
        maxAttempts?: number;
    }): Job {
        const job: Job = {
            job_id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            queue_name: params.queueName,
            status: "queued",
            run_id: params.runId,
            step_id: params.stepId || null,
            payload: params.payload,
            result: null,
            error: null,
            created_at: new Date().toISOString(),
            started_at: null,
            completed_at: null,
            timeout_ms: params.timeoutMs ?? this.options.defaultTimeoutMs,
            priority: params.priority ?? 5,
            attempt: 0,
            max_attempts: params.maxAttempts ?? this.options.defaultMaxAttempts,
        };

        this.jobs.set(job.job_id, job);
        this.processNext();
        return job;
    }

    /**
     * Get job by ID
     */
    getJob(jobId: string): Job | undefined {
        return this.jobs.get(jobId);
    }

    /**
     * Get all jobs for a run
     */
    getJobsByRun(runId: string): Job[] {
        return Array.from(this.jobs.values()).filter(j => j.run_id === runId);
    }

    /**
     * Cancel a job
     */
    cancel(jobId: string): boolean {
        const job = this.jobs.get(jobId);
        if (!job) return false;
        if (job.status === "completed" || job.status === "failed") return false;

        job.status = "cancelled";
        job.completed_at = new Date().toISOString();
        return true;
    }

    /**
     * Get queue stats
     */
    getStats(): {
        queued: number;
        running: number;
        completed: number;
        failed: number;
        total: number;
    } {
        const jobs = Array.from(this.jobs.values());
        return {
            queued: jobs.filter(j => j.status === "queued").length,
            running: jobs.filter(j => j.status === "running").length,
            completed: jobs.filter(j => j.status === "completed").length,
            failed: jobs.filter(j => j.status === "failed").length,
            total: jobs.length,
        };
    }

    // ============================================================================
    // PRIVATE
    // ============================================================================

    private async processNext(): Promise<void> {
        if (this.activeCount >= this.options.concurrency) return;

        // Get next queued job by priority
        const nextJob = Array.from(this.jobs.values())
            .filter(j => j.status === "queued")
            .sort((a, b) => a.priority - b.priority)[0];

        if (!nextJob) return;

        const handler = this.handlers.get(nextJob.queue_name);
        if (!handler) {
            nextJob.status = "failed";
            nextJob.error = `No handler registered for queue: ${nextJob.queue_name}`;
            nextJob.completed_at = new Date().toISOString();
            return;
        }

        this.activeCount++;
        nextJob.status = "running";
        nextJob.started_at = new Date().toISOString();
        nextJob.attempt++;

        try {
            // Execute with timeout
            const result = await Promise.race([
                handler(nextJob),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Job timeout exceeded")), nextJob.timeout_ms)
                ),
            ]);

            nextJob.status = "completed";
            nextJob.result = result;
            nextJob.completed_at = new Date().toISOString();
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);

            if (nextJob.attempt < nextJob.max_attempts) {
                // Re-queue for retry
                nextJob.status = "queued";
                nextJob.error = errorMsg;
            } else {
                nextJob.status = "failed";
                nextJob.error = errorMsg;
                nextJob.completed_at = new Date().toISOString();
            }
        } finally {
            this.activeCount--;
            // Process next job
            this.processNext();
        }
    }
}

// ============================================================================
// SINGLETON QUEUES
// ============================================================================

const queues: Map<string, JobQueue> = new Map();

export function getJobQueue(name: string = "default"): JobQueue {
    let queue = queues.get(name);
    if (!queue) {
        queue = new JobQueue(name);
        queues.set(name, queue);
    }
    return queue;
}

/** Pipeline agent execution queue */
export function getAgentQueue(): JobQueue {
    return getJobQueue("agent-execution");
}
