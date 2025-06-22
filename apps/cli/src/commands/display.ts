import { Command } from "commander"; // CLI command helper
import open from "open"; // Used to open URLs in the browser
import fetch from "node-fetch"; // Fetch utility

const url = "http://localhost:3000/leaderboard"; // Dashboard URL

const displayCmd = new Command("display") // Define the "display" command
  .description("Open the evaluation dashboard") // Command description
  .action(async () => { // Handler when invoked
    try { // Attempt to check if the dashboard is reachable
      // Try to fetch the leaderboard page
      const res = await fetch(url, { method: "HEAD" }); // Send HEAD request
      if (res.ok) {
        console.log(`Opening dashboard at ${url}`); // Inform user
        await open(url); // Launch default browser
      } else {
        throw new Error("Server responded with error"); // Unexpected status
      }
    } catch (err) {
      console.error(
        `Could not connect to the dashboard at ${url}.\n` + // Helpful message
        `Please make sure your dev server is running (try: pnpm dev)`
      );
      process.exit(1); // Exit if dashboard is unreachable
    }
  }); // End of command action

export default displayCmd;
