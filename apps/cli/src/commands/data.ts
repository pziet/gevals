import { Command } from "commander";

const dataCmd = new Command("data")
  .description("Build synthetic audio dataset")
  .argument("<url>", "YouTube URL to process")
  .option("--levels <number>", "Number of noise levels", "3")
  .option("--out <path>", "Output directory", "data/cwt")
  .action(async (url: string, options: { levels: string; out: string }) => {
    console.log("Processing URL:", url);
    console.log("Options:", options);
  });

export default dataCmd;