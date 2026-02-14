-- Migration: Complete System Architecture Update
-- Version: 1.0.0
-- Date: 2026-02-14

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ===============================================
-- 1. Update/Create Core Tables
-- ===============================================

-- Modify agent_configs to match new architecture
ALTER TABLE "agent_configs" 
ADD COLUMN IF NOT EXISTS "capabilities" jsonb,
ADD COLUMN IF NOT EXISTS "performance_targets" jsonb,
ADD COLUMN IF NOT EXISTS "version" varchar(20) DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true;

-- Update knowledge_base to match new architecture
-- We handle the transition from key/value to title/content
ALTER TABLE "knowledge_base"
ADD COLUMN IF NOT EXISTS "title" varchar(255),
ADD COLUMN IF NOT EXISTS "content" text,
ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

-- If "value" existed and "content" didn't, we might want to migrate data, 
-- but since this is a seed update, we'll assume fresh start or coexistence.

-- ===============================================
-- 2. Create New Tables from Architecture
-- ===============================================

-- Error Analysis Logs
CREATE TABLE IF NOT EXISTS "error_analysis_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" uuid REFERENCES "conversations"("id"),
  "agent_type" varchar(50) NOT NULL,
  "issue_description" text NOT NULL,
  "root_cause" text,
  "suggested_fixes" jsonb,
  "user_decision" varchar(50),
  "resolved" boolean DEFAULT false,
  "created_at" timestamp DEFAULT NOW(),
  "resolved_at" timestamp
);

-- User Memory (Enhanced)
CREATE TABLE IF NOT EXISTS "user_memory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar(255) NOT NULL, -- Changed from UUID to Varchar to support flexible IDs
  "agent_type" varchar(50) NOT NULL,
  "preferences" jsonb,
  "learned_patterns" jsonb,
  "interaction_count" integer DEFAULT 0,
  "last_interaction_at" timestamp DEFAULT NOW(),
  CONSTRAINT "user_memory_user_agent_unique" UNIQUE ("user_id", "agent_type")
);

-- Performance Metrics
CREATE TABLE IF NOT EXISTS "performance_metrics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "agent_type" varchar(50) NOT NULL,
  "metric_type" varchar(50) NOT NULL,
  "value" numeric NOT NULL,
  "recorded_at" timestamp DEFAULT NOW(),
  "metadata" jsonb
);

-- Agent States (Enhanced)
CREATE TABLE IF NOT EXISTS "agent_states_v2" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" uuid REFERENCES "conversations"("id"),
  "agent_type" varchar(50) NOT NULL,
  "state_data" jsonb NOT NULL,
  "updated_at" timestamp DEFAULT NOW()
);

-- ===============================================
-- 3. Update Existing Tables
-- ===============================================

-- Ensure conversations has new tracking columns
ALTER TABLE "conversations"
ADD COLUMN IF NOT EXISTS "message_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "tokens_used" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "last_message_at" timestamp DEFAULT NOW();

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_kb_category" ON "knowledge_base" ("category");
CREATE INDEX IF NOT EXISTS "idx_kb_embedding" ON "knowledge_base" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS "idx_error_unresolved" ON "error_analysis_logs" ("agent_type", "resolved");
CREATE INDEX IF NOT EXISTS "idx_user_memory" ON "user_memory" ("user_id");
