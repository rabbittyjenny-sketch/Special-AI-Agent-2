
import { pgTable, uuid, varchar, text, jsonb, timestamp, integer, boolean, decimal, unique, index, pgEnum } from 'drizzle-orm/pg-core';

// --- Enums ---
export const agentTypeEnum = pgEnum('agent_type', ['design', 'analyst', 'coder', 'marketing', 'orchestrator']);
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

// --- Attachments ---
export const attachments = pgTable('attachments', {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    filename: varchar('filename', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 50 }).notNull(),
    size: integer('size').notNull(),
    url: text('url').notNull(),
    storageKey: varchar('storage_key', { length: 255 }),
    publicUrl: text('public_url'),
    metadata: jsonb('metadata').default({}),
    visionAnalysis: jsonb('vision_analysis'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true }),
}, (table) => {
    return {
        convIdIdx: index('idx_attachments_conversation_id').on(table.conversationId),
        userIdIdx: index('idx_attachments_user_id').on(table.userId),
        messageIdIdx: index('idx_attachments_message_id').on(table.messageId),
    };
});

// --- Image Analyses (RESTORED MISSING TABLE) ---
export const imageAnalyses = pgTable('image_analyses', {
    id: uuid('id').defaultRandom().primaryKey(),
    attachmentId: uuid('attachment_id').references(() => attachments.id, { onDelete: 'cascade' }).notNull(),
    agentType: agentTypeEnum('agent_type').notNull(),
    analysis: text('analysis').notNull(),
    summary: text('summary'),
    detectedType: varchar('detected_type', { length: 50 }),
    confidence: decimal('confidence', { precision: 5, scale: 2 }),
    keyPoints: jsonb('key_points').default([]),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        attIdIdx: index('idx_image_analyses_attachment_id').on(table.attachmentId),
    };
});

// --- Knowledge Base (RESTORED MISSING COLUMNS) ---
export const knowledgeBase = pgTable('knowledge_base', {
    id: uuid('id').defaultRandom().primaryKey(),
    agentType: agentTypeEnum('agent_type'), // Restored
    sourceType: varchar('source_type', { length: 50 }), // Restored
    sourceId: varchar('source_id', { length: 255 }), // Restored
    category: varchar('category', { length: 100 }),
    title: varchar('title', { length: 255 }), // Mapped to 'key' in Logic
    content: text('content').notNull(),      // Mapped to 'value' in Logic
    key: varchar('key', { length: 255 }),    // Restored for direct mapping if needed
    value: text('value'),                    // Restored for direct mapping if needed
    isActive: boolean('is_active').default(true), // Restored
    syncedAt: timestamp('synced_at', { withTimezone: true }), // Restored
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        agentTypeIdx: index('idx_kb_agent_type').on(table.agentType),
        categoryIdx: index('idx_kb_category').on(table.category),
        searchIdx: index('idx_kb_search').on(table.title),
    };
});

// --- Agent Configs ---
export const agentConfigs = pgTable('agent_configs', {
    id: uuid('id').defaultRandom().primaryKey(),
    agentType: agentTypeEnum('agent_type').notNull().unique(),
    systemPrompt: text('system_prompt').notNull(),
    capabilities: jsonb('capabilities').default({}),
    performanceTargets: jsonb('performance_targets').default({}),
    active: boolean('active').default(true),
    version: varchar('version', { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- Error Analysis Logs ---
export const errorAnalysisLogs = pgTable('error_analysis_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').references(() => conversations.id),
    agentType: agentTypeEnum('agent_type'),
    issueDescription: text('issue_description'),
    rootCause: text('root_cause'),
    suggestedFixes: jsonb('suggested_fixes'),
    userDecision: varchar('user_decision', { length: 100 }),
    resolved: boolean('resolved').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// --- User Memory ---
export const userMemory = pgTable('user_memory', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    agentType: agentTypeEnum('agent_type').notNull(),
    preferences: jsonb('preferences').default({}),
    learnedPatterns: jsonb('learned_patterns').default([]),
    interactionCount: integer('interaction_count').default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        uniqueUserAgent: unique('idx_user_memory_user_agent').on(table.userId, table.agentType),
    };
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type UserMemory = typeof userMemory.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type ImageAnalysis = typeof imageAnalyses.$inferSelect;
