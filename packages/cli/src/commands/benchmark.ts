import cliProgress from 'cli-progress';
import Table from 'cli-table3';
import { logger } from '../utils/logger.js';
import pc from 'picocolors';
import type { ExecutionResponse } from '@chadbox/shared';

const API_URL = 'http://127.0.0.1:3000/api/v1/execute';

// --- THE PAYLOAD MATRIX ---
// Simulates real-world traffic with a mix of fast scripts and heavy compilations
const PAYLOADS = [
    {
        language: 'python3',
        run_timeout: 3000,
        files: [{ name: 'main.py', content: 'print("Benchmarking Python Engine")' }],
    },
    {
        language: 'nodejs',
        run_timeout: 3000,
        files: [{ name: 'index.js', content: 'console.log(144);' }],
    },
    // {
    //     language: 'go',
    //     run_timeout: 3000,
    //     compile_timeout: 10000,
    //     files: [
    //         {
    //             name: 'main.go',
    //             content: 'package main\nimport "fmt"\nfunc main() { fmt.Println("Go is fast!") }',
    //         },
    //     ],
    // },
    {
        language: 'cpp',
        run_timeout: 3000,
        compile_timeout: 10000,
        files: [
            {
                name: 'main.cpp',
                content:
                    '#include <iostream>\nint main() { std::cout << "C++ Compiled" << std::endl; return 0; }',
            },
        ],
    },
    {
        language: 'rust',
        run_timeout: 3000,
        compile_timeout: 10000,
        files: [{ name: 'main.rs', content: 'fn main() { println!("Rust verified!"); }' }],
    },
    {
        language: 'java',
        run_timeout: 3000,
        files: [
            {
                name: 'Main.java',
                content:
                    'public class Main { public static void main(String[] args) { System.out.println("Hello, World!"); } }',
            },
        ],
    },
    {
        language: 'typescript',
        run_timeout: 3000,
        files: [
            {
                name: 'main.ts',
                content: 'const message: string = "TypeScript is awesome!"; console.log(message);',
            },
        ],
    },
    {
        language: 'ruby',
        run_timeout: 3000,
        files: [{ name: 'main.rb', content: 'puts "Ruby is elegant!"' }],
    },
    {
        language: 'bash',
        run_timeout: 3000,
        files: [{ name: 'main.sh', content: 'echo "Bash scripting!"' }],
    },
];

export async function benchmarkCommand(
    languageFilter: string | 'all',
    options: { concurrent: string; total: string }
) {
    const concurrent = parseInt(options.concurrent, 10);
    const total = parseInt(options.total, 10);

    // Filter payloads based on user input
    const activePayloads =
        languageFilter === 'all' ? PAYLOADS : PAYLOADS.filter((p) => p.language === languageFilter);

    if (activePayloads.length === 0) {
        console.log(pc.red(`✖ No benchmark payloads configured for language: ${languageFilter}`));
        return;
    }

    console.log(`\n🔥 ${pc.bold('Chadbox Load Tester & Benchmark Utility (V2)')}`);
    console.log(`   Target:   ${pc.cyan(languageFilter.toUpperCase())} Environment(s)`);
    console.log(`   Traffic:  ${total} total executions`);
    console.log(`   Spike:    ${concurrent} parallel sandboxes\n`);

    const bar = new cliProgress.SingleBar({
        format: `   Progress |${pc.cyan('{bar}')}| {percentage}% || {value}/{total} Requests || ETA: {eta}s`,
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

    // Granular failure tracking
    let compileErrors = 0;
    let runtimeErrors = 0;
    let engineErrors = 0;

    const startTime = performance.now();

    const worker = async () => {
        while (completedRequests + activeRequests < total) {
            activeRequests++;
            const reqStart = performance.now();

            // Round-robin payload selection to simulate mixed traffic
            const payload =
                activePayloads[(completedRequests + activeRequests) % activePayloads.length];

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                const reqEnd = performance.now();
                latencies.push(reqEnd - reqStart);

                if (response.status === 200) {
                    const result = (await response.json()) as ExecutionResponse;
                    if (result.status === 'OK') successes++;
                    else if (result.compile && result.compile.code !== 0) {
                        failures++;
                        compileErrors++;
                    } else {
                        failures++;
                        runtimeErrors++;
                    }
                } else {
                    // Capture response body to aid debugging (language not installed, 429, 500, etc.)
                    let bodyText = '';
                    try {
                        bodyText = await response.text();
                    } catch (e) {
                        bodyText = '<failed to read body>';
                    }
                    failures++;
                    engineErrors++;
                    logger.error(
                        `Engine responded ${response.status} for language=${payload.language}: ${bodyText}`
                    );
                }
            } catch (e) {
                failures++;
                engineErrors++;
                logger.error(`Request failed for language=${payload.language}: ${String(e)}`);
            }

            activeRequests--;
            completedRequests++;
            bar.increment();
        }
    };

    const workers = Array.from({ length: concurrent }).map(() => worker());
    await Promise.all(workers);

    bar.stop();
    const endTime = performance.now();
    const totalTimeSeconds = (endTime - startTime) / 1000;

    latencies.sort((a, b) => a - b);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];
    const rps = (total / totalTimeSeconds).toFixed(2);

    const statTable = new Table({ style: { head: [], border: [] } });
    statTable.push(
        ['Total Time', `${totalTimeSeconds.toFixed(2)} seconds`],
        ['Throughput', `${pc.green(rps)} requests/second`],
        [
            'True Success',
            `${pc.green(successes.toString())} OK / ${pc.red(failures.toString())} Failed`,
        ]
    );

    if (failures > 0) {
        statTable.push([
            'Failure Breakdown',
            `Compile Errs: ${compileErrors} | Runtime Errs: ${runtimeErrors} | Engine Errs: ${engineErrors}`,
        ]);
    }

    const latencyTable = new Table({ style: { head: [], border: [] } });
    latencyTable.push(
        ['Average', `${avg.toFixed(2)} ms`],
        ['Fastest', `${latencies[0].toFixed(2)} ms`],
        ['p50 (Median)', `${p50.toFixed(2)} ms`],
        ['p95', `${pc.yellow(p95.toFixed(2))} ms`],
        ['p99 (Slowest)', `${pc.red(p99.toFixed(2))} ms`]
    );

    console.log(`\n📊 ${pc.bold('Engine Performance')}`);
    console.log(statTable.toString());
    console.log(`\n⚡ ${pc.bold('Latency Distribution')}`);
    console.log(latencyTable.toString());
    console.log('');
}
