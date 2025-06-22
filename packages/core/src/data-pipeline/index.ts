import { execa } from "execa"; // command-line execution helper
import ffmpeg from "fluent-ffmpeg"; // ffmpeg wrapper for audio processing
import { tmpdir } from "os"; // temp directory helper
import { join } from "path"; // path utilities
import { rename } from "fs/promises"; // promise based file rename
import { existsSync } from "fs"; // synchronous file existence check

export async function downloadAudio(
  url: string,
  outPath: string,
): Promise<void> {
  // download audio using yt-dlp
  console.log(`Starting download of audio from: ${url}`); // log the start of download
  console.log(`Output path: ${outPath}`); // log where file will be written
  try {
    console.log("Executing yt-dlp command..."); // show command invocation
    await execa("yt-dlp", [
      // run yt-dlp with parameters
      "--extract-audio", // only fetch audio
      "--audio-format",
      "mp3", // convert to mp3
      "--audio-quality",
      "0", // Best quality
      "-o",
      outPath, // output file
      url, // target URL
    ]);
    console.log("Audio download completed successfully"); // log success
  } catch (error) {
    // Type guard to safely handle the error
    const errorMessage =
      error instanceof Error
        ? error.message // extract error message when possible
        : "Unknown error occurred";
    console.error(`Download error: ${errorMessage}`); // log error
    throw new Error(`Failed to download audio: ${errorMessage}`); // rethrow with context
  }
}

/**
 * Mixes `baseMp3` (optionally trimmed) with `chatterMp3`.
 * @param baseDurationSec Number of seconds of baseMp3 to use (default: 30)
 */
export async function mixChatter( // combine base audio with chatter noise
  baseMp3: string, // path to base mp3
  chatterMp3: string, // path to chatter mp3
  level: number, // noise level as integer
  baseDurationSec: number = 30, // how many seconds of base to use
): Promise<string> {
  const outputPath = join(tmpdir(), `mixed-${Date.now()}.mp3`); // temp output file

  return new Promise((resolve, reject) => {
    // return promise resolved with output path
    const attenuationDb = level === 0 ? -100 : 6 * level; // compute volume adjustment
    const command = ffmpeg() // start ffmpeg chain
      // only read up to `${baseDurationSec}` seconds from the base file
      .input(baseMp3) // base audio
      .inputOptions(["-t", String(baseDurationSec)]) // trim base duration
      .input(chatterMp3) // chatter audio
      // DEBUG: first turn down/up the chatter track…
      .complexFilter(
        [
          {
            filter: "volume", // adjust chatter volume
            // note the minus sign here
            options: `${attenuationDb}dB`, // attenuation setting
            inputs: "1:a", // apply to second input
            outputs: "chatter_adj", // label adjusted stream
          },
          {
            filter: "amix", // mix audio streams
            options: {
              inputs: 2, // number of inputs
              duration: "first", // stop after first input ends
              dropout_transition: 0, // do not fade
            },
            // now mix base (0:a) with our adjusted chatter stream
            inputs: ["0:a", "chatter_adj"], // specify sources
            // **label the mixed result so -map [mixed] finds it**
            outputs: "mixed", // label final output
          },
        ],
        "mixed",
      );

    command
      .output(outputPath) // write to temporary file
      .on("end", () => {
        // success callback
        resolve(outputPath); // resolve with path
      })
      .on("error", (err) => {
        // error handler
        console.error(`FFmpeg processing error: ${err.message}`); // log
        reject(new Error(`FFmpeg error: ${err.message}`)); // reject promise
      })
      .on("progress", (progress) => {
        // progress information
        console.log(`FFmpeg progress: ${JSON.stringify(progress)}`);
      })
      .run(); // start ffmpeg
  });
}

export async function generateSyntheticDataset( // create dataset with varying noise levels
  url: string, // url of base audio
  chatterUrl: string, // url of chatter audio
  levels: number[], // array of noise levels
  outputDir: string, // directory to save results
): Promise<void> {
  // If user only supplied one level (e.g. [3]), expand to [0,1,2,3], otherwise use as given
  const levelsToGenerate =
    levels.length > 1
      ? levels // use provided list
      : Array.from({ length: levels[0] + 1 }, (_, i) => i); // expand up to level

  // Download base audio if not already present
  const basePath = join(outputDir, "base.mp3"); // target path for base audio
  if (!existsSync(basePath)) {
    console.log(`Downloading base audio to: ${basePath}`); // notify
    await downloadAudio(url, basePath); // fetch base audio
  } else {
    console.log(
      `Base audio already exists at: ${basePath}, skipping download.`,
    ); // skip download
  }

  // Download chatter audio if not already present
  const chatterPath = join(outputDir, "chatter.mp3"); // path for chatter audio
  if (!existsSync(chatterPath)) {
    console.log(`Downloading chatter audio to: ${chatterPath}`); // notify
    await downloadAudio(chatterUrl, chatterPath); // fetch chatter
  } else {
    console.log(
      `Chatter audio already exists at: ${chatterPath}, skipping download.`,
    ); // skip download
  }

  // Generate synthetic versions with different noise levels
  for (const level of levelsToGenerate) {
    // iterate over levels
    console.log(`Processing noise level: ${level}dB`); // log level
    const outputPath = join(outputDir, `noise-level-${level}.mp3`); // destination file
    // only use the first baseDurationSec seconds of the base for every mix
    const baseDurationSec = 1264; // duration to mix
    const tempPath = await mixChatter(
      basePath,
      chatterPath,
      level,
      baseDurationSec,
    ); // mix audio
    await rename(tempPath, outputPath); // move temp file into place
  }
}
