const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

// Middleware
app.use(helmet());
app.use(morgan("combined"));
app.use(cors());
app.use(express.json());

// Middleware to validate JWT tokens (simulates internal auth check)
const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Access denied",
      message: "No authorization header provided",
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Access denied",
      message: "Invalid authorization format",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // In a real scenario, this would validate against Azure AD
    const decoded = jwt.decode(token);
    req.user = decoded;

    console.log(`🔒 Token validated for user: ${decoded?.email || "unknown"}`);
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Access denied",
      message: "Invalid token",
      timestamp: new Date().toISOString(),
    });
  }
};

// Health check endpoint (no auth required)
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Internal API",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Protected API endpoints (simulate your actual API)
app.get("/api/data", validateToken, (req, res) => {
  console.log(`📊 Data request from user: ${req.user?.email}`);

  res.json({
    message: "Success! Data retrieved from internal API",
    data: {
      users: [
        { id: 1, name: "John Doe", department: "Engineering" },
        { id: 2, name: "Jane Smith", department: "Marketing" },
        { id: 3, name: "Bob Wilson", department: "Sales" },
      ],
      metadata: {
        total: 3,
        retrieved_at: new Date().toISOString(),
        requested_by: req.user?.email || "unknown",
      },
    },
    request_id: uuidv4(),
  });
});

app.get("/api/profile", validateToken, (req, res) => {
  console.log(`👤 Profile request from user: ${req.user?.email}`);

  res.json({
    message: "User profile retrieved",
    profile: {
      email: req.user?.email || "demo@company.com",
      name: req.user?.name || "Demo User",
      roles: ["api-user", "internal-access"],
      last_login: new Date().toISOString(),
      permissions: ["read:data", "read:profile"],
    },
    request_id: uuidv4(),
  });
});

app.post("/api/submit", validateToken, (req, res) => {
  console.log(`📝 Submit request from user: ${req.user?.email}`);

  const { data } = req.body;

  res.json({
    message: "Data submitted successfully",
    submitted_data: data,
    processed_at: new Date().toISOString(),
    processed_by: req.user?.email || "unknown",
    confirmation_id: uuidv4(),
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("❌ Internal API Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: "Something went wrong in the internal API",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Internal API running on port ${PORT}`);
  console.log(
    `🔒 This API is only accessible from within the internal network`
  );
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/data - Get user data`);
  console.log(`   GET  /api/profile - Get user profile`);
  console.log(`   POST /api/submit - Submit data`);
});
