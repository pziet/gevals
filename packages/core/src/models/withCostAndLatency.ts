
export async function withCostAndLatency<T>(
  fn: () => Promise<T>
): Promise<{ result: T; latencyMs: number; tokens: number; costUsd: number }> {
  const start = Date.now();
  const result = await fn();
  const latencyMs = Date.now() - start;
  // TODO: Extract tokens and cost from OpenAI response
  return { result, latencyMs, tokens: 0, costUsd: 0 };
}