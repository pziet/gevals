export type ModelId = "gpt-4o-mini" | "gpt-4.1-mini" | "gpt-4.1-nano"; // supported models
export type EmbeddingId = "text-embedding-3-small" | "text-embedding-3-large"; // embedding options
export type RagId = "simple" | "rerank"; // retrieval methods
export type DataSet =
  | "noise-level-0"
  | "noise-level-1"
  | "noise-level-2"
  | "noise-level-3"; // dataset names

// Adopt .yaml config file naming convention: {model}-{embedding}-{rag}.yaml and make this the the EvalConfig.id

export interface EvalConfig {
  // configuration loaded from YAML
  id: string;
  model: ModelId;
  prompt: string;
  embedding: EmbeddingId;
  rag: RagId;
}
