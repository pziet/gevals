import { Command } from "commander";
import { runPipeline } from "@gevals/core";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { glob } from "glob";
import { parse } from "yaml";
import path from "path";

const NSIM = 5; // Number of simulations per config

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
    console.log("Transcript files:", transcriptFiles);
    // only run on first transcript file for now
    // transcriptFiles = transcriptFiles.slice(0, 1);
    // console.log("Transcript files:", transcriptFiles);

    for (const configFile of configFiles) {
      console.log(`Processing config: ${configFile}`);
      const configContent = readFileSync(configFile, "utf-8");
      const config = parse(configContent);
      // console.log("Config:", config);
      const promptFile = glob.sync(`prompts/${config.prompt}`);
      // console.log("Prompt file:", promptFile);
      const promptFileContent = readFileSync(promptFile[0], "utf-8");
      // console.log("Prompt file content:", promptFileContent);

      // Create results directory for this config if it doesn't exist
      const resultsDir = path.join("results", config.id);
      if (!existsSync(resultsDir)) {
        mkdirSync(resultsDir, { recursive: true });
      }

      for (const transcriptFile of transcriptFiles) {
        console.log(`Processing transcript: ${transcriptFile}`);
        const transcriptJson = JSON.parse(readFileSync(transcriptFile, "utf-8"));
        const transcriptContent = transcriptJson.text;
        // console.log("Transcript content:", transcriptContent);
        // Extract transcript name from filename
        const transcriptName = path.basename(transcriptFile, ".json");
        // console.log("Transcript name:", transcriptName);
        // For now, using a dummy rough notes - you might want to modify this
        const roughNotes = readFileSync("data/cwt/rough_notes.txt", "utf-8");
        // console.log("Rough notes:", roughNotes);
        
        // Run NSIM times
        for (let i = 0; i < NSIM; i++) {
          console.log(`Running simulation ${i + 1}/${NSIM} for ${config.id}`);
          const resultFile = path.join(resultsDir, `${i}.json`);
          
          // Skip if result already exists
          if (existsSync(resultFile)) {
            console.log(`Skipping run ${i} for ${config.id} - result already exists`);
            continue;
          }

          try {
            const result = await runPipeline(
              config, 
              transcriptName, 
              transcriptContent,
              promptFileContent,
              roughNotes
            );
            // console.log("Enhanced Notes:", result.enhancedNotes);
            // console.log("Metadata:", result.metadata);
            
            // Save result to file
            const resultData = {
              config,
              transcriptName,
              runNumber: i,
              timestamp: new Date().toISOString(),
              result
            };
            
            writeFileSync(resultFile, JSON.stringify(resultData, null, 2));
            console.log(`Saved result to ${resultFile}`);
          } catch (error) {
            console.error(`Error processing ${transcriptFile} (run ${i}):`, error);
          }
        }
      }
    }
  });

export default runCmd;