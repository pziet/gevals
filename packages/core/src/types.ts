export type ModelId = "gpt-4o-mini" | "gpt-4.1-mini" | "gpt-4.1-nano";
export type EmbeddingId = "text-embedding-3-small" | "text-embedding-3-large"
export type RagId = "simple" | "rerank";

// Adopt .yaml config file naming convention: {model}-{embedding}-{rag}.yaml and make this the the EvalConfig.id

export interface EvalConfig {
  id: string;
  model: ModelId;
  prompt: string;
  embedding: EmbeddingId;
  rag: RagId;
}