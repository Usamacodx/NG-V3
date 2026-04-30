import express from "express";
import Product from "../models/Product.js";
import auth from "../middleware/auth.js";
const router = express.Router();

// ✅ GET PAGINATED PRODUCTS (OPTIMIZED FOR LISTING)
// Usage: /api/products?page=1&limit=12
router.get("/list", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Use .lean() for faster queries and .select() to fetch only needed fields
    const products = await Product.find()
      .select("_id name price category subcategory frontImage mainImage inStock")
      .lean()
      .skip(skip)
      .limit(limit);

    // Get total count for pagination info
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      products,
      currentPage: page,
      totalPages,
      totalProducts,
      hasMore: page < totalPages,
    });
  } catch (error) {
    console.error("❌ Error fetching paginated products:", error.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// ✅ GET ALL PRODUCTS (LEGACY - FOR BACKWARD COMPATIBILITY)
router.get("/", async (req, res) => {
  try {
    // Check if pagination params are present
    if (req.query.page || req.query.limit) {
      return res.redirect(
        `/api/products/list?page=${req.query.page || 1}&limit=${req.query.limit || 12}`
      );
    }

    // Default: return with pagination
    const page = 1;
    const limit = 12;
    const products = await Product.find()
      .select("_id name price category subcategory frontImage mainImage inStock")
      .lean()
      .limit(limit);

    res.json(products);
  } catch (error) {
    console.error("❌ Error fetching products:", error.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// ✅ GET PRODUCT VARIANTS ONLY (LAZY LOAD) - MUST BE BEFORE /:id
// Usage: /api/products/:id/variants
router.get("/:id/variants", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select(
      "colorVariants"
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({
      _id: product._id,
      colorVariants: product.colorVariants || [],
    });
  } catch (error) {
    console.error("❌ Error fetching variants:", error.message);
    res.status(404).json({ message: "Failed to fetch variants" });
  }
});

// ✅ GET SINGLE PRODUCT WITH FULL DETAILS & VARIANTS - OPTIMIZED
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select('_id name price category subcategory fabric colors image frontImage backImage colorVariants rating description inStock createdAt') // ✅ Only needed fields (exclude backup_urls & cloudinary)
      .lean(); // ✅ Return plain JS object (much faster)
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("❌ Error fetching product:", error.message);
    res.status(404).json({ message: "Product not found" });
  }
});

// ADD product
router.post("/", async (req, res) => {
  try {
    console.log("📥 POST /api/products - Request body received:");
    console.log("   colorVariants:", req.body.colorVariants);
    console.log("   colorVariants type:", typeof req.body.colorVariants);
    console.log("   colorVariants length:", req.body.colorVariants?.length);
    
    const product = new Product(req.body);
    const savedProduct = await product.save();
    
    console.log("✅ Product saved to MongoDB:");
    console.log("   ID:", savedProduct._id);
    console.log("   colorVariants saved:", savedProduct.colorVariants);
    console.log("   colorVariants count:", savedProduct.colorVariants?.length);
    
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("❌ Error saving product:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ✅ DELETE PRODUCT
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// ✅ UPDATE PRODUCT
router.put("/:id", async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

export default router;
