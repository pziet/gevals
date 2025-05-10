import path from "node:path";
import fs from "node:fs/promises";
import {
  ChromaClient,
  DefaultEmbeddingFunction,
  OpenAIEmbeddingFunction,
} from "chromadb";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import dotenv from "dotenv";
import { getWorkspacePath } from "@gevals/core";
dotenv.config();

type Metadata = { [key: string]: string | number | boolean };

const DATA_DIR = process.env.DATA_PATH;
if (!DATA_DIR) {
  throw new Error("DATA_PATH environment variable is required but was not provided.");
}
export const DATA_PATH = getWorkspacePath(DATA_DIR);
export const CHUNK_SIZE = 300;
export const CHUNK_OVERLAP = 100;

const chroma = new ChromaClient();

const make_collection_name = (collectionId: string, fileName: string) => 
  `${collectionId}-${fileName}`;

function getEmbeddingFunc(efName: string) {
  if (efName === "default") return new DefaultEmbeddingFunction();
  return new OpenAIEmbeddingFunction({
    openai_api_key: process.env.OPENAI_API_KEY,
    openai_model: efName,
  });
}

async function getCollection(
  collectionId: string, 
  fileName: string
) {
  const collectionName = make_collection_name(collectionId, fileName);
  return await chroma.getCollection({ name: collectionName });
}

export async function queryCollection(
  collectionId: string, 
  fileName: string, 
  query: string,
  nResults: number = 10,
) {
  const collection = await getCollection(
    collectionId, 
    fileName
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
  fileName: string
) {
  const collectionName = make_collection_name(collectionId, fileName);
  await chroma.deleteCollection({ name: collectionName });
}

async function addToCollection(
  collectionId: string,
  ids: string[],
  docs: string[],
  metas: Metadata[],
) {
  console.log("Getting collection");
  const collection = await chroma.getCollection({ name: collectionId });
  console.log("Collection got");

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
  console.log("Added to collection");
}

export async function processTranscript(
  collectionId: string,
  fileName: string,
  transcriptContent: string,
  efName: string,
) {
  // Make collection
  const collectionName = make_collection_name(collectionId, fileName);
  console.log("Collection name:", collectionName);
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
  console.log("Chunks added to collection");
}
