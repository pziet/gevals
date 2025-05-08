export type MetricFn = (gt: string, pred: string) => Promise<number>;

const registry = new Map<string, MetricFn>();

export function register(name: string, fn: MetricFn) {
  registry.set(name, fn);
}

export async function computeAll(gt: string, pred: string) {
  const out: Record<string, number> = {};
  for (const [k, fn] of registry) out[k] = await fn(gt, pred);
  return out;
}