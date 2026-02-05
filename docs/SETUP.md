# Setup Guide

## 1. Database (Neon)
Run the sql commands in `database/schema.sql` in your Neon Console SQL Editor.

## 2. Backend
1. Go to `backend` folder.
2. Run `npm install`.
3. Fill your `DATABASE_URL` in `.env.local`.
4. Run `npm run dev` to start the backend.

## 3. Analyst Agent MCP
1. Go to `mcp-servers/analyst-agent`.
2. Run `npm install`.
3. Run `npm run build`.
4. Run `npm start` to run the server on stdio.

## 4. Environment Variables
Ensure you have the following in `backend/.env.local`:
- `ANTHROPIC_API_KEY`: Your Claude API Key
- `DATABASE_URL`: Your Neon Connection String
- `GOOGLE_SHEETS_CREDENTIALS`: (Optional) JSON string of your Google Service Account key
