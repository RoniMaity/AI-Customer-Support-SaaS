import { HfInference } from '@huggingface/inference';

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  if (!hfApiKey) {
    throw new Error('Missing HUGGINGFACE_API_KEY in environment variables');
  }

  const hf = new HfInference(hfApiKey);
  const modelId = 'sentence-transformers/all-MiniLM-L6-v2';

  const embedding = await hf.featureExtraction({
    model: modelId,
    inputs: text,
  }) as number[];
  
  // Log embedding length for debugging (should be 384)
  console.log(`[EmbeddingService] Generated embedding. Length: ${embedding.length} (Expected: 384)`);

  return embedding;
};
