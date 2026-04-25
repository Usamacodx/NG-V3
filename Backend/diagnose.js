import mongoose from 'mongoose';
import Product from './models/Product.js';

async function diagnose() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/customApparel');
    console.log('✅ Connected to MongoDB\n');

    const products = await Product.find().select('name colors colorVariants');
    console.log(`📊 Total products in database: ${products.length}\n`);

    if (products.length === 0) {
      console.log('⚠️ No products found in database!');
      process.exit(0);
    }

    products.forEach((p, i) => {
      console.log(`[Product ${i + 1}] ${p.name}`);
      console.log(`  - colors array: ${JSON.stringify(p.colors)}`);
      console.log(`  - colorVariants count: ${p.colorVariants?.length || 0}`);
      
      if (p.colorVariants && p.colorVariants.length > 0) {
        console.log('  - First 2 variants:');
        p.colorVariants.slice(0, 2).forEach((v, j) => {
          const frontLength = v.frontImage ? v.frontImage.length : 0;
          const backLength = v.backImage ? v.backImage.length : 0;
          console.log(`    [${j + 1}] ${v.colorName} (${v.colorCode})`);
          console.log(`        - frontImage: ${frontLength > 0 ? 'YES (' + frontLength + ' bytes)' : 'MISSING'}`);
          console.log(`        - backImage: ${backLength > 0 ? 'YES (' + backLength + ' bytes)' : 'MISSING'}`);
        });
      } else {
        console.log('  ⚠️ NO COLOR VARIANTS FOUND!');
      }
      console.log('');
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

diagnose();
