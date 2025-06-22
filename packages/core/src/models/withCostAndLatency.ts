export async function withCostAndLatency<T>( // wrapper measuring cost and latency
  fn: () => Promise<T>,
): Promise<{ result: T; latencyMs: number; tokens: number; costUsd: number }> {
  const start = Date.now(); // capture start time
  const result = await fn(); // execute function
  const latencyMs = Date.now() - start; // compute latency
  // TODO: Extract tokens and cost from OpenAI response
  return { result, latencyMs, tokens: 0, costUsd: 0 }; // placeholder values
}
