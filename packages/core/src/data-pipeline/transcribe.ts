import "dotenv/config"; // load environment variables
import fs from "fs"; // filesystem module
import path from "path"; // path utilities
import OpenAI from "openai"; // OpenAI client
import { getWorkspacePath } from "../utils/paths.js"; // resolve workspace paths

const openai = new OpenAI(); // instantiate client

async function transcribeFile(filePath: string) {
  // transcribe a single file
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath), // stream file
    model: "gpt-4o-transcribe", // selected model
    language: "en", // language hint
    response_format: "json", // JSON output
  });
  return transcription; // return raw result
}

async function main() {
  // iterate over mp3 files in dataset
  const dir = getWorkspacePath("data/cwt"); // directory of audio files
  const files = fs
    .readdirSync(dir) // read directory
    .filter((f) => /^noise-level-.*\.mp3$/.test(f)); // only noise-level files

  for (const file of files) {
    // process each file
    const filePath = path.join(dir, file); // absolute path
    try {
      const result = await transcribeFile(filePath); // call transcription
      const outPath = path.join(dir, file.replace(/\.mp3$/, ".json")); // output path
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8"); // save JSON
      console.log(`Transcribed ${file} -> ${outPath}`); // notify success
    } catch (err) {
      console.error(`Failed to transcribe ${file}:`, err); // handle failure
    }
  }
}

main(); // kick off script
