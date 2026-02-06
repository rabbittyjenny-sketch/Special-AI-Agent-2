Expected:
{
  "status": "healthy",
  "checks": {
    "database": true,
    "anthropic": true,
    "redis": true
  }
}



Step 2: Add Better Error Handling to Frontend
// app/page.tsx (update sendMessage function)

const sendMessage = async () => {
  if (!input.trim()) return;
  
  const userMessage = input;
  setInput('');
  setLoading(true);
  
  setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        userId: 'test-user-123',
        agentType: 'coder',
        message: userMessage
      })
    });
    
    // ✅ Better error handling
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }
    
    const result = await res.json();
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: result.data.message,
      metadata: {
        confidence: result.data.confidence,
        verified: result.data.verified,
        needsReview: result.data.needsReview,
        warnings: result.data.warnings
      }
    }]);
    
  } catch (error: any) {
    console.error('Error:', error);
    
    // ✅ Show error to user
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: `❌ Error: ${error.message}`,
      metadata: {
        confidence: 0,
        verified: false,
        needsReview: true,
        warnings: ['System error - check console']
      }
    }]);
  } finally {
    setLoading(false);
  }
};


Step 3: Test Individual Components
Test 1: Database Connection
// app/api/test/db/route.ts

import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT NOW() as time`;
    
    return Response.json({ 
      status: 'connected', 
      time: result[0].time 
    });
  } catch (error: any) {
    return Response.json({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}


Test 2: Redis Connection
// app/api/test/redis/route.ts

import { redis } from '@/lib/state/redis-state';

export async function GET() {
  try {
    const result = await redis.ping();
    
    return Response.json({ 
      status: 'connected', 
      ping: result 
    });
  } catch (error: any) {
    return Response.json({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}


Test 3: Claude API
// app/api/test/claude/route.ts

import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    });
    
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-20250514",
      max_tokens: 50,
      messages: [{ role: "user", content: "Say 'test successful'" }]
    });
    
    return Response.json({ 
      status: 'connected', 
      response: response.content[0].text 
    });
  } catch (error: any) {
    return Response.json({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}


Run Tests:
# Test DB
curl http://localhost:3000/api/test/db

# Test Redis
curl http://localhost:3000/api/test/redis

# Test Claude
curl http://localhost:3000/api/test/claude




Step 4: Add Debugging to Chat API
// app/api/chat/route.ts (add logging)

export async function POST(req: Request) {
  console.log('🔵 Chat API called');
  
  try {
    const body = await req.json();
    console.log('📥 Request body:', body);
    
    const { conversationId, userId, agentType, message } = body;
    
    // Validate
    if (!conversationId || !userId || !agentType || !message) {
      console.log('❌ Validation failed:', { conversationId, userId, agentType, message });
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    console.log('✅ Validation passed');
    console.log('🧠 Calling orchestrator...');
    
    const result = await processAgentRequest({
      conversationId,
      userId,
      agentType,
      userMessage: message
    });
    
    console.log('✅ Orchestrator response:', result);
    
    return Response.json({
      success: true,
      data: {
        message: result.message,
        confidence: result.confidence,
        verified: result.verified,
        needsReview: result.escalated,
        reviewReason: result.escalationReason,
        warnings: result.warnings
      },
      metadata: result.metadata
    });
    
  } catch (error: any) {
    console.error('❌ Chat API error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}
