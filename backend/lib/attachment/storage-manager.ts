import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

/**
 * Cloudflare R2 Storage Manager
 * Uses S3-compatible API for file storage and retrieval
 */

export interface StorageUploadResult {
  key: string; // Storage key (path in R2)
  url: string; // Public CDN URL
  size: number;
  uploadedAt: string;
  mimeType: string;
}

export interface FileMetadata {
  key: string;
  size: number;
  lastModified: string;
  contentType: string;
  url: string;
}

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto', // Required for Cloudflare R2
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'images';
const PUBLIC_URL_BASE = process.env.CLOUDFLARE_R2_PUBLIC_URL || `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

/**
 * Upload file to Cloudflare R2
 * Generates unique key and returns both storage key and public URL
 */
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  agentType?: string
): Promise<StorageUploadResult> {
  try {
    // Generate unique key with timestamp and random suffix
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const cleanFileName = fileName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
    const key = agentType
      ? `${agentType}/${timestamp}-${randomSuffix}-${cleanFileName}`
      : `uploads/${timestamp}-${randomSuffix}-${cleanFileName}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        'original-filename': fileName,
      },
    });

    await s3Client.send(command);

    // Generate public URL
    const publicUrl = `${PUBLIC_URL_BASE}/${key}`;

    return {
      key,
      url: publicUrl,
      size: fileBuffer.length,
      uploadedAt: new Date().toISOString(),
      mimeType,
    };
  } catch (error) {
    console.error('Failed to upload file to R2:', error);
    throw error;
  }
}

/**
 * Delete file from Cloudflare R2
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Failed to delete file from R2:', error);
    return false;
  }
}

/**
 * Get file metadata (size, type, last modified)
 */
export async function getFileMetadata(key: string): Promise<FileMetadata | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    return {
      key,
      size: response.ContentLength || 0,
      lastModified: response.LastModified?.toISOString() || new Date().toISOString(),
      contentType: response.ContentType || 'application/octet-stream',
      url: `${PUBLIC_URL_BASE}/${key}`,
    };
  } catch (error) {
    console.error('Failed to get file metadata from R2:', error);
    return null;
  }
}

/**
 * Get signed URL for temporary access (24 hours default)
 * Useful for private files that need temporary public access
 */
export async function getSignedFileUrl(
  key: string,
  expirationSeconds: number = 86400 // 24 hours
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expirationSeconds,
    });

    return signedUrl;
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    throw error;
  }
}

/**
 * List files for a specific user/conversation
 * Supports prefix filtering (e.g., "design/user-123/")
 */
export async function listUserFiles(
  userId: string,
  conversationId?: string
): Promise<FileMetadata[]> {
  try {
    const prefix = conversationId ? `${userId}/${conversationId}/` : `${userId}/`;

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 100,
    });

    const response = await s3Client.send(command);
    const files: FileMetadata[] = [];

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) {
          files.push({
            key: obj.Key,
            size: obj.Size || 0,
            lastModified: obj.LastModified?.toISOString() || new Date().toISOString(),
            contentType: 'application/octet-stream', // Would need separate metadata call for actual type
            url: `${PUBLIC_URL_BASE}/${obj.Key}`,
          });
        }
      }
    }

    return files;
  } catch (error) {
    console.error('Failed to list files from R2:', error);
    return [];
  }
}

/**
 * List files by agent type prefix
 * Useful for browsing agent-specific uploads
 */
export async function listAgentFiles(
  agentType: string,
  limit: number = 50
): Promise<FileMetadata[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `${agentType}/`,
      MaxKeys: limit,
    });

    const response = await s3Client.send(command);
    const files: FileMetadata[] = [];

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) {
          files.push({
            key: obj.Key,
            size: obj.Size || 0,
            lastModified: obj.LastModified?.toISOString() || new Date().toISOString(),
            contentType: 'application/octet-stream',
            url: `${PUBLIC_URL_BASE}/${obj.Key}`,
          });
        }
      }
    }

    return files;
  } catch (error) {
    console.error('Failed to list agent files from R2:', error);
    return [];
  }
}

/**
 * Copy file within R2 (useful for duplicating or organizing)
 */
export async function copyFile(sourceKey: string, destinationKey: string): Promise<boolean> {
  try {
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: sourceKey,
    });

    const getResponse = await s3Client.send(getCommand);

    if (!getResponse.Body) {
      throw new Error('Failed to read source file');
    }

    // Convert body to buffer
    const bodyBytes = await getResponse.Body.transformToByteArray();
    const buffer = Buffer.from(bodyBytes);

    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: destinationKey,
      Body: buffer,
      ContentType: getResponse.ContentType,
    });

    await s3Client.send(putCommand);
    return true;
  } catch (error) {
    console.error('Failed to copy file in R2:', error);
    return false;
  }
}

/**
 * Generate storage path for organized file structure
 * Pattern: agentType/conversationId/timestamp-filename
 */
export function generateStoragePath(
  agentType: string,
  conversationId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const cleanName = fileName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
  return `${agentType}/${conversationId}/${timestamp}-${cleanName}`;
}

/**
 * Check if file exists in R2
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const metadata = await getFileMetadata(key);
    return metadata !== null;
  } catch {
    return false;
  }
}

/**
 * Calculate storage stats for a prefix
 * Returns total size and file count
 */
export async function getStorageStats(prefix?: string): Promise<{ totalSize: number; fileCount: number }> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix || '',
      MaxKeys: 1000,
    });

    const response = await s3Client.send(command);
    let totalSize = 0;
    let fileCount = 0;

    if (response.Contents) {
      for (const obj of response.Contents) {
        totalSize += obj.Size || 0;
        fileCount++;
      }
    }

    return { totalSize, fileCount };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return { totalSize: 0, fileCount: 0 };
  }
}

/**
 * Cleanup old files (useful for auto-deletion policy)
 * Returns count of deleted files
 */
export async function cleanupOldFiles(
  olderThanDays: number,
  prefix?: string
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix || '',
    });

    const response = await s3Client.send(command);
    let deletedCount = 0;

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.LastModified && obj.LastModified < cutoffDate && obj.Key) {
          const deleteSuccess = await deleteFile(obj.Key);
          if (deleteSuccess) {
            deletedCount++;
          }
        }
      }
    }

    console.log(`Cleanup: Deleted ${deletedCount} old files`);
    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup old files:', error);
    return 0;
  }
}

/**
 * Validate Cloudflare R2 connection
 * Useful for health checks
 */
export async function validateR2Connection(): Promise<{ connected: boolean; message: string }> {
  try {
    // Try to list objects (minimal operation)
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1,
    });

    await s3Client.send(command);
    return { connected: true, message: 'Cloudflare R2 connection successful' };
  } catch (error) {
    console.error('Cloudflare R2 connection failed:', error);
    return { connected: false, message: `Connection failed: ${String(error)}` };
  }
}
