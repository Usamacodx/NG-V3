import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.js";
import ordersRoutes from "./routes/orders.js";
import productRoutes from "./routes/productRoutes.js";
import stickersRoutes from "./routes/stickersRoutes.js";
import Product from "./models/Product.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Global error handler middleware
app.use((err, req, res, next) => {
  res.status(500).json({ message: "Server error", error: err.message });
});

/* =========================
   MongoDB Connection
========================= */
mongoose
  .connect(process.env.MONGO_URI, {
    maxPoolSize: 10, // ✅ Connection pool size
    minPoolSize: 2,  // ✅ Minimum connections to keep alive
    socketTimeoutMS: 45000, // ✅ Socket timeout
    serverSelectionTimeoutMS: 5000, // ✅ Server selection timeout
    retryWrites: true, // ✅ Retry failed writes
    w: 'majority', // ✅ Write concern
  })
  .then(() => console.log("✅ MongoDB connected with optimized pooling"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

/* =========================
   Schemas
========================= */

// Admin Schema
const adminSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const Admin = mongoose.model("Admin", adminSchema);

// Product model is imported from ./models/Product.js at the top

/* =========================
   ADMIN AUTH
========================= */

// Admin Signup (run once)
app.post("/api/admin/signup", async (req, res) => {
  const { email, password } = req.body;

  const exists = await Admin.findOne({ email });
  if (exists) return res.status(400).json({ message: "Admin exists" });

  const hashed = await bcrypt.hash(password, 10);
  await Admin.create({ email, password: hashed });

  res.json({ message: "Admin created" });
});

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, admin.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: admin._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
});

/* =========================
   PRODUCT ROUTES
========================= */

// Test endpoint to verify auth routes are loaded
app.get("/api/auth/test", (req, res) => {
  res.json({ message: "Auth routes are loaded successfully" });
});

// Use auth routes
app.use("/api/auth", authRoutes);

// Orders routes (create/fetch orders)
app.use('/api/orders', ordersRoutes);

// Product routes (optimized with pagination, lazy loading, etc.)
app.use('/api/products', productRoutes);

// ✅ Sticker routes
app.use('/api/stickers', stickersRoutes);

/* =========================
   TEST ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("Backend running successfully");
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    mongoConnected: mongoose.connection.readyState === 1,
    mongoState: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState],
    timestamp: new Date().toISOString()
  });
});

// 🔍 DIAGNOSTIC: Check database collection sizes
app.get("/api/db-stats", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    let stats = {};
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      const size = await db.collection(coll.name).stats();
      stats[coll.name] = {
        documentCount: count,
        sizeBytes: size.size || 0,
        sizeMB: ((size.size || 0) / (1024 * 1024)).toFixed(2),
      };
    }
    
    res.json({ 
      stats,
      totalMB: Object.values(stats).reduce((sum, s) => sum + parseFloat(s.sizeMB), 0).toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
