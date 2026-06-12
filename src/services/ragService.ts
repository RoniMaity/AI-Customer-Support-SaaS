import { Pinecone, ScoredPineconeRecord } from '@pinecone-database/pinecone';
// OpenAI embeddings logic moved to embeddingService.ts
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

const indexName = process.env.PINECONE_INDEX_NAME || 'support-docs';

export const chunkText = (text: string, maxWordsPerChunk: number = 300): string[] => {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  let currentChunk: string[] = [];
  for (const word of words) {
    currentChunk.push(word);
    if (currentChunk.length >= maxWordsPerChunk) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
};

export const storeEmbeddingInPinecone = async (
  id: string,
  embedding: number[],
  metadata: { text: string; tenantId?: string }
): Promise<void> => {
  const index = pinecone.Index(indexName);

  // Pinecone metadata cannot contain undefined values, which breaks TS overload resolution
  const cleanMetadata: Record<string, string | number | boolean | string[]> = { text: metadata.text };
  if (metadata.tenantId) {
    cleanMetadata.tenantId = metadata.tenantId;
  }

  await index.upsert({
    records: [
      {
        id,
        values: embedding,
        metadata: cleanMetadata,
      },
    ],
  });
};

// --- NEW HELPER FOR CHAT RETRIEVAL ---
export const queryPinecone = async (
  embedding: number[],
  tenantId: string,
  topK: number = 3
): Promise<ScoredPineconeRecord[]> => {
  const index = pinecone.Index(indexName);
  
  const queryResponse = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: {
      tenantId: { $eq: tenantId }
    }
  });

  return queryResponse.matches;
};
