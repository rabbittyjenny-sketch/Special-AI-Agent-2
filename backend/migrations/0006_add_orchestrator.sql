-- Migration: Add orchestrator to agent_type enum
-- Version: 1.0.2
-- Date: 2026-02-14

ALTER TYPE "agent_type" ADD VALUE IF NOT EXISTS 'orchestrator';
