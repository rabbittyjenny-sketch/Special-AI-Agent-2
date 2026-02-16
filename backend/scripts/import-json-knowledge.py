#!/usr/bin/env python3
"""
JSON Knowledge Base Importer
Convert JSON to SQL INSERT statements for Neon PostgreSQL

Usage:
  python3 scripts/import-json-knowledge.py knowledge-base-template.json > import.sql

Then run the SQL file in Neon Console or via psql
"""

import json
import sys
from datetime import datetime

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    return s.replace("'", "''")

def json_to_sql(json_file):
    """Convert JSON to SQL INSERT statements"""

    print("-- Knowledge Base Import (JSON)")
    print(f"-- Generated: {datetime.now().isoformat()}")
    print(f"-- Source: {json_file}")
    print()

    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    entries = data.get('entries', [])
    metadata_info = data.get('metadata', {})

    print(f"-- Total Entries: {len(entries)}")
    print(f"-- Source: {metadata_info.get('source', 'Unknown')}")
    print(f"-- Version: {metadata_info.get('version', '1.0')}")
    print()

    for i, entry in enumerate(entries, 1):
        agent_type = entry['agentType']
        source_type = entry['sourceType']
        category = entry['category']
        key = escape_sql_string(entry['key'])
        value = escape_sql_string(entry['value'])
        metadata_json = json.dumps(entry.get('metadata', {}))
        is_active = entry.get('isActive', True)

        sql = f"""-- Entry {i}: {entry['key']}
INSERT INTO knowledge_base (
  agent_type,
  source_type,
  category,
  key,
  value,
  metadata,
  is_active,
  synced_at
) VALUES (
  '{agent_type}',
  '{source_type}',
  '{category}',
  '{key}',
  '{value}',
  '{metadata_json}'::jsonb,
  {str(is_active).lower()},
  NOW()
);

"""
        print(sql)

    print(f"-- ✅ Done! Generated {len(entries)} INSERT statements")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 import-json-knowledge.py <json_file>")
        print("Example: python3 import-json-knowledge.py knowledge-base-template.json > import.sql")
        sys.exit(1)

    json_file = sys.argv[1]
    json_to_sql(json_file)
