
import { pgTable, uuid, varchar, text, jsonb, timestamp, integer, boolean, decimal, unique, index, pgEnum } from 'drizzle-orm/pg-core';

// --- Enums ---
export const agentTypeEnum = pgEnum('agent_type', ['design', 'analyst', 'coder', 'marketing']);
export const conversationStatusEnum = pgEnum('conversation_status', ['active', 'completed', 'failed', 'archived']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system', 'tool']);
export const toolStatusEnum = pgEnum('tool_status', ['pending', 'running', 'success', 'failed', 'timeout']);
export const kbSourceTypeEnum = pgEnum('kb_source_type', ['google_sheets', 'manual', 'api', 'file_upload', 'web_scrape']);

// --- Users & Auth ---
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    avatarUrl: text('avatar_url'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        emailIdx: index('idx_users_email').on(table.email),
    };
});

export const sessions = pgTable('sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata').default({}),
}, (table) => {
    return {
        userIdIdx: index('idx_sessions_user_id').on(table.userId),
        startedAtIdx: index('idx_sessions_started_at').on(table.startedAt),
    };
});

// --- Conversations & Messages ---
export const conversations = pgTable('conversations', {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    agentType: agentTypeEnum('agent_type').notNull(),
    status: conversationStatusEnum('status').default('active'),
    title: varchar('title', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        userIdIdx: index('idx_conversations_user_id').on(table.userId),
        agentTypeIdx: index('idx_conversations_agent_type').on(table.agentType),
        statusIdx: index('idx_conversations_status').on(table.status),
        createdAtIdx: index('idx_conversations_created_at').on(table.createdAt),
    };
});

export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
    role: messageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata').default({}),
    tokensUsed: integer('tokens_used').default(0),
    modelVersion: varchar('model_version', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        convIdIdx: index('idx_messages_conversation_id').on(table.conversationId),
    };
});

// --- Agent State ---
export const agentStates = pgTable('agent_states', {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
    agentType: agentTypeEnum('agent_type').notNull(),
    stateData: jsonb('state_data').notNull().default({}),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
    version: integer('version').default(1),
}, (table) => {
    return {
        uniqueConvAgent: unique('idx_agent_states_conv_agent').on(table.conversationId, table.agentType),
    };
});

// --- MCP Tool Calls ---
export const mcpToolCalls = pgTable('mcp_tool_calls', {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
    agentType: agentTypeEnum('agent_type').notNull(),
    toolName: varchar('tool_name', { length: 100 }).notNull(),
    inputParams: jsonb('input_params').notNull(),
    outputResult: jsonb('output_result'),
    executionTimeMs: integer('execution_time_ms'),
    status: toolStatusEnum('status').default('pending'),
    errorMessage: text('error_message'),
    errorStack: text('error_stack'),
    retryCount: integer('retry_count').default(0),
    mcpServerUrl: varchar('mcp_server_url', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
});

// --- Attachments (Phase 2: Enhanced with Cloud Storage & Vision API) ---
export const attachments = pgTable('attachments', {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    filename: varchar('filename', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 50 }).notNull(),
    size: integer('size').notNull(), // in bytes
    url: text('url').notNull(), // public URL or storage path
    storageKey: varchar('storage_key', { length: 255 }), // R2/S3 storage key (Phase 2)
    publicUrl: text('public_url'), // CDN public URL (Phase 2)
    metadata: jsonb('metadata').default({}), // width, height, format, etc
    visionAnalysis: jsonb('vision_analysis'), // Claude Vision API results (Phase 2)
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true }), // When vision analysis completed (Phase 2)
}, (table) => {
    return {
        convIdIdx: index('idx_attachments_conversation_id').on(table.conversationId),
        userIdIdx: index('idx_attachments_user_id').on(table.userId),
        messageIdIdx: index('idx_attachments_message_id').on(table.messageId),
        storageKeyIdx: index('idx_attachments_storage_key').on(table.storageKey), // Phase 2: Fast lookup by storage key
    };
});

// --- Image Analyses (Phase 2: Vision API Analysis Results) ---
export const imageAnalyses = pgTable('image_analyses', {
    id: uuid('id').defaultRandom().primaryKey(),
    attachmentId: uuid('attachment_id').references(() => attachments.id, { onDelete: 'cascade' }).notNull(),
    agentType: agentTypeEnum('agent_type').notNull(),
    analysis: text('analysis').notNull(), // Full analysis text
    summary: text('summary'), // Condensed summary
    detectedType: varchar('detected_type', { length: 50 }), // design, data, code, other
    confidence: decimal('confidence', { precision: 3, scale: 2 }).default('0.00'), // 0-100 confidence score
    keyPoints: jsonb('key_points').default([]), // Array of key insights
    metadata: jsonb('metadata').default({}), // Additional metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        attachmentIdIdx: index('idx_image_analyses_attachment_id').on(table.attachmentId),
        agentTypeIdx: index('idx_image_analyses_agent_type').on(table.agentType),
    };
});

// --- Knowledge Base ---
export const knowledgeBase = pgTable('knowledge_base', {
    id: uuid('id').defaultRandom().primaryKey(),
    agentType: agentTypeEnum('agent_type').notNull(),
    sourceType: varchar('source_type', { length: 50 }).notNull(), // Changed to varchar to match user snippet preference
    sourceId: varchar('source_id', { length: 255 }),
    category: varchar('category', { length: 100 }),
    key: varchar('key', { length: 255 }).notNull(),
    value: text('value').notNull(),
    metadata: jsonb('metadata').default({}),
    isActive: boolean('is_active').default(true), // ✅ boolean imported correctly
    syncedAt: timestamp('synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- Metrics ---
export const agentMetrics = pgTable('agent_metrics', {
    id: uuid('id').defaultRandom().primaryKey(),
    agentType: agentTypeEnum('agent_type').notNull(),
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
    metricName: varchar('metric_name', { length: 100 }).notNull(),
    metricValue: decimal('metric_value', { precision: 10, scale: 2 }).notNull(),
    metadata: jsonb('metadata').default({}),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        agentTypeIdx: index('idx_metrics_agent_type').on(table.agentType),
    };
});

// --- Agent Configs ---
export const agentConfigs = pgTable('agent_configs', {
    id: uuid('id').defaultRandom().primaryKey(),
    agentType: agentTypeEnum('agent_type').notNull().unique(),
    modelVersion: varchar('model_version', { length: 100 }).default('claude-sonnet-4-20250514'),
    systemPrompt: text('system_prompt').notNull(),
    maxTokens: integer('max_tokens').default(4096),
    temperature: decimal('temperature', { precision: 3, scale: 2 }).default('1.00'),
    availableTools: jsonb('available_tools').notNull().default([]),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- Error Logs (Added missing table from index migration) ---
export const errorLogs = pgTable('error_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    agentType: agentTypeEnum('agent_type'),
    conversationId: uuid('conversation_id').references(() => conversations.id),
    errorType: varchar('error_type', { length: 100 }),
    errorMessage: text('error_message'),
    errorStack: text('error_stack'),
    severity: varchar('severity', { length: 20 }).default('error'),
    context: jsonb('context').default({}),
    resolved: boolean('resolved').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// --- Agent Memory ---
export const agentMemory = pgTable('agent_memory', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    agentType: agentTypeEnum('agent_type').notNull(),
    memoryData: jsonb('memory_data').notNull().default({}),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        uniqueUserAgent: unique('idx_agent_memory_user_agent').on(table.userId, table.agentType),
    };
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type AgentMemory = typeof agentMemory.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type ImageAnalysis = typeof imageAnalyses.$inferSelect;
