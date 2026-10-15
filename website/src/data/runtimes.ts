export interface RuntimeItem {
  id: string;
  name: string;
  version: string;
  compiled: boolean;
}

export const RUNTIMES: RuntimeItem[] = [
  {
    id: "python",
    name: "Python",
    version: "3.10.13",
    compiled: false,
  },
  {
    id: "nodejs",
    name: "Node.js",
    version: "24.16.0 - 20.11.0",
    compiled: false,
  },
  {
    id: "rust",
    name: "Rust",
    version: "1.76.0",
    compiled: true,
  },
  {
    id: "java",
    name: "Java",
    version: "21.0.2",
    compiled: true,
  },
  {
    id: "go",
    name: "Go",
    version: "1.22.1",
    compiled: true,
  },
  {
    id: "cpp",
    name: "C++",
    version: "12.0.0",
    compiled: true,
  },
  {
    id: "c",
    name: "C",
    version: "12.0.0",
    compiled: true,
  },
  {
    id: "bash",
    name: "Bash",
    version: "system",
    compiled: false,
  },
  {
    id: "typescript",
    name: "TypeScript (Deno)",
    version: "1.41.3",
    compiled: false,
  },
  {
    id: "ruby",
    name: "Ruby",
    version: "3.3.0",
    compiled: false,
  },
];
