#!/usr/bin/env python3
"""
Knowledge Base Importer
Convert CSV to SQL INSERT statements for Neon PostgreSQL

Usage:
  python3 scripts/import-knowledge-base.py knowledge-base-template.csv > import.sql

Then run the SQL file in Neon Console or via psql
"""

import csv
import sys
import json
from datetime import datetime

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    return s.replace("'", "''")

def csv_to_sql(csv_file):
    """Convert CSV to SQL INSERT statements"""

    print("-- Knowledge Base Import")
    print(f"-- Generated: {datetime.now().isoformat()}")
    print("-- Source: {}".format(csv_file))
    print()

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for i, row in enumerate(reader, 1):
            agent_type = row['agent_type']
            source_type = row['source_type']
            category = row['category']
            key = escape_sql_string(row['key'])
            value = escape_sql_string(row['value'])
            metadata = row['metadata']
            is_active = row['is_active'].lower() == 'true'

            # Validate metadata JSON
            try:
                json.loads(metadata)
            except json.JSONDecodeError:
                print(f"-- Warning: Invalid JSON in row {i}, using empty object", file=sys.stderr)
                metadata = '{}'

            sql = f"""INSERT INTO knowledge_base (
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
  '{metadata}'::jsonb,
  {str(is_active).lower()},
  NOW()
);

"""
            print(sql)

    print("-- Done! Imported rows")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 import-knowledge-base.py <csv_file>")
        sys.exit(1)

    csv_file = sys.argv[1]
    csv_to_sql(csv_file)
