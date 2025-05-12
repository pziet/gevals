import { Command } from "commander";
import open from "open";
import fetch from "node-fetch";

const url = "http://localhost:3000/leaderboard";

const displayCmd = new Command("display")
  .description("Open the evaluation dashboard")
  .action(async () => {
    try {
      // Try to fetch the leaderboard page
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) {
        console.log(`Opening dashboard at ${url}`);
        await open(url);
      } else {
        throw new Error("Server responded with error");
      }
    } catch (err) {
      console.error(
        `Could not connect to the dashboard at ${url}.\n` +
        `Please make sure your dev server is running (try: pnpm dev)`
      );
      process.exit(1);
    }
  });

export default displayCmd;