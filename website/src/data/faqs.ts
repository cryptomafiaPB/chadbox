export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    id: "escape-prevention",
    question: "How does Chadbox prevent container escapes with untrusted code?",
    answer:
      "Chadbox enforces multi-layered defense-in-depth: separate mount, PID, network, IPC, and UTS Linux namespaces, coupled with a strict seccomp BPF filter that disallows dangerous syscalls (including ptrace, bpf, mount, reboot, and raw socket creation). Runtimes are mounted read-only via SquashFS, and writes are restricted to an isolated memory-backed scratch tmpfs with strict size caps.",
  },
  {
    id: "zero-dependencies",
    question: "Why does Chadbox not require Redis, Postgres, or queue workers?",
    answer:
      "Chadbox is intentionally engineered as a clean synchronous and streaming execution engine. Instead of buffering tasks into an external broker and causing network round-trip hops, it uses high-efficiency lock-free internal worker rings. This eliminates external points of failure, cuts idle memory to under 45MB, and drops execution dispatch overhead to sub-millisecond levels.",
  },
  {
    id: "network-access",
    question: "Can untrusted code access the public Internet or local networks?",
    answer:
      "By default, all network namespaces are completely isolated with loopback only (network: false), rendering outbound LAN and WAN traffic physically impossible for the sandbox process. If explicit network access is required, you can enable outbound-only egress routing with strict DNS filtering.",
  },
  {
    id: "oom-handling",
    question: "How does memory limit enforcement (OOM) work under load?",
    answer:
      "Chadbox programs cgroup v2 memory.max directly on the child namespace. If an untrusted script allocates beyond the specified quota (e.g., 128MB), the Linux kernel OOM killer terminates the child process with a precise SIGKILL signal in under 1 millisecond, without impacting the host engine or any neighboring executions.",
  },
  {
    id: "custom-runtimes",
    question: "How do I build and register a custom language runtime bundle?",
    answer:
      "Assemble any directory containing your interpreter binary and standard libraries, then run `mksquashfs ./runtime ./bundle.sqfs -comp zstd`. Place the generated SquashFS file into Chadbox's /runtimes mount point; the engine will immediately detect, index, and cache it for execution.",
  },
];
