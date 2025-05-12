import { EvalConfig } from "../types.js";
import { 
  deleteCollection, 
  processTranscript, 
  getRAGprompt 
} from "./rag.js";
import { OpenAI } from "openai";
import { computeAll } from "../metrics/registry.js";
import { readFileSync } from "fs";
import path from "path";
import { getWorkspacePath } from "../utils/paths.js";


// usage: gevals run configs/<config-name>.yaml or gevals run . 

export async function runPipeline(
  config: EvalConfig,
  transcriptName: string,
  transcriptContent: string,
  promptFileContent: string,
  roughNotes: string,
  runId: string
): Promise<{ enhancedNotes: string; metadata: any }> {
  const startTime = Date.now(); // Start timing the entire pipeline

  // 1. Process files: Chunk and embed transcript 
  // console.log("Processing file:", transcriptName);
  await processTranscript(
    config.id, 
    transcriptName,
    transcriptContent,
    config.embedding,
    runId
  );

  // 2. RAG processing: Compose system prompt + relevant chunks + rough notes
  const prompt = await getRAGprompt(
    config.id, 
    transcriptName, 
    roughNotes, 
    config.rag,
    runId
  );

  // 3. Call model (OpenAI, etc.) to generate enhanced notes
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const response = await openai.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system", content: promptFileContent },
      { role: "user", content: prompt.prompt }
    ],
  });
  // 
  // console.log("Input tokens:", response.usage?.prompt_tokens);
  // console.log("Output tokens:", response.usage?.completion_tokens);
  const enhancedNotes = response.choices[0].message.content;
  // console.log("Enhanced notes:", enhancedNotes);
  // console.log("End of enhanced notes");

  // 4. Compute metrics
  // Read gold standard and compute metrics
  const goldStandard = readFileSync(getWorkspacePath(path.join("data", "cwt", "gold_standard.txt")), "utf-8");
  const metrics = await computeAll(goldStandard, enhancedNotes || "");

  // 5. Clean up
  await deleteCollection(config.id, transcriptName, runId);

  // Calculate total pipeline latency
  const totalLatencyMs = Date.now() - startTime;

  // Return actual metadata with token usage, total pipeline latency, and metrics
  return {
    enhancedNotes: enhancedNotes || "",
    metadata: {
      model: config.model,
      ragMethod: config.rag,
      embeddingModel: config.embedding,
      tokensUsed: prompt.total_tokens + (response.usage?.total_tokens || 0),
      latencyMs: totalLatencyMs,
      cost: calculateCost(
        response.usage?.prompt_tokens || 0, 
        response.usage?.completion_tokens || 0, 
        config.model
      ) + 
      calculateCost(
        prompt.prompt_tokens,
        prompt.completion_tokens,
        "gpt-4o-mini"
      ),
      metrics
    }
  };
}

// Helper function to calculate cost based on model and token usage
function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  // Define rates for input and output tokens (in USD per token)
  const million = 1000000;
  const rates: Record<string, { input: number, output: number }> = {
    'gpt-4o-mini': { input: 0.6 / million , output: 2.4 / million }, // $0.60/1M input, $2.40/1M output
    'gpt-4.1': { input: 2 / million, output: 8 / million }, // $2/1M input, $8/1M output
    'gpt-4.1-mini': { input: 0.4 / million, output: 1.6 / million }, // $0.40/1M input, $1.60/1M output
    'gpt-4.1-nano': { input: 0.1 / million, output: 0.4 / million }, // $0.10/1M input, $0.40/1M output
  };
  
  const modelRates = rates[model] || { input: 0, output: 0 };
  return (inputTokens * modelRates.input) + (outputTokens * modelRates.output);
}
