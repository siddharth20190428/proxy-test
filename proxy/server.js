const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;

// Configuration
const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL || "http://internal-api:3000";
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://auth-service:3000";
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS || "http://localhost:3002"
).split(",");

console.log("🔧 App Proxy Configuration:");
console.log(`   Internal API: ${INTERNAL_API_URL}`);
console.log(`   Auth Service: ${AUTH_SERVICE_URL}`);
console.log(`   Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}`);

// Middleware
app.use(helmet());
app.use(morgan("combined"));
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
);
app.use(express.json());

// Authentication middleware (simulates Azure App Proxy authentication)
const authenticateRequest = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log("❌ App Proxy: No authorization header");
    return res.status(401).json({
      error: "Authentication required",
      message: "No authorization header provided",
      proxy: "Azure App Proxy Simulator",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    console.log("❌ App Proxy: Invalid authorization format");
    return res.status(401).json({
      error: "Authentication required",
      message: "Invalid authorization format",
      proxy: "Azure App Proxy Simulator",
    });
  }

  try {
    // Validate token with auth service (simulates Azure AD validation)
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/auth/validate`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.valid) {
      console.log(
        `✅ App Proxy: Token validated for user ${response.data.user.email}`
      );
      req.user = response.data.user;
      req.validatedToken = token;
      next();
    } else {
      console.log("❌ App Proxy: Token validation failed");
      return res.status(401).json({
        error: "Authentication failed",
        message: "Token validation failed",
        proxy: "Azure App Proxy Simulator",
      });
    }
  } catch (error) {
    console.log("❌ App Proxy: Auth service error:", error.message);
    return res.status(401).json({
      error: "Authentication error",
      message: "Unable to validate token",
      proxy: "Azure App Proxy Simulator",
      details: error.message,
    });
  }
};

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "App Proxy (Azure App Proxy Simulator)",
    timestamp: new Date().toISOString(),
    internal_api: INTERNAL_API_URL,
    auth_service: AUTH_SERVICE_URL,
  });
});

// Proxy configuration for API requests
const apiProxy = createProxyMiddleware({
  target: INTERNAL_API_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api": "/api",
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(
      `🔄 App Proxy: Forwarding ${req.method} ${req.path} to internal API`
    );

    // Forward the validated token to internal API
    if (req.validatedToken) {
      proxyReq.setHeader("Authorization", `Bearer ${req.validatedToken}`);
    }

    // Add proxy headers (simulates what Azure App Proxy does)
    proxyReq.setHeader("X-Forwarded-Proto", "https");
    proxyReq.setHeader("X-Forwarded-Host", req.get("host"));
    proxyReq.setHeader("X-Forwarded-For", req.ip);
    proxyReq.setHeader("X-Azure-AppProxy", "true");
    proxyReq.setHeader("X-Proxy-User", req.user?.email || "unknown");
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(
      `✅ App Proxy: Response ${proxyRes.statusCode} from internal API`
    );

    // Add proxy response headers
    proxyRes.headers["X-Proxy-Service"] = "Azure App Proxy Simulator";
    proxyRes.headers["X-Proxy-Timestamp"] = new Date().toISOString();
  },
  onError: (err, req, res) => {
    console.error("❌ App Proxy: Proxy error:", err.message);
    res.status(502).json({
      error: "Bad Gateway",
      message: "Unable to reach internal API",
      proxy: "Azure App Proxy Simulator",
      details: err.message,
    });
  },
});

// Apply authentication middleware and proxy to all API routes
app.use("/api/*", authenticateRequest, apiProxy);

// Direct health check proxy (no auth required)
app.get("/internal-health", async (req, res) => {
  try {
    const response = await axios.get(`${INTERNAL_API_URL}/health`);
    res.json({
      proxy_status: "healthy",
      internal_api: response.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(502).json({
      proxy_status: "error",
      error: "Unable to reach internal API",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Proxy info endpoint
app.get("/proxy-info", (req, res) => {
  res.json({
    service: "Azure App Proxy Simulator",
    version: "1.0.0",
    description: "Simulates Azure Application Proxy functionality",
    features: [
      "Authentication validation via simulated Azure AD",
      "Request forwarding to internal API",
      "Security headers injection",
      "User context forwarding",
      "Error handling and logging",
    ],
    endpoints: {
      health: "/health",
      proxy_info: "/proxy-info",
      internal_health: "/internal-health",
      api: "/api/* (requires authentication)",
    },
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("❌ App Proxy Error:", err);
  res.status(500).json({
    error: "Proxy server error",
    message: "An error occurred in the application proxy",
    proxy: "Azure App Proxy Simulator",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🌐 App Proxy (Azure App Proxy Simulator) running on port ${PORT}`
  );
  console.log(`🔒 All API requests require authentication`);
  console.log(`🔄 Proxying authenticated requests to: ${INTERNAL_API_URL}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health - Proxy health check`);
  console.log(`   GET  /proxy-info - Proxy information`);
  console.log(`   GET  /internal-health - Check internal API health`);
  console.log(`   ALL  /api/* - Proxied API endpoints (requires auth)`);
});
