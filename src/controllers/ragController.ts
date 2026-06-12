import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { chunkText, storeEmbeddingInPinecone } from '../services/ragService';
import { generateEmbedding } from '../services/embeddingService';
import { AuthRequest } from '../middleware/auth';

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Only allow .txt and .md files
    if (file.mimetype !== 'text/plain' && file.mimetype !== 'text/markdown' && !file.originalname.match(/\.(txt|md)$/)) {
      res.status(400).json({ error: 'Invalid file type. Only .txt and .md are supported.' });
      return;
    }

    // Read the file content as plain text
    const textContent = file.buffer.toString('utf-8');

    // Step 1: Split into chunks
    const chunks = chunkText(textContent, 300); // 300 words per chunk

    // Strict tenant isolation via JWT
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: missing tenant context' });
      return;
    }

    // Step 2 & 3: Generate embeddings and store them
    const processingPromises = chunks.map(async (chunk, index) => {
      // Generate embedding vector
      const embedding = await generateEmbedding(chunk);

      // Unique ID for each chunk
      const chunkId = `${uuidv4()}-chunk-${index}`;

      // Store in Pinecone
      await storeEmbeddingInPinecone(chunkId, embedding, {
        text: chunk,
        tenantId,
      });
    });

    // Wait for all chunks to be processed
    await Promise.all(processingPromises);

    res.status(200).json({
      message: 'Document uploaded and processed successfully',
      chunksProcessed: chunks.length,
    });
  } catch (error) {
    console.error('Error processing document upload:', error);
    res.status(500).json({ error: 'Internal server error processing the document', details: error instanceof Error ? error.message : String(error) });
  }
};
