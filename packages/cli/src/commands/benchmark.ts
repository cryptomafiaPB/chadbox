import cliProgress from 'cli-progress';
import Table from 'cli-table3';
import { logger } from '../utils/logger.js';

const API_URL = 'http://127.0.0.1:3000/api/v1/execute';

export async function benchmarkCommand(
    language: string,
    options: { concurrent: string; total: string }
) {
    const concurrent = parseInt(options.concurrent, 10);
    const total = parseInt(options.total, 10);

    console.log(`\n🔥 ${logger.pc.bold('Chadbox Load Tester & Benchmark Utility')}`);
    console.log(`   Target:   ${logger.pc.cyan(language)} Environment`);
    console.log(`   Traffic:  ${total} total executions`);
    console.log(`   Spike:    ${concurrent} parallel sandboxes\n`);

    const bar = new cliProgress.SingleBar({
        format: `   Progress |${logger.pc.cyan('{bar}')}| {percentage}% || {value}/{total} Requests || ETA: {eta}s`,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
    });

    bar.start(total, 0);

    const latencies: number[] = [];
    let successes = 0;
    let failures = 0;
    let activeRequests = 0;
    let completedRequests = 0;

    // let r = '';

    const startTime = performance.now();

    // The recursive worker pool to maintain exact concurrency levels
    const worker = async () => {
        while (completedRequests + activeRequests < total) {
            activeRequests++;
            const reqStart = performance.now();

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        language: 'python3',
                        version: 'latest',
                        files: [
                            {
                                name: 'main.py',
                                content: "print('Hello from Python')",
                            },
                        ],
                    }),
                });

                // r += await response.text();
                // console.log(`Response: ${response.status} ${response.statusText} ${await response.json()}`);
                if (response.status === 200) successes++;
                else failures++;
            } catch (e) {
                failures++;
                console.error(`Request failed: ${e}`);
            }

            const reqEnd = performance.now();
            latencies.push(reqEnd - reqStart);

            activeRequests--;
            completedRequests++;
            bar.increment();
        }
    };

    // Spawn the requested number of concurrent workers
    const workers = Array.from({ length: concurrent }).map(() => worker());
    await Promise.all(workers);

    bar.stop();
    const endTime = performance.now();
    const totalTimeSeconds = (endTime - startTime) / 1000;

    // statistical analysis

    latencies.sort((a, b) => a - b);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];
    const rps = (total / totalTimeSeconds).toFixed(2);

    // render dashboard
    const statTable = new Table({ style: { head: [], border: [] } });
    statTable.push(
        ['Total Time', `${totalTimeSeconds.toFixed(2)} seconds`],
        ['Throughput', `${logger.pc.green(rps)} requests/second`],
        [
            'Success Rate',
            `${logger.pc.green(successes.toString())} OK / ${logger.pc.red(failures.toString())} Failed`,
        ]
    );

    const latencyTable = new Table({ style: { head: [], border: [] } });
    latencyTable.push(
        ['Average', `${avg.toFixed(2)} ms`],
        ['Fastest', `${latencies[0].toFixed(2)} ms`],
        ['p50 (Median)', `${p50.toFixed(2)} ms`],
        ['p95', `${logger.pc.yellow(p95.toFixed(2))} ms`],
        ['p99 (Slowest)', `${logger.pc.red(p99.toFixed(2))} ms`]
    );

    console.log(`\n📊 ${logger.pc.bold('Engine Performance')}`);
    console.log(statTable.toString());
    console.log(`\n⚡ ${logger.pc.bold('Latency Distribution')}`);
    console.log(latencyTable.toString());
    console.log('');
}
