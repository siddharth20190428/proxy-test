const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

// Configuration from environment
const JWT_SECRET = process.env.JWT_SECRET || "demo-jwt-secret-key";
const TOKEN_EXPIRY = parseInt(process.env.TOKEN_EXPIRY) || 3600;
const TENANT_ID = process.env.AZURE_TENANT_ID || "demo-tenant-id";
const CLIENT_ID = process.env.AZURE_CLIENT_ID || "demo-client-id";

// Middleware
app.use(helmet());
app.use(morgan("combined"));
app.use(
  cors({
    origin: [/^http:\/\/192\.168\.\d+\.\d+:3002$/, "http://localhost:3002", "http://localhost:8080"],
    credentials: true,
  })
);
app.use(express.json());

// Demo users (simulates Azure AD users)
const demoUsers = [
  {
    id: uuidv4(),
    email: "demo@siddharth201820gmail.onmicrosoft.com",
    name: "John Doe",
    password: bcrypt.hashSync("Test123@#12", 10),
    roles: ["user", "api-access"],
    department: "Engineering",
  },
  {
    id: uuidv4(),
    email: "demo2@siddharth201820gmail.onmicrosoft.com",
    name: "Jane Smith",
    password: bcrypt.hashSync("Test123@#12", 10),
    roles: ["user", "api-access", "admin"],
    department: "IT",
  },
  {
    id: uuidv4(),
    email: "demo3@siddharth201820gmail.onmicrosoft.com",
    name: "Demo User",
    password: bcrypt.hashSync("Test123@#12", 10),
    roles: ["user", "api-access"],
    department: "Demo",
  },
];

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Auth Service (Azure AD Simulator)",
    timestamp: new Date().toISOString(),
    tenant_id: TENANT_ID,
    client_id: CLIENT_ID,
  });
});

// OAuth 2.0 Client Credentials Flow (for service-to-service)
app.post("/oauth2/v2.0/token", (req, res) => {
  const { grant_type, client_id, client_secret, scope } = req.body;

  console.log("🔐 OAuth token request:", { grant_type, client_id, scope });

  if (grant_type !== "client_credentials") {
    return res.status(400).json({
      error: "unsupported_grant_type",
      error_description: "Only client_credentials grant type is supported",
    });
  }

  // Simulate client validation (in real Azure AD, this would validate against registered app)
  if (client_id !== CLIENT_ID) {
    return res.status(401).json({
      error: "invalid_client",
      error_description: "Invalid client credentials",
    });
  }

  const token = jwt.sign(
    {
      aud: client_id,
      iss: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
      sub: client_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
      scope: scope || "api://default",
      appid: client_id,
      tenant_id: TENANT_ID,
    },
    JWT_SECRET
  );

  res.json({
    token_type: "Bearer",
    expires_in: TOKEN_EXPIRY,
    access_token: token,
    scope: scope || "api://default",
  });
});

// User login (simulates Azure AD user authentication)
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  console.log(`🔑 Login attempt for: ${email}`);

  if (!email || !password) {
    return res.status(400).json({
      error: "invalid_request",
      message: "Email and password are required",
    });
  }

  const user = demoUsers.find((u) => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({
      error: "invalid_credentials",
      message: "Invalid email or password",
    });
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      department: user.department,
      aud: CLIENT_ID,
      iss: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
      tenant_id: TENANT_ID,
    },
    JWT_SECRET
  );

  console.log(`✅ Login successful for: ${email}`);

  res.json({
    message: "Authentication successful",
    token_type: "Bearer",
    access_token: token,
    expires_in: TOKEN_EXPIRY,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      department: user.department,
    },
  });
});

// Token validation endpoint
app.post("/auth/validate", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      valid: false,
      error: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      valid: true,
      user: {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        roles: decoded.roles,
        department: decoded.department,
        expires_at: new Date(decoded.exp * 1000).toISOString(),
      },
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      error: "Invalid token",
      details: error.message,
    });
  }
});

// Get available demo users (for testing)
app.get("/auth/demo-users", (req, res) => {
  res.json({
    message: "Available demo users for testing",
    users: demoUsers.map((user) => ({
      email: user.email,
      name: user.name,
      roles: user.roles,
      department: user.department,
      demo_password: "demo123", // Only for demo purposes!
    })),
  });
});

// JWKS endpoint (JSON Web Key Set) - simulates Azure AD JWKS
app.get("/.well-known/jwks.json", (req, res) => {
  // In a real implementation, this would return proper JWK format
  res.json({
    keys: [
      {
        kid: "demo-key-id",
        use: "sig",
        alg: "HS256",
        kty: "oct",
      },
    ],
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔐 Auth Service (Azure AD Simulator) running on port ${PORT}`);
  console.log(`🆔 Tenant ID: ${TENANT_ID}`);
  console.log(`📱 Client ID: ${CLIENT_ID}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /oauth2/v2.0/token - OAuth2 token endpoint`);
  console.log(`   POST /auth/login - User login`);
  console.log(`   POST /auth/validate - Token validation`);
  console.log(`   GET  /auth/demo-users - List demo users`);
  console.log(`   GET  /.well-known/jwks.json - JWKS endpoint`);
  console.log(`\n👥 Demo Users:`);
  demoUsers.forEach((user) => {
    console.log(`   ${user.email} (password: demo123)`);
  });
});
