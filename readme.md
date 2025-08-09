# Azure App Proxy Docker Simulation

This is a complete Docker-based simulation of Azure Application Proxy functionality, demonstrating how external clients can securely access internal APIs through authentication and proxy mechanisms.

## Architecture

```
External Client (Browser)
    ↓
Azure AD Simulator (Auth Service)
    ↓
App Proxy Simulator
    ↓
Internal API (isolated network)
```

## Services

- **Internal API** (port 3000, internal network only) - Your backend API
- **Auth Service** (port 3001) - Simulates Azure AD authentication
- **App Proxy** (port 8080) - Simulates Azure Application Proxy
- **Frontend Demo** (port 3002) - Interactive web interface

## Quick Start

```bash
# Start the demo
./start-demo.sh

# Open browser
open http://localhost:3002

# Test services
./test-demo.sh

# Stop demo
./stop-demo.sh
```

## Demo Flow

1. **Login**: Authenticate with demo users via simulated Azure AD
2. **Get Token**: Receive JWT access token
3. **API Access**: Call internal API through App Proxy using token
4. **Security**: Direct API access is blocked (network isolation)

## Demo Users

All users have password: `demo123`

- `demo@company.com` - Basic user
- `john.doe@company.com` - Engineering user
- `jane.smith@company.com` - Admin user

## API Endpoints

Via App Proxy (http://localhost:8080):

- `GET /api/data` - Get user data
- `GET /api/profile` - Get user profile
- `POST /api/submit` - Submit data

## Key Features Demonstrated

✅ **Azure AD Authentication Simulation**
✅ **JWT Token Validation**  
✅ **Request Proxying to Internal APIs**
✅ **Network Isolation (internal API not directly accessible)**
✅ **Security Headers Injection**
✅ **User Context Forwarding**
✅ **Comprehensive Error Handling**
✅ **Interactive Web Demo**

This simulation provides a complete understanding of how Azure App Proxy works without requiring any cloud resources or Premium licenses!
Test123@#12