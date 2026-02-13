#!/bin/bash

echo "========================================="
echo "Testing Upload Endpoint"
echo "========================================="

# Test 1: Health check
echo ""
echo "📋 Test 1: Health Check"
echo "GET /api/health"
curl -s -X GET http://localhost:3000/api/health | head -20

# Test 2: Upload with no file
echo ""
echo "📋 Test 2: Upload with missing file (should error)"
echo "POST /api/upload (no file)"
curl -s -X POST http://localhost:3000/api/upload \
  -F "userId=test-user-123" \
  -F "conversationId=test-conv-456" | jq .

# Test 3: Check if endpoint exists
echo ""
echo "📋 Test 3: Check if upload endpoint is accessible"
curl -s -I http://localhost:3000/api/upload | head -10

echo ""
echo "========================================="
echo "Tests Complete"
echo "========================================="
