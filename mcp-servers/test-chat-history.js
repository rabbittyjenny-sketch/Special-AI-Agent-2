/**
 * Test script for Chat History MCP Server
 *
 * Usage: node test-chat-history.js
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Start the MCP server
const server = spawn('node', ['./chat-history-server.js']);

// Create readline interface for server output
const rl = readline.createInterface({
  input: server.stdout,
  output: process.stdout,
  terminal: false
});

// Send MCP request
function sendRequest(request) {
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Test sequence
async function runTests() {
  console.log('🧪 Testing Chat History MCP Server...\n');

  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 1: List tools
  console.log('📋 Test 1: List available tools');
  sendRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 2: Save a message
  console.log('\n💾 Test 2: Save a test message');
  sendRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'save_message',
      arguments: {
        sessionId: 'test-session-001',
        agentType: 'code-specialist',
        role: 'user',
        content: 'Hello, this is a test message!',
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      }
    }
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 3: Get session history
  console.log('\n📖 Test 3: Retrieve session history');
  sendRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'get_session_history',
      arguments: {
        sessionId: 'test-session-001'
      }
    }
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 4: Search conversations
  console.log('\n🔍 Test 4: Search conversations');
  sendRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'search_conversations',
      arguments: {
        query: 'test',
        limit: 5
      }
    }
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n✅ Tests completed!');
  process.exit(0);
}

// Handle server output
rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    console.log('📩 Server Response:', JSON.stringify(response, null, 2));
  } catch (e) {
    console.log('📝 Server Log:', line);
  }
});

// Handle server errors
server.stderr.on('data', (data) => {
  console.error('⚠️  Server Error:', data.toString());
});

// Handle server exit
server.on('close', (code) => {
  console.log(`\n🛑 Server exited with code ${code}`);
  process.exit(code);
});

// Run tests
runTests().catch(err => {
  console.error('❌ Test error:', err);
  process.exit(1);
});
