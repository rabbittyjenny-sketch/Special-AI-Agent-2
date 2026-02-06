-- Migration: Add Performance Indexes
-- Created: 2025-02-05
-- Description: Optimize query performance

BEGIN;

-- ============================================
-- USER & SESSION INDEXES
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);

-- ============================================
-- CONVERSATION INDEXES
-- ============================================

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_agent_type ON conversations(agent_type);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_conversations_user_agent_status 
    ON conversations(user_id, agent_type, status);

-- ============================================
-- MESSAGE INDEXES
-- ============================================

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_role ON messages(role);

-- Composite index for conversation history retrieval
CREATE INDEX idx_messages_conv_created 
    ON messages(conversation_id, created_at ASC);

-- Full-text search on message content
CREATE INDEX idx_messages_content_trgm ON messages USING gin(content gin_trgm_ops);

-- ============================================
-- AGENT STATE INDEXES
-- ============================================

CREATE INDEX idx_agent_states_conversation_id ON agent_states(conversation_id);
CREATE INDEX idx_agent_states_agent_type ON agent_states(agent_type);
CREATE UNIQUE INDEX idx_agent_states_conv_agent 
    ON agent_states(conversation_id, agent_type);

-- GIN index for JSONB queries
CREATE INDEX idx_agent_states_state_data ON agent_states USING gin(state_data);

-- ============================================
-- MCP TOOL CALL INDEXES
-- ============================================

CREATE INDEX idx_mcp_calls_message_id ON mcp_tool_calls(message_id);
CREATE INDEX idx_mcp_calls_conversation_id ON mcp_tool_calls(conversation_id);
CREATE INDEX idx_mcp_calls_agent_type ON mcp_tool_calls(agent_type);
CREATE INDEX idx_mcp_calls_tool_name ON mcp_tool_calls(tool_name);
CREATE INDEX idx_mcp_calls_status ON mcp_tool_calls(status);
CREATE INDEX idx_mcp_calls_created_at ON mcp_tool_calls(created_at DESC);

-- Composite for performance monitoring
CREATE INDEX idx_mcp_calls_agent_tool_status 
    ON mcp_tool_calls(agent_type, tool_name, status);

-- ============================================
-- KNOWLEDGE BASE INDEXES
-- ============================================

CREATE INDEX idx_kb_agent_type ON knowledge_base(agent_type);
CREATE INDEX idx_kb_category ON knowledge_base(category);
CREATE INDEX idx_kb_key ON knowledge_base(key);
CREATE INDEX idx_kb_source_type ON knowledge_base(source_type);
CREATE INDEX idx_kb_is_active ON knowledge_base(is_active) WHERE is_active = true;

-- Composite index for common searches
CREATE INDEX idx_kb_agent_category_active 
    ON knowledge_base(agent_type, category, is_active) 
    WHERE is_active = true;

-- Full-text search
CREATE INDEX idx_kb_value_trgm ON knowledge_base USING gin(value gin_trgm_ops);

-- GIN index for metadata queries
CREATE INDEX idx_kb_metadata ON knowledge_base USING gin(metadata);

-- ============================================
-- METRICS INDEXES
-- ============================================

CREATE INDEX idx_metrics_agent_type ON agent_metrics(agent_type);
CREATE INDEX idx_metrics_metric_name ON agent_metrics(metric_name);
CREATE INDEX idx_metrics_recorded_at ON agent_metrics(recorded_at DESC);
CREATE INDEX idx_metrics_conversation_id ON agent_metrics(conversation_id);

-- Composite for analytics queries
CREATE INDEX idx_metrics_agent_name_time 
    ON agent_metrics(agent_type, metric_name, recorded_at DESC);

-- ============================================
-- ERROR LOG INDEXES
-- ============================================

CREATE INDEX idx_errors_agent_type ON error_logs(agent_type);
CREATE INDEX idx_errors_error_type ON error_logs(error_type);
CREATE INDEX idx_errors_severity ON error_logs(severity);
CREATE INDEX idx_errors_resolved ON error_logs(resolved) WHERE resolved = false;
CREATE INDEX idx_errors_created_at ON error_logs(created_at DESC);

COMMIT;
