
#!/bin/bash

echo "🛑 Stopping Azure App Proxy Demo..."

docker-compose down
docker-compose rm -f

echo "✅ Demo stopped and containers removed."
echo ""
echo "To restart: ./start-demo.sh"