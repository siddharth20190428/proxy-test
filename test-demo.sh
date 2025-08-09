#!/bin/bash

echo "🧪 Testing Azure App Proxy Demo..."
echo ""

# Test auth service
echo "1. Testing Auth Service..."
response=$(curl -s -w "%{http_code}" -o /tmp/auth_test http://localhost:3001/health)
if [ "$response" = "200" ]; then
    echo "   ✅ Auth Service: Online"
else
    echo "   ❌ Auth Service: Offline (HTTP $response)"
fi

# Test app proxy
echo "2. Testing App Proxy..."
response=$(curl -s -w "%{http_code}" -o /tmp/proxy_test http://localhost:8080/health)
if [ "$response" = "200" ]; then
    echo "   ✅ App Proxy: Online"
else
    echo "   ❌ App Proxy: Offline (HTTP $response)"
fi

# Test frontend
echo "3. Testing Frontend..."
response=$(curl -s -w "%{http_code}" -o /tmp/frontend_test http://localhost:3002)
if [ "$response" = "200" ]; then
    echo "   ✅ Frontend: Online"
else
    echo "   ❌ Frontend: Offline (HTTP $response)"
fi

echo ""
echo "🔑 Testing Authentication Flow..."

# Get token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@company.com","password":"demo123"}' | \
  grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "   ✅ Authentication: Success"
    
    # Test API access via proxy
    echo "4. Testing API Access via App Proxy..."
    response=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
      -o /tmp/api_test http://localhost:8080/api/data)
    
    if [ "$response" = "200" ]; then
        echo "   ✅ API Access via Proxy: Success"
    else
        echo "   ❌ API Access via Proxy: Failed (HTTP $response)"
    fi
    
    # Test direct API access (should fail)
    echo "5. Testing Direct API Access (should fail)..."
    response=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
      -o /tmp/direct_test http://localhost:3001/api/data 2>/dev/null)
    
    if [ "$response" != "200" ]; then
        echo "   ✅ Direct API Access: Blocked (correct behavior)"
    else
        echo "   ⚠️  Direct API Access: Not blocked (unexpected)"
    fi
else
    echo "   ❌ Authentication: Failed"
fi

echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "🌐 Open http://localhost:3002 to use the interactive demo!"