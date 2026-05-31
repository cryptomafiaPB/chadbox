import os from 'os';

const MAX_SAFE_BASELINE = 5;
const MAX_QUEUE_DEPTH = 50;
const PANIC_MEMORY_MB = 100; // minimum free RAM required to spawn new sandboxes

export class ConcurrencyPool {
    private activeJobs = 0;
    private queue: (() => void)[] = [];

    // Box ID Management (1 to 1000)
    private availableBoxIds: number[] = Array.from({ length: 1000 }, (_, i) => i + 1);

    // JIT Polling State
    private lastChecked = 0;
    private cachedFreeMem = 0;

    private hasCapacity(): boolean {
        const now = Date.now();
        // cache the OS check for 500ms to prevent event-loop blocking during spikes
        if (now - this.lastChecked > 500) {
            this.cachedFreeMem = os.freemem() / (1024 * 1024); // Convert to MB
            this.lastChecked = now;
        }
        return this.cachedFreeMem > PANIC_MEMORY_MB;
    }

    public async acquireBox(): Promise<number> {
        // strict Backpressure: Reject instantly if queue is flooded
        if (this.queue.length >= MAX_QUEUE_DEPTH) {
            throw new Error('HTTP_429');
        }

        // Wait Queue: Hold in memory as a Promise if baseline is exceeded or RAM is choked
        if (this.activeJobs >= MAX_SAFE_BASELINE && !this.hasCapacity()) {
            await new Promise<void>((resolve) => {
                this.queue.push(resolve);
                // console.log(
                //     `Queueing request. Active: ${this.activeJobs}, Queue Length: ${this.queue.length}`
                // );
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
