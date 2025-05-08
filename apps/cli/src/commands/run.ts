import { Command } from "commander";

const runCmd = new Command("run")
  .description("Run evaluations from config files")
  .argument("<configs...>", "Config file(s) or glob patterns")
  .action(async (configs: string[]) => {
    console.log("Running evaluations for configs:", configs);
  });

export default runCmd;