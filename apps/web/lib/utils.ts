import { clsx, type ClassValue } from "clsx" // utility for conditional classes
import { twMerge } from "tailwind-merge" // merges Tailwind class strings

export function cn(...inputs: ClassValue[]) { // convenience function to combine class names
  return twMerge(clsx(inputs)) // merge them using tailwind-merge
} // end cn

export interface RunResult { // describes the result of an individual run
  config: { // configuration object for the run
    id: string; // unique run identifier
    model: string; // model used for the run
    prompt: string; // prompt text used
    embedding: string; // embedding type
    rag: string; // rag strategy
  }; // end config
  transcriptName: string; // associated transcript name
  runNumber: number; // sequential run number
  timestamp: string; // timestamp of execution
  result: { // result data
    metadata: { // metadata block
      latencyMs: number; // response latency
      cost: number; // cost of execution
      metrics: { // metrics for evaluation
        llmCritic: number; // llm critic score
      }; // end metrics
    }; // end metadata
  }; // end result
} // end interface RunResult

export interface AggregatedResult { // aggregated metrics across runs
  id: string; // id of the run configuration
  model: string; // model name
  prompt: string; // prompt text
  embedding: string; // embedding method
  rag: string; // rag approach
  transcriptName: string; // transcript used
  latency: { // latency statistics
    mean: number; // mean latency
    std: number; // standard deviation
  }; // end latency
  cost: { // cost statistics
    mean: number; // mean cost
    std: number; // standard deviation
  }; // end cost
  llmCritic: { // llm critic statistics
    mean: number; // mean llm critic score
    std: number; // standard deviation
  }; // end llmCritic
} // end AggregatedResult interface
