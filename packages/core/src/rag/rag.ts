// import path from "node:path";
// import fs from "node:fs/promises";
import {
  ChromaClient, // chromadb client
  DefaultEmbeddingFunction, // default embedding
  OpenAIEmbeddingFunction, // openai embedding wrapper
} from "chromadb";
import { OpenAI } from "openai"; // openai api
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"; // splitter
import { Document } from "@langchain/core/documents"; // langchain document type
import * as dotenv from "dotenv"; // env loader
import { getWorkspacePath } from "@gevals/core"; // workspace path helper
dotenv.config({ path: getWorkspacePath(".env") }); // load env file

type Metadata = { [key: string]: string | number | boolean };

const DATA_DIR = process.env.DATA_PATH; // dataset directory
if (!DATA_DIR) {
  throw new Error(
    "DATA_PATH environment variable is required but was not provided.",
  );
}
export const DATA_PATH = getWorkspacePath(DATA_DIR); // absolute data path
export const CHUNK_SIZE = 300; // chunk length for splitting
export const CHUNK_OVERLAP = 100; // overlap between chunks

const chroma = new ChromaClient(); // connect to chromadb

const make_collection_name = (
  collectionId: string,
  fileName: string,
  runId: string,
) => `${collectionId}-${fileName}-${runId}`; // helper to generate unique names

function getEmbeddingFunc(efName: string) {
  // choose embedding function
  if (efName === "default") return new DefaultEmbeddingFunction();
  return new OpenAIEmbeddingFunction({
    openai_api_key: process.env.OPENAI_API_KEY,
    openai_model: efName,
  });
}

async function getCollection(
  collectionId: string, // eval id
  fileName: string, // transcript file
  runId: string, // run id
) {
  const collectionName = make_collection_name(collectionId, fileName, runId); // compose name
  return await chroma.getCollection({ name: collectionName }); // fetch collection
}

export async function queryCollection(
  collectionId: string,
  fileName: string,
  query: string,
  nResults: number = 10,
  runId: string,
) {
  const collection = await getCollection(collectionId, fileName, runId);
  return await collection.query({
    queryTexts: [query],
    nResults: nResults,
  });
}

async function makeCollection(collectionId: string, efName: string) {
  await chroma.getOrCreateCollection({
    name: collectionId,
    embeddingFunction: getEmbeddingFunc(efName),
  });
}

export async function deleteCollection(
  collectionId: string,
  fileName: string,
  runId: string,
) {
  const collectionName = make_collection_name(collectionId, fileName, runId); // compose name
  await chroma.deleteCollection({ name: collectionName }); // delete it
}

async function addToCollection(
  collectionId: string,
  ids: string[],
  docs: string[],
  metas: Metadata[],
) {
  const collection = await chroma.getCollection({ name: collectionId }); // open collection

  await collection.add({
    ids: ids,
    documents: docs,
    metadatas: metas,
  }); // add records
}

export async function processTranscript(
  collectionId: string, // evaluation id
  fileName: string, // transcript file
  transcriptContent: string, // raw text
  efName: string, // embedding model name
  runId: string, // run identifier
) {
  // Make collection
  const collectionName = make_collection_name(collectionId, fileName, runId); // unique name
  await makeCollection(collectionName, efName); // create if needed

  // Create a document from the text
  const docs = [
    {
      pageContent: transcriptContent,
      metadata: { source: fileName },
    },
  ]; // single document

  // Split the text into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  }); // configure splitter
  const chunks = await splitter.splitDocuments(docs); // split into pieces
  // Format the chunks for the collection
  const chunkIds: string[] = [];
  const chunkTexts: string[] = [];
  const chunkMetas: Metadata[] = [];

  chunks.forEach((c: Document, i: number) => {
    // format for chromadb
    chunkIds.push(`${collectionName}-${i}`);
    chunkTexts.push(c.pageContent);
    chunkMetas.push(c.metadata.loc.lines);
  });
  // Add the chunks to the collection
  await addToCollection(collectionName, chunkIds, chunkTexts, chunkMetas);
}

export async function getRAGprompt(
  collectionId: string, // evaluation id
  fileName: string, // transcript file
  roughNotes: string, // original notes
  method: string, // retrieval method
  runId: string, // run id
) {
  const textResults = await queryCollection(
    collectionId,
    fileName,
    roughNotes,
    15,
    runId,
  );
  let textAugmentation = ""; // retrieved text
  let prompt_tokens = 0; // token counts
  let completion_tokens = 0;
  if (method === "simple") {
    textAugmentation = textResults.documents[0].join("\n\n");
  } else if (method === "rerank") {
    // Format the text results into a string and ask the model to rerank and return the top 10 results
    const textResultsString = textResults.documents[0]
      .map((chunk, index) => `[${index + 1}] ${chunk}`)
      .join("\n\n"); // convert to list
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that reranks the text results based on relevance to the query.",
        },
        {
          role: "user",
          content:
            "Rerank the following text results and return the top 10 results. The text results are: " +
            textResultsString,
        },
      ],
    });
    textAugmentation = response.choices[0].message.content || ""; // reranked text
    prompt_tokens = response.usage?.prompt_tokens || 0; // token usage
    completion_tokens = response.usage?.completion_tokens || 0;
  }
  const prompt = `
  Here are the rough notes:
  <rough_notes>
  ${roughNotes}
  </rough_notes>
  Here are the relevant chunks:
  <relevant_chunks>
  ${textAugmentation}
  </relevant_chunks>

  Now take the rough notes and the relevant chunks and generate the "Enhanced Notes".
  `;
  return {
    prompt: prompt, // final prompt text
    prompt_tokens: prompt_tokens,
    completion_tokens: completion_tokens,
    total_tokens: prompt_tokens + completion_tokens,
  };
}
