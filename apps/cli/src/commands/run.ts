import { Command } from "commander";
import { Queue, QueueEvents } from "bullmq";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { glob } from "glob";
import { parse } from "yaml";
import path from "path";
import * as dotenv from 'dotenv';
dotenv.config();

const NSIM = 5; // Number of simulations per config

// Create queue and queue events instances
const evalQueue = new Queue('eval', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

const queueEvents = new QueueEvents('eval', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

// usage: gevals run configs/<config-name>.yaml or gevals run . 

const runCmd = new Command("run")
  .description("Run evaluations from config files")
  .argument("<configs...>", "Config file(s) or glob patterns")
  .action(async (configs: string[]) => {
    console.log("Running evaluations for configs:", configs);
    
    // Handle both single config and directory case
    const configFiles = configs.flatMap(config => {
      if (config === ".") {
        return glob.sync("configs/*.yaml");
      }
      return [config];
    });

    // Get all transcript files
    let transcriptFiles = glob.sync("data/cwt/noise-level-*.json");
    if (configFiles.some(file => file.includes('baseline/baseline.yaml'))) {
      console.log("Baseline config detected - using only the first noise level transcript");
      // Sort to ensure we get the lowest noise level (assuming naming convention like noise-level-0.json)
      transcriptFiles.sort();
      // Take only the first transcript file
      transcriptFiles = [transcriptFiles[0]];
      console.log("Using only:", transcriptFiles);
    }
    // Create jobs array to track all jobs
    const jobs = [];

    for (const configFile of configFiles) {
      console.log(`Processing config: ${configFile}`);
      const configContent = readFileSync(configFile, "utf-8");
      const config = parse(configContent);
      const promptFile = glob.sync(`prompts/${config.prompt}`);
      const promptFileContent = readFileSync(promptFile[0], "utf-8");

      for (const transcriptFile of transcriptFiles) {
        console.log(`Processing transcript: ${transcriptFile}`);
        const transcriptJson = JSON.parse(readFileSync(transcriptFile, "utf-8"));
        const transcriptContent = transcriptJson.text;
        // Extract transcript name from filename
        const transcriptName = path.basename(transcriptFile, ".json");
        // For now, using a dummy rough notes - you might want to modify this
        const roughNotes = readFileSync("data/cwt/rough_notes.txt", "utf-8");
        
        // Create results directory for this config if it doesn't exist
        const resultsDir = path.join(process.cwd(), "results", config.id, transcriptName);
        if (!existsSync(resultsDir)) {
          mkdirSync(resultsDir, { recursive: true });
        }

        // Create NSIM jobs for each config/transcript combination
        for (let i = 0; i < NSIM; i++) {
          const jobId = `${config.id}-${transcriptName}-${i}`;
          const resultFile = path.join(resultsDir, `${i}.json`);
          // Skip if result already exists
          if (existsSync(resultFile)) {
            console.log(`Skipping run ${i} for ${config.id} - result already exists`);
            continue;
          }

          // Add job to queue
          const job = await evalQueue.add(jobId, {
            config,
            transcriptName,
            transcriptContent,
            promptFileContent,
            roughNotes,
            resultFile
          });
          
          jobs.push(job);
          console.log(`Added job ${jobId} to queue`);
        }
      }
    }

    // Wait for all jobs to complete
    console.log(`Waiting for ${jobs.length} jobs to complete...`);
    await Promise.all(jobs.map(job => job.waitUntilFinished(queueEvents)));
    console.log('All jobs completed!');

    // Clean up
    await evalQueue.close();
    await queueEvents.close();
  });

export default runCmd;