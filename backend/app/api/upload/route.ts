import { v4 as uuidv4 } from 'uuid';
import { validateAttachment, createAttachmentMetadata, fileToBase64 } from '@/lib/attachment/attachment-manager';
import { uploadFile } from '@/lib/attachment/storage-manager';
import { persistAttachment } from '@/lib/attachment/attachment-persistence';
import { handleUploadError, validateFileBeforeUpload } from '@/lib/attachment/error-handler';
import { Attachment } from '@/lib/types';

/**
 * Phase 2: Enhanced upload endpoint
 * - Supports multiple file uploads (up to 5)
 * - Uploads to Cloudflare R2
 * - Persists metadata to PostgreSQL
 * - Returns storageKey, publicUrl, and base64 for vision API
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('file') as File[];
    const userId = formData.get('userId') as string;
    const conversationId = formData.get('conversationId') as string;
    const messageId = (formData.get('messageId') as string) || null;

    // Validate inputs
    if (!files || files.length === 0 || !userId || !conversationId) {
      return Response.json(
        { error: 'Missing required fields: file(s), userId, conversationId' },
        { status: 400 }
      );
    }

    // Phase 2.5: Support max 5 files per upload
    if (files.length > 5) {
      return Response.json(
        { error: 'Maximum 5 files allowed per upload' },
        { status: 400 }
      );
    }

    const uploadedAttachments: Attachment[] = [];
    const errors: string[] = [];
    let totalSize = 0;

    // Process each file
    for (const file of files) {
      try {
        // Step 1: Validate file before uploading
        const validation = validateFileBeforeUpload(file, 5);
        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.error}`);
          continue;
        }

        // Step 2: Convert file to buffer and base64
        const buffer = await file.arrayBuffer();
        const bufferInstance = Buffer.from(buffer);
        const base64Data = bufferInstance.toString('base64');

        // Detect agent type from filename (for R2 organization)
        const detectedAgent = detectAgentFromFilename(file.name);

        // Step 3: Upload to Cloudflare R2
        console.log(`📤 Uploading ${file.name} to Cloudflare R2...`);
        const r2Result = await uploadFile(
          bufferInstance,
          file.name,
          file.type,
          detectedAgent
        );

        console.log(`✅ Uploaded to R2: ${r2Result.key}`);

        // Step 4: Create attachment metadata
        const attachmentMetadata = createAttachmentMetadata(
          new File([buffer], file.name, { type: file.type }),
          userId
        );

        // Step 5: Persist to PostgreSQL
        console.log(`💾 Saving to database...`);
        const persistedAttachment = await persistAttachment(
          conversationId,
          userId,
          messageId,
          file.name,
          file.type,
          file.size,
          r2Result.key,        // storageKey
          r2Result.url,        // publicUrl
          {
            base64: base64Data, // For vision API
            detectedAgent,
            format: file.type.split('/')[1]
          }
        );

        // Step 6: Add to response
        uploadedAttachments.push({
          ...persistedAttachment,
          metadata: {
            ...persistedAttachment.metadata,
            base64: base64Data // Include base64 for frontend/vision API
          }
        });

        totalSize += file.size;
        console.log(`✅ Successfully processed: ${file.name}`);

      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        const errorMsg = handleUploadError(
          error as Error,
          file.name,
          file.size
        );
        errors.push(errorMsg.message);
      }
    }

    // Return results
    const success = uploadedAttachments.length > 0;
    return Response.json({
      success,
      attachments: uploadedAttachments,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        uploaded: uploadedAttachments.length,
        failed: errors.length,
        totalSize,
        totalFiles: files.length
      }
    });

  } catch (error) {
    console.error('Upload handler error:', error);
    return Response.json(
      { error: 'Upload handler failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Helper: Detect agent type from filename
 * Used for organizing files in R2 (design/, analyst/, etc)
 */
function detectAgentFromFilename(filename: string): string {
  const lower = filename.toLowerCase();

  // Design keywords
  if (['mockup', 'wireframe', 'design', 'figma', 'sketch', 'ui', 'ux', 'prototype'].some(kw => lower.includes(kw))) {
    return 'design';
  }

  // Analyst keywords
  if (['chart', 'graph', 'data', 'analytics', 'report', 'dashboard', 'metrics', 'statistics'].some(kw => lower.includes(kw))) {
    return 'analyst';
  }

  // Coder keywords
  if (['code', 'screenshot', 'terminal', 'console', 'error', 'debug', 'stack', 'logs'].some(kw => lower.includes(kw))) {
    return 'coder';
  }

  // Default
  return 'uploads';
}
