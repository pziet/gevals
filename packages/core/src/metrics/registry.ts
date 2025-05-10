import { OpenAI } from "openai";

export type MetricFn = (goldStandard: string, enhancedNotes: string) => Promise<number>;

const registry = new Map<string, MetricFn>();

export function register(name: string, fn: MetricFn) {
  registry.set(name, fn);
}

export async function computeAll(goldStandard: string, enhancedNotes: string) {
  const out: Record<string, number> = {};
  for (const [name, fn] of registry) {
    out[name] = await fn(goldStandard, enhancedNotes);
  }
  return out;
}

// LLM Critic Metric
export async function llmCritic(goldStandard: string, enhancedNotes: string): Promise<number> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a strict and objective critic. Always provide a numerical score and explanation." },
      { role: "user", content: prompt }
    ],
  });

  const content = response.choices[0].message.content;
  const scoreMatch = content?.match(/Score:\s*(\d+)/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

  return score;
}

// Register the LLM critic metric
register("llmCritic", llmCritic);
