
#!/bin/bash

echo "🚀 Starting Azure App Proxy Demo..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start all services
echo "📦 Building Docker images..."
docker-compose build --no-cache

echo "🔄 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to initialize..."
sleep 10

echo ""
echo "✅ Azure App Proxy Demo is ready!"
echo ""
echo "🌐 Access Points:"
echo "   Frontend Demo:    http://localhost:3002"
echo "   Auth Service:     http://localhost:3001"  
echo "   App Proxy:        http://localhost:8080"
echo "   Internal API:     Not directly accessible (as intended)"
echo ""
echo "👥 Demo Users (password: demo123):"
echo "   demo@company.com"
echo "   john.doe@company.com" 
echo "   jane.smith@company.com"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop demo:        docker-compose down"
echo "   Restart:          docker-compose restart"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "Open http://localhost:3002 in your browser to start the demo!"