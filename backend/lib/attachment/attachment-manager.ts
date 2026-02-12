import { Attachment } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Validate attachment file
 * Ensures file meets size and type requirements
 */
export function validateAttachment(
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  const validMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  if (!validMimes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type. Supported: ${validMimes.join(', ')}`,
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Convert File to base64 for transmission
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
    };
    reader.onerror = reject;
  });
}

/**
 * Create attachment metadata
 */
export function createAttachmentMetadata(
  file: File,
  userId: string,
  customMetadata?: Record<string, any>
): Omit<Attachment, 'url'> {
  return {
    id: uuidv4(),
    filename: file.name,
    mimeType: file.type as Attachment['mimeType'],
    size: file.size,
    uploadedBy: userId,
    uploadedAt: new Date().toISOString(),
    metadata: {
      ...customMetadata,
    },
  };
}

/**
 * Detect if attachment is a design-related image
 */
export function isDesignImage(filename: string): boolean {
  const designKeywords = [
    'mockup',
    'wireframe',
    'design',
    'figma',
    'sketch',
    'ui',
    'ux',
    'prototype',
    'layout',
    'template',
    'component',
  ];

  const lower = filename.toLowerCase();
  return designKeywords.some(kw => lower.includes(kw));
}

/**
 * Detect if attachment is data/chart related
 */
export function isDataImage(filename: string): boolean {
  const dataKeywords = [
    'chart',
    'graph',
    'data',
    'analytics',
    'report',
    'dashboard',
    'metrics',
    'statistics',
    'table',
    'spreadsheet',
  ];

  const lower = filename.toLowerCase();
  return dataKeywords.some(kw => lower.includes(kw));
}

/**
 * Detect if attachment is code-related
 */
export function isCodeImage(filename: string): boolean {
  const codeKeywords = [
    'code',
    'screenshot',
    'terminal',
    'console',
    'error',
    'debug',
    'stack',
    'logs',
  ];

  const lower = filename.toLowerCase();
  return codeKeywords.some(kw => lower.includes(kw));
}

/**
 * Auto-detect preferred agent type based on image
 * Returns highest confidence agent match
 */
export function detectAgentFromImage(
  filename: string,
  mimeType?: string
): 'design' | 'analyst' | 'coder' | 'marketing' | null {
  if (isDesignImage(filename)) return 'design';
  if (isDataImage(filename)) return 'analyst';
  if (isCodeImage(filename)) return 'coder';
  return null;
}
