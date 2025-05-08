export type ModelId = "o4-mini" | "gpt-4.1-mini" | "gpt-4.1-nano";
export type EmbeddingId = "text-embedding-ada-002" | "text-embedding-3-small" | "text-embedding-3-large" | "all-MiniLM-L6-v2";
export type RagId = "bm25" | "rerank";

export interface EvalConfig {
  id: string;
  model: ModelId;
  prompt: string;
  embedding: EmbeddingId;
  rag: RagId;
}