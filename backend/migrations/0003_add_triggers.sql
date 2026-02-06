-- Migration: Add Triggers & Functions
-- Created: 2025-02-05
-- Description: Automated timestamp updates, validations, and cleanup

BEGIN;

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate conversation title from first user message
CREATE OR REPLACE FUNCTION generate_conversation_title()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'user' AND (
        SELECT title FROM conversations WHERE id = NEW.conversation_id
    ) IS NULL THEN
        UPDATE conversations 
        SET title = LEFT(NEW.content, 100)
        WHERE id = NEW.conversation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate and cache metrics on tool completion
CREATE OR REPLACE FUNCTION record_tool_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'success' AND OLD.status != 'success' THEN
        -- Record execution time metric
        INSERT INTO agent_metrics (
            agent_type,
            conversation_id,
            metric_name,
            metric_value,
            metadata
        ) VALUES (
            NEW.agent_type,
            NEW.conversation_id,
            'tool_execution_time_ms',
            NEW.execution_time_ms,
            jsonb_build_object('tool_name', NEW.tool_name)
        );
    END IF;
    
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        -- Log error
        INSERT INTO error_logs (
            agent_type,
            conversation_id,
            error_type,
            error_message,
            error_stack,
            context
        ) VALUES (
            NEW.agent_type,
            NEW.conversation_id,
            'tool_execution_failed',
            NEW.error_message,
            NEW.error_stack,
            jsonb_build_object('tool_name', NEW.tool_name, 'input', NEW.input_params)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optimistic locking for agent states
CREATE OR REPLACE FUNCTION check_agent_state_version()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.version != NEW.version - 1 THEN
        RAISE EXCEPTION 'Concurrent modification detected. Expected version %, got %', 
            OLD.version + 1, NEW.version;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-archive old conversations
CREATE OR REPLACE FUNCTION archive_old_conversations()
RETURNS void AS $$
BEGIN
    UPDATE conversations
    SET status = 'archived'
    WHERE status = 'completed'
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ATTACH TRIGGERS
-- ============================================

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_configs_updated_at
    BEFORE UPDATE ON agent_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Business logic triggers
CREATE TRIGGER generate_conv_title_on_first_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION generate_conversation_title();

CREATE TRIGGER record_metrics_on_tool_completion
    AFTER UPDATE ON mcp_tool_calls
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION record_tool_metrics();

CREATE TRIGGER check_state_version_on_update
    BEFORE UPDATE ON agent_states
    FOR EACH ROW
    EXECUTE FUNCTION check_agent_state_version();

COMMIT;
