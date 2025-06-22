import { Command } from 'commander'; // CLI utility to define commands
import { generateSyntheticDataset, getWorkspacePath } from '@gevals/core'; // Helpers from the core package
import { mkdir } from 'fs/promises'; // Promise based mkdir function

const dataCmd = new Command('data') // Create the "data" command instance
  .description('Generate synthetic audio dataset with varying noise levels') // Provide command description
  .argument('<url>', 'YouTube URL to process') // URL to the video to process
  .option('-l, --levels <numbers...>', 'Noise levels in dB', ['-3', '0', '3']) // Noise levels for dataset
  .option('-o, --out <path>', 'Output directory', 'data/synthetic') // Where to write generated files
  .option('-c, --chatter <url>', 'YouTube URL for background chatter audio', '') // URL of background chatter audio
  .action(async (url: string, options: { levels: string[], out: string, chatter: string }) => { // Action executed when command runs
    try { // Begin main logic
      // Create absolute path for output directory relative to workspace root
      const outputDir = getWorkspacePath(options.out); // Resolve out dir
      
      // Create output directory if it doesn't exist
      await mkdir(outputDir, { recursive: true }); // Ensure directory exists
      
      // Convert string levels to numbers
      const levels = options.levels.map(Number); // Parse noise levels
      
      if (!options.chatter) { // Require chatter URL
        throw new Error('Please provide a URL for the background chatter audio using --chatter'); // Throw if missing
      }
      
      console.log(`Processing ${url}...`); // Notify start
      await generateSyntheticDataset(url, options.chatter, levels, outputDir); // Generate dataset
      console.log(`Dataset generated in ${outputDir}`); // Notify completion
    } catch (error: unknown) { // Error handling
      if (error instanceof Error) { // Known error type
        console.error('Error:', error.message); // Log specific message
      } else {
        console.error('An unknown error occurred'); // Fallback error log
      }
      process.exit(1); // Exit with failure
    }
  }); // End of command action

export default dataCmd;
