import { neon } from '@neondatabase/serverless';
import { attachments, imageAnalyses, Attachment, ImageAnalysis } from '@/drizzle/schema';
import { VisionAnalysisResult } from '@/lib/attachment/vision-analyzer';
import { AgentType } from '@/lib/agent/boundaries';

const sql = neon(process.env.DATABASE_URL!);

/**
 * Attachment with Vision Analysis
 */
export interface AttachmentWithAnalysis extends Attachment {
  analyses?: ImageAnalysis[];
}

/**
 * Save attachment to database after successful cloud upload
 * Stores storage key, public URL, and initial metadata
 */
export async function persistAttachment(
  conversationId: string,
  userId: string,
  messageId: string | null,
  fileName: string,
  mimeType: string,
  fileSize: number,
  storageKey: string,
  publicUrl: string,
  metadata?: Record<string, any>
): Promise<Attachment | null> {
  try {
    const result = await sql(
      `
      INSERT INTO attachments
      (conversation_id, user_id, message_id, filename, mime_type, size, url, storage_key, public_url, metadata, uploaded_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
      `,
      [
        conversationId,
        userId,
        messageId,
        fileName,
        mimeType,
        fileSize,
        publicUrl || storageKey, // Fallback to storage key if no public URL
        storageKey,
        publicUrl,
        JSON.stringify(metadata || {}),
      ]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return mapRowToAttachment(row);
  } catch (error) {
    console.error('Failed to persist attachment:', error);
    throw error;
  }
}

/**
 * Save vision analysis results for an attachment
 * Creates or updates image_analyses table entry
 */
export async function saveVisionAnalysis(
  attachmentId: string,
  agentType: AgentType,
  analysis: VisionAnalysisResult
): Promise<ImageAnalysis | null> {
  try {
    // First, update the attachment with vision analysis data
    await sql(
      `
      UPDATE attachments
      SET vision_analysis = $1, analyzed_at = NOW()
      WHERE id = $2
      `,
      [JSON.stringify(analysis), attachmentId]
    );

    // Then, create detailed analysis record
    const result = await sql(
      `
      INSERT INTO image_analyses
      (attachment_id, agent_type, analysis, summary, detected_type, confidence, key_points, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
      `,
      [
        attachmentId,
        agentType,
        analysis.analysis,
        analysis.summary,
        analysis.detectedType,
        analysis.confidence.toString(),
        JSON.stringify(analysis.keyPoints),
        JSON.stringify(analysis.metadata),
      ]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return mapRowToImageAnalysis(row);
  } catch (error) {
    console.error('Failed to save vision analysis:', error);
    throw error;
  }
}

/**
 * Retrieve attachment with all its analysis data
 */
export async function getAttachmentWithAnalysis(attachmentId: string): Promise<AttachmentWithAnalysis | null> {
  try {
    const result = await sql(
      `
      SELECT
        a.*,
        COALESCE(json_agg(ia.* ORDER BY ia.created_at DESC) FILTER (WHERE ia.id IS NOT NULL), '[]') as analyses
      FROM attachments a
      LEFT JOIN image_analyses ia ON a.id = ia.attachment_id
      WHERE a.id = $1
      GROUP BY a.id
      `,
      [attachmentId]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    const attachment = mapRowToAttachment(row);

    return {
      ...attachment,
      visionAnalysis: row.vision_analysis,
      analyses: row.analyses ? row.analyses.map(mapRowToImageAnalysis) : [],
    } as AttachmentWithAnalysis;
  } catch (error) {
    console.error('Failed to get attachment with analysis:', error);
    return null;
  }
}

/**
 * List attachments for a conversation
 * Includes vision analysis data if available
 */
export async function getConversationAttachments(
  conversationId: string,
  limit: number = 50
): Promise<AttachmentWithAnalysis[]> {
  try {
    const result = await sql(
      `
      SELECT
        a.*,
        COALESCE(json_agg(ia.* ORDER BY ia.created_at DESC) FILTER (WHERE ia.id IS NOT NULL), '[]') as analyses
      FROM attachments a
      LEFT JOIN image_analyses ia ON a.id = ia.attachment_id
      WHERE a.conversation_id = $1
      GROUP BY a.id
      ORDER BY a.uploaded_at DESC
      LIMIT $2
      `,
      [conversationId, limit]
    );

    return result.map((row) => {
      const attachment = mapRowToAttachment(row);
      return {
        ...attachment,
        visionAnalysis: row.vision_analysis,
        analyses: row.analyses ? row.analyses.map(mapRowToImageAnalysis) : [],
      } as AttachmentWithAnalysis;
    });
  } catch (error) {
    console.error('Failed to get conversation attachments:', error);
    return [];
  }
}

/**
 * List attachments for a user across all conversations
 */
export async function getUserAttachments(
  userId: string,
  limit: number = 100
): Promise<AttachmentWithAnalysis[]> {
  try {
    const result = await sql(
      `
      SELECT
        a.*,
        COALESCE(json_agg(ia.* ORDER BY ia.created_at DESC) FILTER (WHERE ia.id IS NOT NULL), '[]') as analyses
      FROM attachments a
      LEFT JOIN image_analyses ia ON a.id = ia.attachment_id
      WHERE a.user_id = $1
      GROUP BY a.id
      ORDER BY a.uploaded_at DESC
      LIMIT $2
      `,
      [userId, limit]
    );

    return result.map((row) => {
      const attachment = mapRowToAttachment(row);
      return {
        ...attachment,
        visionAnalysis: row.vision_analysis,
        analyses: row.analyses ? row.analyses.map(mapRowToImageAnalysis) : [],
      } as AttachmentWithAnalysis;
    });
  } catch (error) {
    console.error('Failed to get user attachments:', error);
    return [];
  }
}

/**
 * Get attachments by storage key (useful for fast lookup)
 */
export async function getAttachmentByStorageKey(storageKey: string): Promise<AttachmentWithAnalysis | null> {
  try {
    const result = await sql(
      `
      SELECT
        a.*,
        COALESCE(json_agg(ia.* ORDER BY ia.created_at DESC) FILTER (WHERE ia.id IS NOT NULL), '[]') as analyses
      FROM attachments a
      LEFT JOIN image_analyses ia ON a.id = ia.attachment_id
      WHERE a.storage_key = $1
      GROUP BY a.id
      `,
      [storageKey]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    const attachment = mapRowToAttachment(row);
    return {
      ...attachment,
      visionAnalysis: row.vision_analysis,
      analyses: row.analyses ? row.analyses.map(mapRowToImageAnalysis) : [],
    } as AttachmentWithAnalysis;
  } catch (error) {
    console.error('Failed to get attachment by storage key:', error);
    return null;
  }
}

/**
 * Update attachment metadata or public URL
 */
export async function updateAttachment(
  attachmentId: string,
  updates: {
    publicUrl?: string;
    metadata?: Record<string, any>;
    visionAnalysis?: VisionAnalysisResult | null;
  }
): Promise<Attachment | null> {
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.publicUrl !== undefined) {
      fields.push(`public_url = $${paramIndex++}`);
      values.push(updates.publicUrl);
    }

    if (updates.metadata !== undefined) {
      fields.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(updates.metadata));
    }

    if (updates.visionAnalysis !== undefined) {
      fields.push(`vision_analysis = $${paramIndex++}`);
      values.push(updates.visionAnalysis ? JSON.stringify(updates.visionAnalysis) : null);
      fields.push(`analyzed_at = $${paramIndex++}`);
      values.push(updates.visionAnalysis ? new Date().toISOString() : null);
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(attachmentId);

    const result = await sql(
      `
      UPDATE attachments
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
      `,
      values
    );

    if (result.length === 0) {
      return null;
    }

    return mapRowToAttachment(result[0]);
  } catch (error) {
    console.error('Failed to update attachment:', error);
    throw error;
  }
}

/**
 * Delete attachment (soft delete by marking as null)
 */
export async function deleteAttachment(attachmentId: string): Promise<boolean> {
  try {
    // Soft delete - just remove sensitive data but keep the record
    const result = await sql(
      `
      UPDATE attachments
      SET url = NULL, public_url = NULL, storage_key = NULL
      WHERE id = $1
      RETURNING id
      `,
      [attachmentId]
    );

    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete attachment:', error);
    return false;
  }
}

/**
 * Permanently delete attachment (hard delete)
 * Only use if you've already removed the file from cloud storage
 */
export async function permanentlyDeleteAttachment(attachmentId: string): Promise<boolean> {
  try {
    // Delete analysis records first (cascade should handle, but explicit for safety)
    await sql(`DELETE FROM image_analyses WHERE attachment_id = $1`, [attachmentId]);

    // Delete attachment
    const result = await sql(`DELETE FROM attachments WHERE id = $1 RETURNING id`, [attachmentId]);

    return result.length > 0;
  } catch (error) {
    console.error('Failed to permanently delete attachment:', error);
    return false;
  }
}

/**
 * Get attachment statistics for a conversation
 */
export async function getConversationAttachmentStats(conversationId: string): Promise<{
  totalCount: number;
  totalSize: number;
  analyzedCount: number;
  mimeTypes: Record<string, number>;
}> {
  try {
    const result = await sql(
      `
      SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(size), 0) as total_size,
        COUNT(CASE WHEN analyzed_at IS NOT NULL THEN 1 END) as analyzed_count,
        json_object_agg(mime_type, count) as mime_types
      FROM (
        SELECT mime_type, COUNT(*) as count
        FROM attachments
        WHERE conversation_id = $1
        GROUP BY mime_type
      ) as type_counts
      `,
      [conversationId]
    );

    if (result.length === 0) {
      return {
        totalCount: 0,
        totalSize: 0,
        analyzedCount: 0,
        mimeTypes: {},
      };
    }

    const row = result[0];
    return {
      totalCount: Number(row.total_count),
      totalSize: Number(row.total_size),
      analyzedCount: Number(row.analyzed_count),
      mimeTypes: row.mime_types || {},
    };
  } catch (error) {
    console.error('Failed to get attachment stats:', error);
    return {
      totalCount: 0,
      totalSize: 0,
      analyzedCount: 0,
      mimeTypes: {},
    };
  }
}

/**
 * Cleanup old attachments (useful for storage management)
 * Returns count of deleted records
 */
export async function deleteOldAttachments(
  olderThanDays: number,
  conversationId?: string
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let query = `DELETE FROM attachments WHERE uploaded_at < $1`;
    const params: any[] = [cutoffDate.toISOString()];

    if (conversationId) {
      query += ` AND conversation_id = $2`;
      params.push(conversationId);
    }

    query += ` RETURNING id`;

    const result = await sql(query, params);
    console.log(`Cleanup: Deleted ${result.length} old attachments (older than ${olderThanDays} days)`);
    return result.length;
  } catch (error) {
    console.error('Failed to cleanup old attachments:', error);
    return 0;
  }
}

/**
 * Helper: Map database row to Attachment type
 */
function mapRowToAttachment(row: any): Attachment {
  return {
    id: row.id,
    messageId: row.message_id,
    conversationId: row.conversation_id,
    userId: row.user_id,
    filename: row.filename,
    mimeType: row.mime_type,
    size: row.size,
    url: row.url,
    storageKey: row.storage_key,
    publicUrl: row.public_url,
    metadata: row.metadata || {},
    visionAnalysis: row.vision_analysis,
    uploadedAt: row.uploaded_at,
    analyzedAt: row.analyzed_at,
  };
}

/**
 * Helper: Map database row to ImageAnalysis type
 */
function mapRowToImageAnalysis(row: any): ImageAnalysis {
  return {
    id: row.id,
    attachmentId: row.attachment_id,
    agentType: row.agent_type,
    analysis: row.analysis,
    summary: row.summary,
    detectedType: row.detected_type,
    confidence: row.confidence,
    keyPoints: row.key_points || [],
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}
