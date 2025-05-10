import { EvalConfig } from "../types.js";
import { deleteCollection, processTranscript, queryCollection } from "./rag.js";
import { OpenAI } from "openai";
// ...import other needed modules

// usage: gevals run configs/<config-name>.yaml or gevals run . 

export async function runPipeline(
  config: EvalConfig,
  transcriptName: string,
  transcriptContent: string,
  roughNotes: string
): Promise<{ enhancedNotes: string; metadata: any }> {
  // 1. Process files: Chunk and embed transcript 
  console.log("Processing file:", transcriptName);
  await processTranscript(
    config.id, 
    transcriptName,
    transcriptContent,
    config.embedding
  );

  // 2. Query collection and retrieve relevant chunks
  const textResults = await queryCollection(
    config.id, 
    transcriptName, 
    roughNotes
  );
  console.log("Text results:", textResults);

  // 3. Compose prompt: system prompt + relevant chunks + rough notes
  const prompt = `
  ${config.prompt}

  Here are the rough notes:
  <rough_notes>
  ${roughNotes}
  </rough_notes>
  Here are the relevant chunks:
  <relevant_chunks>
  ${textResults.documents.map(doc => doc[0]).join('\n\n')}
  </relevant_chunks>

  Now take the rough notes and the relevant chunks and generate the "Enhanced Notes".
  `;
  
  // 4. Call model (OpenAI, etc.) to generate enhanced notes
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const response = await openai.chat.completions.create({
    model: config.model,
    messages: [{ role: "system", content: prompt }],
  });
  console.log(response);
  // 5. Return enhanced notes + metadata (tokens, latency, etc.)
  const enhancedNotes = response.choices[0].message.content;
  console.log(enhancedNotes);

  //  Clean up
  await deleteCollection(config.id, transcriptName);

  // Dummy implementation to satisfy return type
  return {
    enhancedNotes: `Enhanced version of: ${roughNotes.substring(0, 50)}...`,
    metadata: {
      model: config.model,
      ragMethod: config.rag,
      embeddingModel: config.embedding,
      tokensUsed: 0,
      latencyMs: 0,
      cost: 0
    }
  };
}