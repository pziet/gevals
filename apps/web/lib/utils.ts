import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface RunResult {
  config: {
    id: string;
    model: string;
    prompt: string;
    embedding: string;
    rag: string;
  };
  transcriptName: string;
  runNumber: number;
  timestamp: string;
  result: {
    metadata: {
      latencyMs: number;
      cost: number;
      metrics: {
        llmCritic: number;
      };
    };
  };
}

export interface AggregatedResult {
  id: string;
  model: string;
  prompt: string;
  embedding: string;
  rag: string;
  transcriptName: string;
  latency: {
    mean: number;
    std: number;
  };
  cost: {
    mean: number;
    std: number;
  };
  llmCritic: {
    mean: number;
    std: number;
  };
}
