export interface RunResult { // describes the outcome of a single run
  config: { // configuration used for the run
    id: string; // unique identifier of the run
    model: string; // LLM model name
    prompt: string; // prompt text or identifier
    embedding: string; // embedding method used
    rag: string; // retrieval augmented generation strategy
  }; // end config block
  transcriptName: string; // name of the transcript file
  runNumber: number; // the sequential run number
  timestamp: string; // time when the run was executed
  result: { // result returned from the run
    metadata: { // meta information about the result
      latencyMs: number; // latency in milliseconds
      cost: number; // cost in dollars
      metrics: { // evaluation metrics
        llmCritic: number; // score assigned by LLM critic
      }; // end metrics
    }; // end metadata
  }; // end result
} // end interface RunResult

export type AggregatedResult = { // summary information across runs
  id: string; // identifier from the configuration
  model: string; // model evaluated
  prompt: string; // prompt used for evaluation
  embedding: string; // embedding technique applied
  rag: string; // rag method in use
  transcriptName: string; // transcript common to aggregated runs
  latency: { mean: number; std: number }; // latency statistics
  cost: { mean: number; std: number }; // cost statistics
  llmCritic: { mean: number; std: number }; // llm critic score statistics
  uniqueId: string; // unique identifier for aggregated result
}; // end AggregatedResult type
