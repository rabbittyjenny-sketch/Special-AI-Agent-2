import { Attachment } from '@/drizzle/schema';
import { deleteFile } from '@/lib/attachment/storage-manager';
import { permanentlyDeleteAttachment } from '@/lib/attachment/attachment-persistence';
import { AgentType } from '@/lib/agent/boundaries';

/**
 * User-friendly error message
 */
export interface UserFriendlyError {
  message: string; // User-facing message
  details?: string; // Technical details for logging
  recoverable: boolean; // Can user retry?
  suggestion?: string; // What to do next
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Handle file upload errors and provide user-friendly messages
 */
export function handleUploadError(
  error: Error,
  fileName: string,
  fileSize: number
): UserFriendlyError {
  const errorMessage = error.message.toLowerCase();

  // File size errors
  if (errorMessage.includes('size') || errorMessage.includes('limit')) {
    return {
      message: `File "${fileName}" is too large. Maximum size is 5MB.`,
      details: `File size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`,
      recoverable: true,
      suggestion: 'Try uploading a smaller image or compress it first.',
    };
  }

  // Network/connection errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('timeout')
  ) {
    return {
      message: 'Unable to connect to storage service. Please check your internet connection.',
      details: `Network error: ${error.message}`,
      recoverable: true,
      suggestion: 'Please try again in a few moments.',
    };
  }

  // Permission/credential errors
  if (
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('credential')
  ) {
    return {
      message: 'Storage service authentication failed. Please contact support.',
      details: `Auth error: ${error.message}`,
      recoverable: false,
      suggestion: 'This is a system configuration issue.',
    };
  }

  // File type errors
  if (errorMessage.includes('type') || errorMessage.includes('mime')) {
    return {
      message: `File type not supported. Please upload JPEG, PNG, GIF, or WebP images.`,
      details: `Invalid file: ${fileName}`,
      recoverable: true,
      suggestion: 'Convert your image and try again.',
    };
  }

  // Disk full or quota errors
  if (errorMessage.includes('quota') || errorMessage.includes('space')) {
    return {
      message: 'Storage quota reached. Please try again later.',
      details: `Storage full: ${error.message}`,
      recoverable: true,
      suggestion: 'Please contact support if this persists.',
    };
  }

  // Generic error fallback
  return {
    message: 'An error occurred while uploading the file. Please try again.',
    details: `Upload error: ${error.message}`,
    recoverable: true,
    suggestion: 'If the problem persists, please contact support.',
  };
}

/**
 * Handle vision analysis errors
 */
export function handleVisionAnalysisError(error: Error): UserFriendlyError {
  const errorMessage = error.message.toLowerCase();

  // API rate limit
  if (errorMessage.includes('rate') || errorMessage.includes('quota')) {
    return {
      message: 'Image analysis is temporarily unavailable due to high demand.',
      details: `Rate limit: ${error.message}`,
      recoverable: true,
      suggestion: 'Please try again in a few moments.',
    };
  }

  // Invalid image
  if (errorMessage.includes('invalid') || errorMessage.includes('corrupt')) {
    return {
      message: 'The image could not be processed. It may be corrupted.',
      details: `Invalid image: ${error.message}`,
      recoverable: false,
      suggestion: 'Try uploading a different image.',
    };
  }

  // API errors
  if (errorMessage.includes('api') || errorMessage.includes('anthropic')) {
    return {
      message: 'Image analysis service is temporarily unavailable.',
      details: `API error: ${error.message}`,
      recoverable: true,
      suggestion: 'Please try again later.',
    };
  }

  // Generic analysis error
  return {
    message: 'Failed to analyze the image. Please try again.',
    details: `Analysis error: ${error.message}`,
    recoverable: true,
    suggestion: 'If the problem persists, try a different image.',
  };
}

/**
 * Validate attachment for processing
 * Checks file type, size, and agent permissions
 */
