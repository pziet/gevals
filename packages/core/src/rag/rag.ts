// import path from "node:path";
// import fs from "node:fs/promises";
import {
  ChromaClient,
  DefaultEmbeddingFunction,
  OpenAIEmbeddingFunction,
} from "chromadb";
import { OpenAI } from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import * as dotenv from 'dotenv';
import { getWorkspacePath } from "@gevals/core";
dotenv.config( { path: getWorkspacePath('.env')});

type Metadata = { [key: string]: string | number | boolean };

const DATA_DIR = process.env.DATA_PATH;
if (!DATA_DIR) {
  throw new Error("DATA_PATH environment variable is required but was not provided.");
}
export const DATA_PATH = getWorkspacePath(DATA_DIR);
export const CHUNK_SIZE = 300;
export const CHUNK_OVERLAP = 100;

const chroma = new ChromaClient();

const make_collection_name = (collectionId: string, fileName: string, runId: string) => 
  `${collectionId}-${fileName}-${runId}`;

function getEmbeddingFunc(efName: string) {
  if (efName === "default") return new DefaultEmbeddingFunction();
  return new OpenAIEmbeddingFunction({
    openai_api_key: process.env.OPENAI_API_KEY,
    openai_model: efName,
  });
}

async function getCollection(
  collectionId: string, 
  fileName: string,
  runId: string
) {
  const collectionName = make_collection_name(collectionId, fileName, runId);
  return await chroma.getCollection({ name: collectionName });
}

export async function queryCollection(
  collectionId: string, 
  fileName: string, 
  query: string,
  nResults: number = 10,
  runId: string
) {
  const collection = await getCollection(
    collectionId, 
    fileName,
    runId
  );
  return await collection.query({
    queryTexts: [query],
    nResults: nResults,
  });
}

async function makeCollection(
  collectionId: string, 
  efName: string) {
  await chroma.getOrCreateCollection({
    name: collectionId,
    embeddingFunction: getEmbeddingFunc(efName),
  });
}

export async function deleteCollection(
  collectionId: string, 
  fileName: string,
  runId: string
) {
  const collectionName = make_collection_name(collectionId, fileName, runId);
  await chroma.deleteCollection({ name: collectionName });
}

async function addToCollection(
  collectionId: string,
  ids: string[],
  docs: string[],
  metas: Metadata[],
) {
  // console.log("Getting collection");
  const collection = await chroma.getCollection({ name: collectionId });
  // console.log("Collection got");

  // Add debug logging
  // console.log("Adding to collection with:", {
  //   ids: ids.slice(0, 2), // Log first 2 items
  //   docs: docs.slice(0, 2),
  //   metas: metas.slice(0, 2)
  // });

  await collection.add({ 
    ids: ids, 
    documents: docs, 
    metadatas: metas});
  // console.log("Added to collection");
}

export async function processTranscript(
  collectionId: string,
  fileName: string,
  transcriptContent: string,
  efName: string,
  runId: string
) {
  // Make collection
  const collectionName = make_collection_name(collectionId, fileName, runId);
  // console.log("Collection name:", collectionName);
  await makeCollection(collectionName, efName);
  // console.log("Collection made");

  // Create a document from the text
  const docs = [{ 
    pageContent: transcriptContent, 
    metadata: { source: fileName } 
  }];
  // console.log("Docs created");

  // Split the text into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });
  // console.log("Splitter:", splitter);
  const chunks = await splitter.splitDocuments(docs);
  // console.log("Chunks computed");
  // Format the chunks for the collection
  const chunkIds: string[] = [];
  const chunkTexts: string[] = [];
  const chunkMetas: Metadata[] = [];

  chunks.forEach((c: Document, i: number) => {
    chunkIds.push(`${collectionName}-${i}`);
    chunkTexts.push(c.pageContent);
    chunkMetas.push(c.metadata.loc.lines);
  });
  // console.log("Chunks formatted");
  // Add the chunks to the collection
  await addToCollection(
    collectionName, 
    chunkIds, 
    chunkTexts, 
    chunkMetas);
  // console.log("Chunks added to collection");
}


export async function getRAGprompt(
  collectionId: string,
  fileName: string,
  roughNotes: string,
  method: string,
  runId: string
) {
  const textResults = await queryCollection(
    collectionId, 
    fileName, 
    roughNotes,
    15,
    runId
  );
  let textAugmentation = "";
  let prompt_tokens = 0;
  let completion_tokens = 0;
  if (method === "simple") {
    textAugmentation = textResults.documents[0].join("\n\n");
  } else if (method === "rerank") {
    // Format the text results into a string and ask the model to rerank and return the top 10 results
    const textResultsString = textResults.documents[0].map((chunk, index) => 
      `[${index + 1}] ${chunk}`
    ).join("\n\n");
    // console.log("Text results string:", textResultsString);
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {role: "system", content: "You are a helpful assistant that reranks the text results based on relevance to the query."},
        {role: "user", content: "Rerank the following text results and return the top 10 results. The text results are: " + textResultsString},
      ],
    });
    textAugmentation = response.choices[0].message.content || "";
    // console.log("Reranked text results:", textAugmentation);
    prompt_tokens = response.usage?.prompt_tokens || 0;
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
  `
  return {
    prompt: prompt, 
    prompt_tokens: prompt_tokens, 
    completion_tokens: completion_tokens,
    total_tokens: prompt_tokens + completion_tokens
  };	
}