import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

interface BaselineMetrics {
  llmCritic: {
    mean: number;
    std: number;
  };
  latency: {
    mean: number;
    std: number;
  };
  cost: {
    mean: number;
    std: number;
  };
}

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Read baseline metrics
    const baselinePath = path.join(process.cwd(), 'data', 'baseline-metrics.json');
    const baseline: BaselineMetrics = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    
    // Get latest run metrics
    const latestRun = await prisma.run.findFirst({
      where: {
        configHash: 'baseline' // Your baseline config hash
      },
      orderBy: {
        startedAt: 'desc'
      }
    });
    
    if (!latestRun) {
      throw new Error('No evaluation run found');
    }
    
    const metrics = latestRun.metrics as BaselineMetrics;
    
    // Check for regressions
    const regressions = [];
    
    // Check LLM Critic score (higher is better)
    if (metrics.llmCritic.mean < baseline.llmCritic.mean * 0.95) {
      regressions.push(
        `LLM Critic score dropped by ${((baseline.llmCritic.mean - metrics.llmCritic.mean) / baseline.llmCritic.mean * 100).toFixed(2)}%`
      );
    }
    
    // Check latency (lower is better)
    if (metrics.latency.mean > baseline.latency.mean * 1.1) {
      regressions.push(
        `Latency increased by ${((metrics.latency.mean - baseline.latency.mean) / baseline.latency.mean * 100).toFixed(2)}%`
      );
    }
    
    // Check cost (lower is better)
    if (metrics.cost.mean > baseline.cost.mean * 1.1) {
      regressions.push(
        `Cost increased by ${((metrics.cost.mean - baseline.cost.mean) / baseline.cost.mean * 100).toFixed(2)}%`
      );
    }
    
    if (regressions.length > 0) {
      console.error('Regression detected:');
      regressions.forEach(r => console.error(`- ${r}`));
      process.exit(1);
    }
    
    console.log('No regressions detected!');
    
  } catch (error) {
    console.error('Error checking regressions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
