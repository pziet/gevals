import { execa } from 'execa';
import ffmpeg from 'fluent-ffmpeg';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { writeFile, rename } from 'fs/promises';
import { existsSync } from 'fs';

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

/**
 * Mixes `baseMp3` (optionally trimmed) with `chatterMp3`.
 * @param baseDurationSec Number of seconds of baseMp3 to use (default: 30)
 */
export async function mixChatter(
  baseMp3: string,
  chatterMp3: string,
  level: number,
  baseDurationSec: number = 30
): Promise<string> {
  console.log(`Mixing audio files:`);
  console.log(`- Base MP3: ${baseMp3}`);
  console.log(`- Chatter MP3: ${chatterMp3}`);
  console.log(`- Level: ${level}dB`);
  console.log('[DEBUG] Volume option:', `${level}dB`);
  
  const outputPath = join(tmpdir(), `mixed-${Date.now()}.mp3`);
  console.log(`Output will be saved to: ${outputPath}`);
  
  return new Promise((resolve, reject) => {
    console.log('Starting FFmpeg processing...');

    // Debug: inspect streams in the input files
    ffmpeg.ffprobe(baseMp3,   (err, info) => console.log('[DEBUG ffprobe base]   ', err, info?.streams));
    ffmpeg.ffprobe(chatterMp3, (err, info) => console.log('[DEBUG ffprobe chatter]', err, info?.streams));
    const attenuationDb = level === 0 ? -100 : 6 * level;
    const command = ffmpeg()
      // only read up to `${baseDurationSec}` seconds from the base file
      .input(baseMp3)
      .inputOptions([ '-t', String(baseDurationSec) ])
      .input(chatterMp3)
      // DEBUG: first turn down/up the chatter track…
      .complexFilter([
        {
          filter: 'volume',
          // note the minus sign here
          options: `${attenuationDb}dB`,
          inputs: '1:a',
          outputs: 'chatter_adj'
        },
        {
          filter: 'amix',
          options: {
            inputs: 2,
            duration: 'first',
            dropout_transition: 0
          },
          // now mix base (0:a) with our adjusted chatter stream
          inputs: ['0:a', 'chatter_adj'],
          // **label the mixed result so -map [mixed] finds it**
          outputs: 'mixed'
        }
      ], 'mixed');

    // Debug: show the exact FFmpeg command
    command.on('start',   cmd => console.log('[DEBUG FFMPEG START] ', cmd));
    // Debug: stream FFmpeg stderr in real time
    command.on('stderr',  line => console.log('[DEBUG FFMPEG STDERR]', line));
    // Debug: output codec/stream info once FFmpeg parses the graph
    command.on('codecData', data => console.log('[DEBUG CODEC DATA]   ', data));
    // Debug: inspect the full array of CLI arguments passed to FFmpeg
    console.log('[DEBUG ARGUMENTS]', command._getArguments());

    command
      .output(outputPath)
      .on('end', () => {
        console.log('FFmpeg processing completed successfully');
        resolve(outputPath);
      })
      .on('error', err => {
        console.error(`FFmpeg processing error: ${err.message}`);
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .on('progress', progress => {
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
  // If user only supplied one level (e.g. [3]), expand to [0,1,2,3], otherwise use as given
  const levelsToGenerate = levels.length > 1
    ? levels
    : Array.from({ length: levels[0] + 1 }, (_, i) => i);
  console.log(`Generating synthetic dataset with ${levelsToGenerate.length} noise levels`);
  console.log(`Source URL: ${url}`);
  console.log(`Chatter URL: ${chatterUrl}`);
  console.log(`Output directory: ${outputDir}`);
  
  // Download base audio if not already present
  const basePath = join(outputDir, 'base.mp3');
  if (!existsSync(basePath)) {
    console.log(`Downloading base audio to: ${basePath}`);
    await downloadAudio(url, basePath);
    console.log('Base audio download complete');
  } else {
    console.log(`Base audio already exists at: ${basePath}, skipping download.`);
  }

  // Download chatter audio if not already present
  const chatterPath = join(outputDir, 'chatter.mp3');
  if (!existsSync(chatterPath)) {
    console.log(`Downloading chatter audio to: ${chatterPath}`);
    await downloadAudio(chatterUrl, chatterPath);
    console.log('Chatter audio download complete');
  } else {
    console.log(`Chatter audio already exists at: ${chatterPath}, skipping download.`);
  }
  
  // Generate synthetic versions with different noise levels
  for (const level of levelsToGenerate) {
    console.log(`Processing noise level: ${level}dB`);
    const outputPath = join(outputDir, `noise-level-${level}.mp3`);
    console.log(`Output path for this level: ${outputPath}`);
    // only use the first baseDurationSec seconds of the base for every mix
    const baseDurationSec = 1264;
    const tempPath = await mixChatter(basePath, chatterPath, level, baseDurationSec);
    console.log(`[DEBUG] Moving mixed file from ${tempPath} to ${outputPath}`);
    await rename(tempPath, outputPath);
    console.log(`Completed processing for noise level: ${level}dB`);
  }
  console.log('Synthetic dataset generation completed');
}