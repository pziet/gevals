import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function calculateStats(values: number[]): { mean: number; std: number } {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(
    values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
  );
  return { mean, std };
}

export async function GET() {
  try {
    const resultsDir = path.join(process.cwd(), '../../results');
    const configDirs = fs.readdirSync(resultsDir);

    const aggregatedResults = [];

    for (const configDir of configDirs) {
      const configPath = path.join(resultsDir, configDir);
      if (!fs.statSync(configPath).isDirectory()) continue;
      
      // Find all transcript directories within the config directory
      const transcriptDirs = fs.readdirSync(configPath)
        .filter(dir => fs.statSync(path.join(configPath, dir)).isDirectory());
      
      for (const transcriptDir of transcriptDirs) {
        const transcriptPath = path.join(configPath, transcriptDir);
        
        const runs = [];
        for (let i = 0; i < 5; i++) {  // Assuming 5 runs per transcript
          const filePath = path.join(transcriptPath, `${i}.json`);
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            runs.push(JSON.parse(content));
          }
        }

        if (runs.length === 0) continue;

        const firstRun = runs[0];
        const latencies = runs.map(r => r.result.metadata.latencyMs);
        const costs = runs.map(r => r.result.metadata.cost);
        const llmCritics = runs.map(r => r.result.metadata.metrics.llmCritic);

        aggregatedResults.push({
          id: firstRun.config.id,
          model: firstRun.config.model,
          prompt: firstRun.config.prompt,
          embedding: firstRun.config.embedding,
          rag: firstRun.config.rag,
          transcriptName: firstRun.transcriptName,
          latency: calculateStats(latencies),
          cost: calculateStats(costs),
          llmCritic: calculateStats(llmCritics),
        });
      }
    }

    return NextResponse.json(aggregatedResults);
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}
