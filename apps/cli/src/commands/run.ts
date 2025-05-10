import { Command } from "commander";
import { runPipeline } from "@gevals/core";
import { readFileSync } from "fs";
import { glob } from "glob";
import { parse } from "yaml";
import path from "path";

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
    transcriptFiles = transcriptFiles.slice(0, 1);
    console.log("Transcript files:", transcriptFiles);

    for (const configFile of configFiles) {
      console.log(`Processing config: ${configFile}`);
      const configContent = readFileSync(configFile, "utf-8");
      const config = parse(configContent);
      console.log("Config:", config);

      for (const transcriptFile of transcriptFiles) {
        console.log(`Processing transcript: ${transcriptFile}`);
        const transcriptJson = JSON.parse(readFileSync(transcriptFile, "utf-8"));
        const transcriptContent = transcriptJson.text;
        // console.log("Transcript content:", transcriptContent);
        // Extract transcript name from filename
        const transcriptName = path.basename(transcriptFile, ".json");
        console.log("Transcript name:", transcriptName);
        // For now, using a dummy rough notes - you might want to modify this
        const roughNotes = readFileSync("data/cwt/rough_notes.txt", "utf-8");
        console.log("Rough notes:", roughNotes);
        
        try {
          const result = await runPipeline(
            config, 
            transcriptName, 
            transcriptContent,
            roughNotes
          );
          console.log("Enhanced Notes:", result.enhancedNotes);
          console.log("Metadata:", result.metadata);
        } catch (error) {
          console.error(`Error processing ${transcriptFile}:`, error);
        }
      }
    }
  });

export default runCmd;