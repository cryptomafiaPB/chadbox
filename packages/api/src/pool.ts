import os from 'os';
import { config as defaultConfig, type ConcurrencyConfig } from '@chadbox/shared';

export class ConcurrencyPool {
    private config: ConcurrencyConfig;
    private activeJobs = 0;
    private queue: (() => void)[] = [];

    // Box ID Management
    private availableBoxIds: number[];
    private quarantinedBoxIds: Set<number> = new Set();

    // JIT Polling State
    private lastChecked = 0;
    private cachedFreeMem = 0;

    constructor(concurrencyConfig?: ConcurrencyConfig) {
        this.config = concurrencyConfig || defaultConfig.concurrency;
        const min = this.config.boxPoolMin;
        const max = this.config.boxPoolMax;
        this.availableBoxIds = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    }

    private hasCapacity(): boolean {
        const now = Date.now();
        // cache the OS check to prevent event-loop blocking during spikes
        if (now - this.lastChecked > this.config.memoryPollIntervalMs) {
            this.cachedFreeMem = os.freemem() / (1024 * 1024); // Convert to MB
            this.lastChecked = now;
        }
        return this.cachedFreeMem > this.config.panicMemoryMb;
    }

    public async acquireBox(): Promise<number> {
        // strict Backpressure: Reject instantly if queue is flooded
        if (this.queue.length >= this.config.maxQueueDepth) {
            throw new Error('HTTP_429');
        }

        // Wait Queue: Hold in memory as a Promise if baseline is exceeded or RAM is choked
        // Note: Retaining existing design logic (burst capacity beyond baseline when RAM is available)
        if (this.activeJobs >= this.config.safeBaseline && !this.hasCapacity()) {
            await new Promise<void>((resolve) => {
                this.queue.push(resolve);
            });
        }

        // checkout a Box ID securely
        this.activeJobs++;
        const boxId = this.availableBoxIds.pop();
        if (!boxId) {
            this.activeJobs--;
            throw new Error('No available Box IDs');
        }
        return boxId;
    }

    public releaseBox(boxId: number, options?: { healthy?: boolean }): void {
        const isHealthy = options?.healthy !== false;

        if (isHealthy) {
            this.availableBoxIds.push(boxId);
        } else {
            this.quarantinedBoxIds.add(boxId);
            console.warn(
                `⚠️ [ConcurrencyPool] Box ${boxId} quarantined due to incomplete cleanup.`
            );
        }

        this.activeJobs = Math.max(0, this.activeJobs - 1);

        // process the next job in the queue
        if (this.queue.length > 0) {
            const nextJob = this.queue.shift();
            if (nextJob) nextJob();
        }
    }

    public getStats() {
        return {
            activeJobs: this.activeJobs,
            queueDepth: this.queue.length,
            availableBoxes: this.availableBoxIds.length,
            quarantinedBoxes: this.quarantinedBoxIds.size,
        };
    }

    public isQuarantined(boxId: number): boolean {
        return this.quarantinedBoxIds.has(boxId);
    }

    public async reapQuarantinedBoxes(
        cleanupFn?: (boxId: number) => Promise<void>
    ): Promise<number> {
        let recovered = 0;
        for (const boxId of Array.from(this.quarantinedBoxIds)) {
            try {
                if (cleanupFn) {
                    await cleanupFn(boxId);
                }
                this.quarantinedBoxIds.delete(boxId);
                this.availableBoxIds.push(boxId);
                recovered++;
            } catch {
                // Box still unclean, remains quarantined
            }
        }
        return recovered;
    }
}

export const pool = new ConcurrencyPool();
