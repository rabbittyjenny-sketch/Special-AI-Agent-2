import { v4 as uuidv4 } from 'uuid';
import { persistAttachment } from '@/lib/attachment/attachment-persistence';
import { validateFileBeforeUpload } from '@/lib/attachment/error-handler';
import { Attachment } from '@/lib/types';
import crypto from 'crypto';

// Force dynamic rendering to avoid build-time database connection errors
export const dynamic = 'force-dynamic';

/**
 * Phase 2.6: File Upload Endpoint (Neon PostgreSQL)
 * - Supports multiple file uploads (up to 5)
 * - Stores files as Base64 in Neon PostgreSQL
 * - Returns storageKey, metadata with base64 for Vision API
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('file') as File[];
    const userId = formData.get('userId') as string;
    const conversationId = formData.get('conversationId') as string;
    const messageId = (formData.get('messageId') as string) || null;

    // Validate inputs (allow null for conversationId and userId)
    if (!files || files.length === 0) {
      return Response.json(
        { error: 'Missing required fields: file(s)' },
        { status: 400 }
      );
    }

    // Support max 5 files per upload
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

        // Detect agent type from filename
        const detectedAgent = detectAgentFromFilename(file.name);

        // Step 3: Generate storage key
        const timestamp = Date.now();
        const randomSuffix = crypto.randomBytes(4).toString('hex');
        const cleanFileName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
        const storageKey = detectedAgent
          ? `${detectedAgent}/${timestamp}-${randomSuffix}-${cleanFileName}`
          : `uploads/${timestamp}-${randomSuffix}-${cleanFileName}`;

        console.log(`📤 Processing ${file.name}...`);

        // Step 4: Persist to Neon PostgreSQL
        console.log(`💾 Saving to database...`);
        const persistedAttachment = await persistAttachment(
          conversationId === 'null' ? null : conversationId,
          userId === 'null' ? null : userId,
          messageId,
          file.name,
          file.type,
          file.size,
          storageKey,
          `/api/files/${storageKey}`, // Internal reference URL
          {
            base64: base64Data, // For Vision API
            detectedAgent,
            format: file.type.split('/')[1],
            width: undefined, // Can be extracted from image if needed
            height: undefined
          }
        );

        // Step 5: Add to response
        uploadedAttachments.push({
          ...persistedAttachment,
          metadata: {
            ...(persistedAttachment?.metadata || {}) as any,
            base64: base64Data // Include base64 for frontend/vision API
          }
        });

        totalSize += file.size;
        console.log(`✅ Successfully processed: ${file.name}`);

      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error);
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
 * Used for organizing files in database
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
