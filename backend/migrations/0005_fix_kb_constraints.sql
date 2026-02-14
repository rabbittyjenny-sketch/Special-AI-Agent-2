-- Migration: Fix Knowledge Base Constraints
-- Version: 1.0.1
-- Date: 2026-02-14

-- Make legacy columns nullable to support new architecture
ALTER TABLE "knowledge_base" ALTER COLUMN "agent_type" DROP NOT NULL;
ALTER TABLE "knowledge_base" ALTER COLUMN "source_type" DROP NOT NULL;
ALTER TABLE "knowledge_base" ALTER COLUMN "key" DROP NOT NULL;
ALTER TABLE "knowledge_base" ALTER COLUMN "value" DROP NOT NULL;
