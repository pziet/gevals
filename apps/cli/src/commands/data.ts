import { Command } from 'commander';
import { generateSyntheticDataset, getWorkspacePath } from '@gevals/core';
import { mkdir } from 'fs/promises';

const dataCmd = new Command('data')
  .description('Generate synthetic audio dataset with varying noise levels')
  .argument('<url>', 'YouTube URL to process')
  .option('-l, --levels <numbers...>', 'Noise levels in dB', ['-3', '0', '3'])
  .option('-o, --out <path>', 'Output directory', 'data/synthetic')
  .option('-c, --chatter <url>', 'YouTube URL for background chatter audio', '')
  .action(async (url: string, options: { levels: string[], out: string, chatter: string }) => {
    try {
      // Create absolute path for output directory relative to workspace root
      const outputDir = getWorkspacePath(options.out);
      
      // Create output directory if it doesn't exist
      await mkdir(outputDir, { recursive: true });
      
      // Convert string levels to numbers
      const levels = options.levels.map(Number);
      
      if (!options.chatter) {
        throw new Error('Please provide a URL for the background chatter audio using --chatter');
      }
      
      console.log(`Processing ${url}...`);
      await generateSyntheticDataset(url, options.chatter, levels, outputDir);
      console.log(`Dataset generated in ${outputDir}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
      } else {
        console.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

export default dataCmd;