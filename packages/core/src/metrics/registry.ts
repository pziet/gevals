import { OpenAI } from "openai"; // OpenAI client for metrics

export type MetricFn = (
  goldStandard: string,
  enhancedNotes: string,
) => Promise<number>; // signature of metric

const registry = new Map<string, MetricFn>(); // store metric functions

export function register(name: string, fn: MetricFn) {
  // register a metric
  registry.set(name, fn); // save in map
}

export async function computeAll(goldStandard: string, enhancedNotes: string) {
  // run every metric
  const out: Record<string, number> = {}; // accumulate scores
  for (const [name, fn] of registry) {
    out[name] = await fn(goldStandard, enhancedNotes); // compute metric
  }
  return out; // return results
}

// LLM Critic Metric
export async function llmCritic(
  goldStandard: string,
  enhancedNotes: string,
): Promise<number> {
  // critique notes using LLM
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // from environment
  });

  const prompt = `
  You are a strict critic evaluating the quality of enhanced notes compared to a gold standard.
Rate the enhanced notes on a scale of 0-10, where:
- 10: Perfect match in content and structure
- 7-9: Very good, captures most key points with good structure
- 4-6: Acceptable, captures some key points but missing important details
- 1-3: Poor, significantly missing key points or has major structural issues
- 0: Completely misses the point

Gold Standard:
${goldStandard}

Enhanced Notes:
${enhancedNotes}

Provide your score (0-10) and a brief explanation of your rating.
Format your response as:
Score: <number>
  Explanation: <your explanation>
  `;

  const response = await openai.chat.completions.create({
    // call the model
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a strict and objective critic. Always provide a numerical score and explanation.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0].message.content; // message text
  const scoreMatch = content?.match(/Score:\s*(\d+)/); // parse score
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0; // default zero

  return score; // numeric score
}

// Register the LLM critic metric
register("llmCritic", llmCritic); // expose the metric
