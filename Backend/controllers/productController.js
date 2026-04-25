import Product from '../models/productModel.js';

export const addProduct = async (req, res) => {
  try {
    console.log('📨 [addProduct] Received payload:', JSON.stringify(req.body, null, 2));
    console.log('📨 [addProduct] colorVariants in request:', req.body.colorVariants);
    console.log('📨 [addProduct] colorVariants type:', typeof req.body.colorVariants);
    console.log('📨 [addProduct] colorVariants is array?', Array.isArray(req.body.colorVariants));
    
    // Explicitly construct product object with all fields
    const productData = {
      name: req.body.name,
      price: req.body.price,
      quantity: req.body.quantity,
      category: req.body.category,
      subcategory: req.body.subcategory,
      fabric: req.body.fabric,
      colors: req.body.colors || [],
      description: req.body.description,
      frontImage: req.body.frontImage,
      backImage: req.body.backImage,
      colorVariants: req.body.colorVariants || [], // ✅ Explicitly include colorVariants
    };
    
    console.log('📨 [addProduct] Final productData:', JSON.stringify(productData, null, 2));
    
    const product = new Product(productData);
    console.log('📨 [addProduct] Product instance created, colorVariants:', product.colorVariants);
    
    const saved = await product.save();
    console.log('✅ [addProduct] Product saved successfully');
    console.log('✅ [addProduct] Saved colorVariants:', saved.colorVariants);
    
    return res.status(201).json(saved);
  } catch (err) {
    console.error('❌ [addProduct] Error:', err);
    console.error('❌ [addProduct] Error message:', err.message);
    console.error('❌ [addProduct] Error stack:', err.stack);
    return res.status(500).json({ message: 'Failed to save product', error: err.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    console.error('getProducts error:', err);
    return res.status(500).json({ message: 'Failed to fetch products' });
  }
};