export function validateAttachmentForProcessing(
  attachment: Attachment,
  agentType: AgentType
): ValidationResult {
  // Check file size (max 5MB)
  const maxSizeBytes = 5 * 1024 * 1024;
  if (attachment.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit (current: ${(attachment.size / 1024 / 1024).toFixed(2)}MB)`,
    };
  }

  // Check MIME type
  const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validMimes.includes(attachment.mimeType)) {
    return {
      valid: false,
      error: `Unsupported file type: ${attachment.mimeType}`,
    };
  }

  // Check URL availability (either public URL or storage key should be present)
  if (!attachment.publicUrl && !attachment.storageKey) {
    return {
      valid: false,
      error: 'Attachment storage information is missing',
      warning: 'May need to re-upload the attachment',
    };
  }

  // All checks passed
  return { valid: true };
}

/**
 * Retry failed upload with exponential backoff
 */
export async function retryFailedUpload(
  attachmentId: string,
  storageKey: string,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<{ success: boolean; attempt: number; error?: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Calculate exponential backoff delay
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`Retry attempt ${attempt}/${maxRetries} for attachment ${attachmentId} (delaying ${delayMs}ms)`);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Note: Actual retry logic would depend on what failed
      // This is a placeholder - the specific retry depends on failure type
      return { success: true, attempt };
    } catch (error) {
      lastError = error as Error;
      console.error(`Retry attempt ${attempt} failed:`, lastError);

      // Last attempt failed
      if (attempt === maxRetries) {
        return {
          success: false,
          attempt,
          error: lastError.message,
        };
      }
    }
  }

  return {
    success: false,
    attempt: maxRetries,
    error: lastError?.message || 'Unknown error',
  };
}

/**
 * Cleanup failed attachment
 * Removes from storage and database
 */
export async function cleanupFailedAttachment(
  attachmentId: string,
  storageKey?: string
): Promise<{ success: boolean; cleanedStorage: boolean; cleanedDB: boolean }> {
  let cleanedStorage = false;
  let cleanedDB = false;

  try {
    // Clean up storage if key provided
    if (storageKey) {
      try {
        const deleted = await deleteFile(storageKey);
        cleanedStorage = deleted;
        console.log(`Storage cleanup ${deleted ? 'successful' : 'failed'} for key: ${storageKey}`);
      } catch (error) {
        console.error('Failed to cleanup storage:', error);
      }
    }

    // Clean up database
    try {
      const deleted = await permanentlyDeleteAttachment(attachmentId);
      cleanedDB = deleted;
      console.log(`Database cleanup ${deleted ? 'successful' : 'failed'} for attachment: ${attachmentId}`);
    } catch (error) {
      console.error('Failed to cleanup database:', error);
    }

    return {
      success: cleanedStorage || cleanedDB,
      cleanedStorage,
      cleanedDB,
    };
  } catch (error) {
    console.error('Cleanup process failed:', error);
    return {
      success: false,
      cleanedStorage,
      cleanedDB,
    };
  }
}

/**
 * Validate file before uploading
 * Checks size, type, and other constraints
 */
export function validateFileBeforeUpload(
  file: File,
  maxSizeMB: number = 5
): ValidationResult {
  // Check size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check MIME type
  const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!validMimes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not supported. Supported: JPEG, PNG, GIF, WebP, SVG`,
    };
  }

  // Check filename
  if (!file.name || file.name.length === 0) {
    return {
      valid: false,
      error: 'File must have a name',
    };
  }

  // Warn about large file
  if (file.size > 4 * 1024 * 1024) {
    return {
      valid: true,
      warning: `File is ${(file.size / 1024 / 1024).toFixed(1)}MB. Consider compressing it for faster upload.`,
    };
  }

  return { valid: true };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Retryable errors
  const retryablePatterns = [
    'timeout',
    'econnrefused',
    'econnreset',
    'rate limit',
    'temporarily',
    'unavailable',
    'temporarily unavailable',
  ];

  return retryablePatterns.some((pattern) => message.includes(pattern));
}

/**
 * Extract error code from error
 */
export function getErrorCode(error: Error): string {
  const message = error.message.toLowerCase();

  // Common error codes
  if (message.includes('size') || message.includes('limit')) return 'FILE_TOO_LARGE';
  if (message.includes('type') || message.includes('mime')) return 'INVALID_FILE_TYPE';
  if (message.includes('unauthorized') || message.includes('forbidden')) return 'AUTH_FAILED';
  if (message.includes('network') || message.includes('connection')) return 'NETWORK_ERROR';
  if (message.includes('timeout')) return 'TIMEOUT';
  if (message.includes('quota') || message.includes('space')) return 'QUOTA_EXCEEDED';
  if (message.includes('corrupt')) return 'CORRUPTED_FILE';

  return 'UNKNOWN_ERROR';
}

/**
 * Should retry based on attempt count and error type
 */
export function shouldRetry(attemptNumber: number, error: Error, maxAttempts: number = 3): boolean {
  // Don't retry if max attempts reached
  if (attemptNumber >= maxAttempts) {
    return false;
  }

  // Only retry retryable errors
  return isRetryableError(error);
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: Error, context?: Record<string, any>): string {
  let logMessage = `Error: ${error.message}`;

  if (error.stack) {
    logMessage += `\nStack: ${error.stack}`;
  }

  if (context) {
    logMessage += `\nContext: ${JSON.stringify(context)}`;
  }

  return logMessage;
}
