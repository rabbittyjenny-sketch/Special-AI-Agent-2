-- Migration: Initial Schema
-- Created: 2025-02-05
-- Description: Create all base tables for specialized agents

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT valid_session CHECK (ended_at IS NULL OR ended_at > started_at)
);

-- ============================================
-- CONVERSATIONS & MESSAGES
-- ============================================

CREATE TYPE agent_type AS ENUM ('design', 'analyst', 'coder', 'marketing');
CREATE TYPE conversation_status AS ENUM ('active', 'completed', 'failed', 'archived');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system', 'tool');

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_type agent_type NOT NULL,
    status conversation_status DEFAULT 'active',
    title VARCHAR(255), -- Auto-generated from first message
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- tool calls, attachments, etc.
    tokens_used INTEGER DEFAULT 0,
    model_version VARCHAR(100), -- e.g., "claude-sonnet-4-20250514"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AGENT STATE MANAGEMENT
-- ============================================

CREATE TABLE agent_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    agent_type agent_type NOT NULL,
    state_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1, -- For optimistic locking
    UNIQUE(conversation_id, agent_type)
);

-- ============================================
-- MCP TOOL CALLS & EXECUTION
-- ============================================

CREATE TYPE tool_status AS ENUM ('pending', 'running', 'success', 'failed', 'timeout');

CREATE TABLE mcp_tool_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    agent_type agent_type NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    input_params JSONB NOT NULL,
    output_result JSONB,
    execution_time_ms INTEGER,
    status tool_status DEFAULT 'pending',
    error_message TEXT,
    error_stack TEXT,
    retry_count INTEGER DEFAULT 0,
    mcp_server_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- KNOWLEDGE BASE
-- ============================================

CREATE TYPE kb_source_type AS ENUM ('google_sheets', 'manual', 'api', 'file_upload', 'web_scrape');

CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type agent_type NOT NULL,
    source_type kb_source_type NOT NULL,
    source_id VARCHAR(255),
    category VARCHAR(100),
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(1536),
    is_active BOOLEAN DEFAULT true,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- METRICS & ANALYTICS
-- ============================================

CREATE TABLE agent_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type agent_type NOT NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10, 2) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type agent_type,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    error_type VARCHAR(100),
    error_message TEXT NOT NULL,
    error_stack TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    severity VARCHAR(20) DEFAULT 'error',
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AGENT CONFIGURATIONS
-- ============================================

CREATE TABLE agent_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type agent_type NOT NULL UNIQUE,
    model_version VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',
    system_prompt TEXT NOT NULL,
    max_tokens INTEGER DEFAULT 4096,
    temperature DECIMAL(3, 2) DEFAULT 1.0,
    available_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
    rate_limit_per_minute INTEGER DEFAULT 60,
    timeout_seconds INTEGER DEFAULT 30,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AGENT MEMORY (LAYER 2)
-- ============================================

CREATE TABLE agent_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_type agent_type NOT NULL,
    memory_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, agent_type)
);

CREATE INDEX idx_agent_memory_user_agent ON agent_memory(user_id, agent_type);
CREATE INDEX idx_agent_memory_data ON agent_memory USING gin(memory_data);

COMMIT;
