import { Command } from "commander";

const displayCmd = new Command("display")
  .description("Open the evaluation dashboard")
  .action(async () => {
    console.log("Opening dashboard at http://localhost:3000/leaderboard");
  });

export default displayCmd;