-- Users & Sessions
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    metadata JSONB
);

-- Conversations & Messages
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    user_id UUID REFERENCES users(id),
    agent_type VARCHAR(50), -- 'design', 'analyst', 'coder', 'marketing'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    role VARCHAR(20), -- 'user', 'assistant', 'system'
    content TEXT,
    metadata JSONB, -- store tool calls, MCP responses, etc.
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Agent State & Context
CREATE TABLE IF NOT EXISTS agent_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    agent_type VARCHAR(50),
    state_data JSONB, -- current working context
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(conversation_id, agent_type)
);

-- MCP Tool Calls & Results
CREATE TABLE IF NOT EXISTS mcp_tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id),
    tool_name VARCHAR(100), -- 'google_sheets_read', 'figma_export', etc.
    input_params JSONB,
    output_result JSONB,
    execution_time_ms INTEGER,
    status VARCHAR(20), -- 'success', 'failed', 'timeout'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Base (Google Sheets sync)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_type VARCHAR(50),
    source_type VARCHAR(50), -- 'google_sheets', 'manual', 'api'
    source_id VARCHAR(255), -- sheet ID, document ID, etc.
    key VARCHAR(255), -- topic, category, etc.
    value TEXT,
    metadata JSONB,
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_agent_key ON knowledge_base(agent_type, key);

-- Agent Performance Metrics
CREATE TABLE IF NOT EXISTS agent_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_type VARCHAR(50),
    metric_name VARCHAR(100), -- 'response_time', 'success_rate', 'user_satisfaction'
    metric_value DECIMAL,
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_agent_time ON agent_metrics(agent_type, recorded_at);
