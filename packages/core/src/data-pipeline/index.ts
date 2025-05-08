import { execa } from 'execa';
import ffmpeg from 'fluent-ffmpeg';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';

export async function downloadAudio(url: string, outPath: string): Promise<void> {
  console.log(`Starting download of audio from: ${url}`);
  console.log(`Output path: ${outPath}`);
  try {
    console.log('Executing yt-dlp command...');
    await execa('yt-dlp', [
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0', // Best quality
      '-o', outPath,
      url
    ]);
    console.log('Audio download completed successfully');
  } catch (error) {
    // Type guard to safely handle the error
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    console.error(`Download error: ${errorMessage}`);
    throw new Error(`Failed to download audio: ${errorMessage}`);
  }
}

export async function mixChatter(
  baseMp3: string,
  chatterMp3: string,
  level: number
): Promise<string> {
  console.log(`Mixing audio files:`);
  console.log(`- Base MP3: ${baseMp3}`);
  console.log(`- Chatter MP3: ${chatterMp3}`);
  console.log(`- Level: ${level}dB`);
  
  const outputPath = join(tmpdir(), `mixed-${Date.now()}.mp3`);
  console.log(`Output will be saved to: ${outputPath}`);
  
  return new Promise((resolve, reject) => {
    console.log('Starting FFmpeg processing...');
    ffmpeg()
      .input(baseMp3)
      .input(chatterMp3)
      .complexFilter([
        {
          filter: 'amix',
          options: {
            inputs: 2,
            duration: 'first',
            dropout_transition: 0
          }
        },
        {
          filter: 'volume',
          options: `${level}dB`,
          inputs: '[1]',
          outputs: ['chatter']
        }
      ])
      .output(outputPath)
      .on('end', () => {
        console.log('FFmpeg processing completed successfully');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`FFmpeg processing error: ${err.message}`);
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .on('progress', (progress) => {
        console.log(`FFmpeg progress: ${JSON.stringify(progress)}`);
      })
      .run();
  });
}

export async function generateSyntheticDataset(
  url: string,
  chatterUrl: string,
  levels: number[],
  outputDir: string
): Promise<void> {
  console.log(`Generating synthetic dataset with ${levels.length} noise levels`);
  console.log(`Source URL: ${url}`);
  console.log(`Chatter URL: ${chatterUrl}`);
  console.log(`Output directory: ${outputDir}`);
  
  // Download base audio
  const basePath = join(outputDir, 'base.mp3');
  console.log(`Downloading base audio to: ${basePath}`);
  await downloadAudio(url, basePath);
  console.log('Base audio download complete');

  // Download chatter audio
  const chatterPath = join(outputDir, 'chatter.mp3');
  console.log(`Downloading chatter audio to: ${chatterPath}`);
  await downloadAudio(chatterUrl, chatterPath);
  console.log('Chatter audio download complete');
  
  // Generate synthetic versions with different noise levels
  console.log(`Generating ${levels.length} synthetic versions with different noise levels`);
  for (const level of levels) {
    console.log(`Processing noise level: ${level}dB`);
    const outputPath = join(outputDir, `noise-level-${level}.mp3`);
    console.log(`Output path for this level: ${outputPath}`);
    await mixChatter(basePath, chatterPath, level);
    console.log(`Completed processing for noise level: ${level}dB`);
  }
  console.log('Synthetic dataset generation completed');
}