export interface ExecutionConfig {
    boxId: number;          // Unique ID for the sandbox instance (0-999)
    timeLimit: number;      // Wall time limit in seconds
    memoryLimit: number;    // Memory limit in KB
    maxProcesses?: number;  // Prevent fork bombs
}

export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    time: number;           // Execution time in seconds
    memory: number;         // Memory used in KB
    killedByOOM: boolean;   // True if killed by cgroup out-of-memory
    killedByTimeout: boolean;
}