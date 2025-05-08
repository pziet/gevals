import 'dotenv/config';
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { getWorkspacePath } from "../utils/paths.js";

const openai = new OpenAI();


async function transcribeFile(filePath: string) {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "gpt-4o-transcribe",
    language: "en",
    response_format: "json",
  });
  return transcription;
}

async function main() {
  const dir = getWorkspacePath("data/cwt");
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^noise-level-.*\.mp3$/.test(f));

  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const result = await transcribeFile(filePath);
      const outPath = path.join(dir, file.replace(/\.mp3$/, ".json"));
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
      console.log(`Transcribed ${file} -> ${outPath}`);
    } catch (err) {
      console.error(`Failed to transcribe ${file}:`, err);
    }
  }
}

main();
