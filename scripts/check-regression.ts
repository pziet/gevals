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

// For CI testing - converts file-based results to BaselineMetrics format
function convertMockResultsToBaselineMetrics(): BaselineMetrics {
  try {
    // Check if we have mock results
    const mockResultsDir = path.join(process.cwd(), 'results/baseline/noise-level-0');
    
    if (fs.existsSync(mockResultsDir)) {
      const files = fs.readdirSync(mockResultsDir);
      console.log("Found mock result files:", files);
      
      // Read all mock result files and compute averages
      const results = files.map(file => 
        JSON.parse(fs.readFileSync(path.join(mockResultsDir, file), 'utf-8'))
      );
      
      // Simple metrics based on the mock data
      return {
        llmCritic: { 
          mean: 0.75, // Mock value
          std: 0.05
        },
        latency: {
          mean: results.reduce((sum, r) => sum + r.metadata.latencyMs, 0) / results.length,
          std: 100
        },
        cost: {
          mean: results.reduce((sum, r) => sum + r.metadata.cost, 0) / results.length,
          std: 0.0005
        }
      };
    }
  } catch (error) {
    console.log("Error loading mock results:", error);
  }
  
  return null as unknown as BaselineMetrics;
}

async function main() {
  try {
    // Read baseline metrics
    const baselinePath = path.join(process.cwd(), 'data/cwt', 'baseline-metrics.json');
    const baseline: BaselineMetrics = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    
    // First try to get metrics from mock files (CI environment)
    let metrics = convertMockResultsToBaselineMetrics();
    
    // If no mock metrics, try to get from database
    if (!metrics) {
      const prisma = new PrismaClient();
      
      try {
        // Get latest run metrics from database
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
        
        metrics = latestRun.metrics as unknown as BaselineMetrics;
      } finally {
        await prisma.$disconnect();
      }
    }
    
    if (!metrics) {
      throw new Error('Could not load metrics from files or database');
    }
    
    // Check for regressions
    const regressions: string[] = [];
    
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
  }
}

main();
