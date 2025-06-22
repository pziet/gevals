// Types describing evaluation configuration
import { EvalConfig } from "../types.js"; // evaluation config type
// RAG helper functions for processing transcripts
import { deleteCollection, processTranscript, getRAGprompt } from "./rag.js"; // rag helpers
// OpenAI client for chat completions
import { OpenAI } from "openai"; // OpenAI client
// Registry to compute evaluation metrics
import { computeAll } from "../metrics/registry.js"; // metric registry
// Node helpers
import { readFileSync } from "fs"; // fs helpers
import path from "path"; // path utilities
// Resolve workspace relative paths
import { getWorkspacePath } from "../utils/paths.js"; // resolve workspace paths

// usage: gevals run configs/<config-name>.yaml or gevals run .
// Execute the evaluation pipeline for a single transcript
export async function runPipeline(
  config: EvalConfig, // evaluation configuration
  transcriptName: string, // identifier for transcript
  transcriptContent: string, // raw transcript text
  promptFileContent: string, // prompt prefix
  roughNotes: string, // original notes
  runId: string, // unique run identifier
): Promise<{ enhancedNotes: string; metadata: any }> {
  // Capture start time for latency measurement
  const startTime = Date.now();

  // 1. Process files: split the transcript and store embeddings
  await processTranscript(
    config.id, // collection id
    transcriptName, // file name
    transcriptContent, // text content
    config.embedding, // embedding model
    runId, // run identifier
  );

  // 2. RAG processing: build the prompt using retrieved chunks and rough notes
  const prompt = await getRAGprompt(
    config.id, // collection id
    transcriptName, // file name
    roughNotes, // rough notes
    config.rag, // retrieval method
    runId, // run id
  );

  // 3. Call the language model to produce enhanced notes
  // Create OpenAI client using the API key from env
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // API key
  });
  const response = await openai.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system", content: promptFileContent }, // system prompt
      { role: "user", content: prompt.prompt }, // user prompt containing context
    ],
  });
  // Final assistant message contains the enhanced notes
  const enhancedNotes = response.choices[0].message.content; // model output

  // 4. Compute metrics
  // Read gold standard transcript and evaluate generated notes
  const goldStandard = readFileSync(
    getWorkspacePath(path.join("data", "cwt", "gold_standard.txt")),
    "utf-8",
  ); // load reference notes
  const metrics = await computeAll(goldStandard, enhancedNotes || ""); // evaluate

  // 5. Clean up the temporary embedding collection
  await deleteCollection(config.id, transcriptName, runId); // remove embeddings

  // Calculate total pipeline latency
  const totalLatencyMs = Date.now() - startTime; // compute total time

  // Return generated notes along with token usage, latency and metrics
  return {
    enhancedNotes: enhancedNotes || "",
    metadata: {
      model: config.model,
      ragMethod: config.rag,
      embeddingModel: config.embedding,
      tokensUsed: prompt.total_tokens + (response.usage?.total_tokens || 0),
      latencyMs: totalLatencyMs,
      cost:
        calculateCost(
          response.usage?.prompt_tokens || 0,
          response.usage?.completion_tokens || 0,
          config.model,
        ) +
        calculateCost(
          prompt.prompt_tokens,
          prompt.completion_tokens,
          "gpt-4o-mini",
        ),
      metrics,
    },
  };
}

// Helper function to calculate cost based on model and token usage
function calculateCost(
  inputTokens: number, // tokens sent to model
  outputTokens: number, // tokens generated
  model: string, // model identifier
): number {
  // Define rates for input and output tokens in USD
  const million = 1000000;
  const rates: Record<string, { input: number; output: number }> = {
    "gpt-4o-mini": { input: 0.6 / million, output: 2.4 / million }, // $0.60/1M input, $2.40/1M output
    "gpt-4.1": { input: 2 / million, output: 8 / million }, // $2/1M input, $8/1M output
    "gpt-4.1-mini": { input: 0.4 / million, output: 1.6 / million }, // $0.40/1M input, $1.60/1M output
    "gpt-4.1-nano": { input: 0.1 / million, output: 0.4 / million }, // $0.10/1M input, $0.40/1M output
  };

  const modelRates = rates[model] || { input: 0, output: 0 }; // lookup rates
  return inputTokens * modelRates.input + outputTokens * modelRates.output; // cost in USD
}
