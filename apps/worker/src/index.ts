import { Worker, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { runPipeline } from '@gevals/core';
import * as dotenv from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import express from 'express';
import path from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { getWorkspacePath } from '@gevals/core';

// Load environment variables
dotenv.config();

// Number of jobs to process in parallel
const CONCURRENCY = 10;

// Initialize Prisma client
const prisma = new PrismaClient();

// Create a queue for evaluation jobs
const evalQueue = new Queue('eval', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

// Create a worker to process jobs
const worker = new Worker('eval', async (job) => {
  const { config, transcriptName, transcriptContent, promptFileContent, roughNotes, resultFile } = job.data;
  
  try {
    console.log(`Processing job ${job.id} for config ${config.id}`);
    
    // Extract run ID from the job ID
    const jobParts = job.id?.split('-') || [];
    const runId = jobParts[jobParts.length - 1];
    
    const result = await runPipeline(
      config,
      transcriptName,
      transcriptContent,
      promptFileContent,
      roughNotes,
      runId
    );

    // Save result to database
    await prisma.run.create({
      data: {
        configHash: config.id,
        finishedAt: new Date(),
        latencyMs: result.metadata.latencyMs,
        costUsd: result.metadata.cost,
        metrics: result.metadata.metrics,
        resultJson: result
      }
    });

    // Make sure the directory exists
    const resultFileDir = path.dirname(resultFile);
    if (!existsSync(resultFileDir)) {
      mkdirSync(resultFileDir, { recursive: true });
    }
    
    // Create absolute path to ensure it's saved in the project root
    // This handles both monorepo and standalone app scenarios
    const absoluteResultFile = path.isAbsolute(resultFile) 
      ? resultFile 
      : path.join(process.cwd(), '..', '..', resultFile);
    
    const resultData = {
      config,
      transcriptName,
      runNumber: parseInt(runId),
      timestamp: new Date().toISOString(),
      result
    };
    
    writeFileSync(absoluteResultFile, JSON.stringify(resultData, null, 2));
    console.log(`Saved result to ${absoluteResultFile}`);
    return result;
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    throw error;
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  concurrency: CONCURRENCY
});

// Handle worker events
worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});

worker.on('error', (error) => {
  console.error('Worker error:', error);
});

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await worker.close();
  await evalQueue.close();
  await prisma.$disconnect();
  process.exit(0);
});

console.log('Worker started, waiting for jobs...');

// Create Bull Board
const serverAdapter = new ExpressAdapter();
const { addQueue, removeQueue, setQueues } = createBullBoard({
  queues: [new BullMQAdapter(evalQueue)],
  serverAdapter,
});

const app = express();
serverAdapter.setBasePath('/admin/queues');
app.use('/admin/queues', serverAdapter.getRouter());

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Bull Board is running on http://localhost:${port}/admin/queues`);
}); 