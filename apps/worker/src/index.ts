import { Worker, Queue } from 'bullmq'; // worker and queue classes
import { PrismaClient } from '@prisma/client'; // ORM client for database
import { runPipeline } from '@gevals/core'; // core evaluation pipeline
import * as dotenv from 'dotenv'; // environment variable loader
import { createBullBoard } from '@bull-board/api'; // bull board API
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js'; // adapter for BullMQ
import { ExpressAdapter } from '@bull-board/express'; // express integration
import express from 'express'; // express server
import path from 'path'; // path utilities
import { writeFileSync, existsSync, mkdirSync } from 'fs'; // filesystem helpers
import { getWorkspacePath } from '@gevals/core'; // workspace path helper

// Load environment variables
dotenv.config(); // initialize dotenv

// Number of jobs to process in parallel
const CONCURRENCY = 10; // concurrency level

// Initialize Prisma client
const prisma = new PrismaClient(); // database client

// Create a queue for evaluation jobs
const evalQueue = new Queue('eval', { // queue name "eval"
  connection: { // redis connection options
    host: process.env.REDIS_HOST || 'localhost', // redis host
    port: parseInt(process.env.REDIS_PORT || '6379') // redis port
  }
}); // end queue setup

// Create a worker to process jobs
const worker = new Worker('eval', async (job) => { // worker for the eval queue
  const { config, transcriptName, transcriptContent, promptFileContent, roughNotes, resultFile } = job.data; // job payload
  
  try { // catch job errors
    console.log(`Processing job ${job.id} for config ${config.id}`); // log start
    
    // Extract run ID from the job ID
    const jobParts = job.id?.split('-') || []; // split by dash
    const runId = jobParts[jobParts.length - 1]; // last part is run number
    
    const result = await runPipeline( // execute pipeline
      config, // evaluation config
      transcriptName, // name of transcript
      transcriptContent, // transcript text
      promptFileContent, // prompt text
      roughNotes, // notes text
      runId // run identifier
    ); // end pipeline call

    // Save result to database
    await prisma.run.create({ // insert run record
      data: {
        configHash: config.id, // hash id
        finishedAt: new Date(), // timestamp
        latencyMs: result.metadata.latencyMs, // latency metric
        costUsd: result.metadata.cost, // cost metric
        metrics: result.metadata.metrics, // evaluation metrics
        resultJson: result // full result
      }
    }); // end create

    // Make sure the directory exists
    const resultFileDir = path.dirname(resultFile); // directory for file
    if (!existsSync(resultFileDir)) { // create if missing
      mkdirSync(resultFileDir, { recursive: true }); // recursive mkdir
    }
    
    // Create absolute path to ensure it's saved in the project root
    // This handles both monorepo and standalone app scenarios
    const absoluteResultFile = path.isAbsolute(resultFile)
      ? resultFile // already absolute
      : path.join(process.cwd(), '..', '..', resultFile); // convert to absolute
    
    const resultData = { // object to persist
      config, // configuration used
      transcriptName, // transcript name
      runNumber: parseInt(runId), // numeric run id
      timestamp: new Date().toISOString(), // time of run
      result // pipeline result
    };
    
    writeFileSync(absoluteResultFile, JSON.stringify(resultData, null, 2)); // save to disk
    console.log(`Saved result to ${absoluteResultFile}`); // confirm save
    return result; // return pipeline output
  } catch (error) { // handle errors
    console.error(`Job ${job.id} failed:`, error); // log failure
    throw error; // rethrow
  }
}, {
  connection: { // redis options for worker
    host: process.env.REDIS_HOST || 'localhost', // redis host
    port: parseInt(process.env.REDIS_PORT || '6379') // redis port
  },
  concurrency: CONCURRENCY // parallel jobs
}); // end worker

// Handle worker events
worker.on('completed', (job) => { // when job completes
  console.log(`Job ${job.id} completed`); // log completion
}); // end completed handler

worker.on('failed', (job, error) => { // on failure
  console.error(`Job ${job?.id} failed:`, error); // log failure
}); // end failed handler

worker.on('error', (error) => { // general worker error
  console.error('Worker error:', error); // log error
}); // end error handler

// Handle process termination
process.on('SIGTERM', async () => { // graceful shutdown
  console.log('SIGTERM received, shutting down...'); // notify
  await worker.close(); // close worker
  await evalQueue.close(); // close queue
  await prisma.$disconnect(); // disconnect prisma
  process.exit(0); // exit process
}); // end SIGTERM handler

console.log('Worker started, waiting for jobs...'); // startup log

// Create Bull Board
const serverAdapter = new ExpressAdapter(); // express adapter for bull board
const { addQueue, removeQueue, setQueues } = createBullBoard({ // init dashboard
  queues: [new BullMQAdapter(evalQueue)], // monitor eval queue
  serverAdapter, // adapter instance
}); // end bull board setup

const app = express(); // create express app
serverAdapter.setBasePath('/admin/queues'); // base path for UI
app.use('/admin/queues', serverAdapter.getRouter()); // mount router

// Start the server
const port = process.env.PORT || 3000; // port for dashboard
app.listen(port, () => { // launch server
  console.log(`Bull Board is running on http://localhost:${port}/admin/queues`); // log URL
}); // end listen
