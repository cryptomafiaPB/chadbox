import os from 'os';
import { config } from '@chadbox/shared';

export class ConcurrencyPool {
    private activeJobs = 0;
    private queue: (() => void)[] = [];

    private availableBoxIds: number[] = [];
    private nextBoxId = config.concurrency.boxPoolMax;

    // JIT Polling State
    private lastChecked = 0;
    private cachedFreeMem = 0;

    private hasCapacity(): boolean {
        const now = Date.now();
        // cache the OS check for 500ms to prevent event-loop blocking during spikes
        if (now - this.lastChecked > config.concurrency.memoryPollIntervalMs) {
            this.cachedFreeMem = os.freemem() / (1024 * 1024); // Convert to MB
            this.lastChecked = now;
        }
        return this.cachedFreeMem > config.concurrency.panicMemoryMb;
    }

    public async acquireBox(): Promise<number> {
        // strict Backpressure: Reject instantly if queue is flooded
        if (this.queue.length >= config.concurrency.maxQueueDepth) {
            throw new Error('HTTP_429');
        }

        // Wait Queue: Hold in memory as a Promise if baseline is exceeded or RAM is choked
        if (this.activeJobs >= config.concurrency.safeBaseline && !this.hasCapacity()) {
            await new Promise<void>((resolve) => {
                this.queue.push(resolve);
                // console.log(
                //     `Queueing request. Active: ${this.activeJobs}, Queue Length: ${this.queue.length}`
                // );
            });
        }

        // checkout a Box ID securely
        this.activeJobs++;
        const boxId =
            this.availableBoxIds.pop() ??
            (this.nextBoxId >= config.concurrency.boxPoolMin ? this.nextBoxId-- : undefined);
        if (boxId === undefined) {
            this.activeJobs--;
            throw new Error('No available Box IDs');
        }
        return boxId;
    }

    public releaseBox(boxId: number): void {
        this.availableBoxIds.push(boxId);
        this.activeJobs--;

        // process the next job in the queue
        if (this.queue.length > 0) {
            const nextJob = this.queue.shift();
            if (nextJob) nextJob();
        }
    }
}

export const pool = new ConcurrencyPool();
