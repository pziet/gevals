import { Command } from "commander"; // CLI command utilities
import { Queue, QueueEvents } from "bullmq"; // Job queue library
import { readFileSync, existsSync, mkdirSync } from "fs"; // File system helpers
import { glob } from "glob"; // Glob pattern matching
import { parse } from "yaml"; // YAML parser
import path from "path"; // Node path utilities
import * as dotenv from 'dotenv'; // Environment variable loader
dotenv.config(); // Load environment variables

const NSIM = 5; // Number of simulations per config

// Create queue and queue events instances
const evalQueue = new Queue('eval', { // Queue for evaluation jobs
  connection: { // Redis connection details
    host: process.env.REDIS_HOST || 'localhost', // Redis hostname
    port: parseInt(process.env.REDIS_PORT || '6379') // Redis port number
  }
}); // End queue creation

const queueEvents = new QueueEvents('eval', { // Events instance for queue
  connection: { // Redis connection details
    host: process.env.REDIS_HOST || 'localhost', // Redis hostname
    port: parseInt(process.env.REDIS_PORT || '6379') // Redis port number
  }
}); // End events creation

// usage: gevals run configs/<config-name>.yaml or gevals run . 

const runCmd = new Command("run") // Define the "run" command
  .description("Run evaluations from config files") // Description of command
  .argument("<configs...>", "Config file(s) or glob patterns") // Accept config paths
  .action(async (configs: string[]) => { // Handler for execution
    console.log("Running evaluations for configs:", configs); // Log provided configs
    
    // Handle both single config and directory case
    const configFiles = configs.flatMap(config => { // Expand configs
      if (config === ".") { // Dot indicates default config directory
        return glob.sync("configs/*.yaml"); // Find all yaml files
      }
      return [config]; // Use provided file
    }); // End flatMap

    // Get all transcript files
    let transcriptFiles = glob.sync("data/cwt/noise-level-*.json"); // Locate transcripts
    if (configFiles.some(file => file.includes('baseline/baseline.yaml'))) { // Special baseline case
      console.log("Baseline config detected - using only the first noise level transcript"); // Explain behavior
      // Sort to ensure we get the lowest noise level (assuming naming convention like noise-level-0.json)
      transcriptFiles.sort(); // Sort transcripts
      // Take only the first transcript file
      transcriptFiles = [transcriptFiles[0]]; // Use only the lowest noise level transcript
      console.log("Using only:", transcriptFiles); // Log chosen transcript
    }
    // Create jobs array to track all jobs
    const jobs = []; // Store created jobs

    for (const configFile of configFiles) { // Iterate over configs
      console.log(`Processing config: ${configFile}`); // Log current config
      const configContent = readFileSync(configFile, "utf-8"); // Read config file
      const config = parse(configContent); // Parse YAML data
      const promptFile = glob.sync(`prompts/${config.prompt}`); // Locate prompt file
      const promptFileContent = readFileSync(promptFile[0], "utf-8"); // Load prompt

      for (const transcriptFile of transcriptFiles) { // Loop over transcripts
        console.log(`Processing transcript: ${transcriptFile}`); // Log transcript
        const transcriptJson = JSON.parse(readFileSync(transcriptFile, "utf-8")); // Parse transcript JSON
        const transcriptContent = transcriptJson.text; // Extract text
        // Extract transcript name from filename
        const transcriptName = path.basename(transcriptFile, ".json"); // Remove extension
        // For now, using a dummy rough notes - you might want to modify this
        const roughNotes = readFileSync("data/cwt/rough_notes.txt", "utf-8"); // Placeholder notes
        
        // Create results directory for this config if it doesn't exist
        const resultsDir = path.join(process.cwd(), "results", config.id, transcriptName); // Results path
        if (!existsSync(resultsDir)) { // Create if missing
          mkdirSync(resultsDir, { recursive: true }); // Make directories
        }

        // Create NSIM jobs for each config/transcript combination
        for (let i = 0; i < NSIM; i++) { // Repeat multiple simulations
          const jobId = `${config.id}-${transcriptName}-${i}`; // Unique job id
          const resultFile = path.join(resultsDir, `${i}.json`); // Result file path
          // Skip if result already exists
          if (existsSync(resultFile)) { // Avoid re-processing
            console.log(`Skipping run ${i} for ${config.id} - result already exists`); // Inform skip
            continue; // Skip run
          }

          // Add job to queue
          const job = await evalQueue.add(jobId, { // Enqueue job data
            config, // Config object
            transcriptName, // Name of transcript
            transcriptContent, // Transcript text
            promptFileContent, // Prompt text
            roughNotes, // Rough notes content
            resultFile // Output path
          });
          
          jobs.push(job); // Track created job
          console.log(`Added job ${jobId} to queue`); // Confirmation log
        }
      }
    }

    // Wait for all jobs to complete
    console.log(`Waiting for ${jobs.length} jobs to complete...`); // Inform progress
    await Promise.all(jobs.map(job => job.waitUntilFinished(queueEvents))); // Await completion
    console.log('All jobs completed!'); // Notify user

    // Clean up
    await evalQueue.close(); // Close queue connection
    await queueEvents.close(); // Close events connection
  }); // End of command action

export default runCmd;
