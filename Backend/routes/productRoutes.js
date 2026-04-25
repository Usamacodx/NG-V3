import express from "express";
import Product from "../models/Product.js";
const auth = require("../middleware/auth");
const router = express.Router();


// ✅ GET ALL PRODUCTS
router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// ✅ GET SINGLE PRODUCT (FOR EDIT)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    console.log("📤 GET /api/products/:id - Product retrieved:");
    console.log("   ID:", product?._id);
    console.log("   colorVariants:", product?.colorVariants);
    console.log("   colorVariants length:", product?.colorVariants?.length);
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
