#!/usr/bin/env node

/**
 * Database Verification Script
 * Usage: node verify-db.js
 * 
 * Checks:
 * - Total products count
 * - Which products have color variants
 * - Size of images stored
 */

import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

async function verifyDatabase() {
  try {
    console.log('\n🔍 CONNECTING TO MONGODB...\n');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/customApparel');
    console.log('✅ Connected to MongoDB\n');

    const products = await Product.find().select('name colors colorVariants');
    console.log(`📊 PRODUCTS IN DATABASE: ${products.length}\n`);

    if (products.length === 0) {
      console.log('⚠️ No products found! Add a product with colors first.\n');
      process.exit(0);
    }

    console.log('═'.repeat(80));
    let productsWithVariants = 0;
    let totalVariants = 0;

    products.forEach((p, i) => {
      console.log(`\n[${i + 1}] ${p.name}`);
      console.log(`    Colors array: [${p.colors?.join(', ') || 'EMPTY'}]`);
      console.log(`    ColorVariants count: ${p.colorVariants?.length || 0}`);
      
      if (p.colorVariants && p.colorVariants.length > 0) {
        productsWithVariants++;
        totalVariants += p.colorVariants.length;
        
        console.log('    ────────────────────────────────');
        p.colorVariants.forEach((v, j) => {
          const frontSize = v.frontImage ? (v.frontImage.length / 1024 / 1024).toFixed(2) : '❌';
          const backSize = v.backImage ? (v.backImage.length / 1024 / 1024).toFixed(2) : '❌';
          console.log(`    [Variant ${j + 1}] ${v.colorName} (${v.colorCode})`);
          console.log(`              Front: ${frontSize === '❌' ? '❌ MISSING' : '✅ ' + frontSize + ' MB'}`);
          console.log(`              Back:  ${backSize === '❌' ? '❌ MISSING' : '✅ ' + backSize + ' MB'}`);
        });
        console.log('    ────────────────────────────────');
      } else {
        console.log('    ⚠️ NO COLOR VARIANTS STORED!');
      }
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n📈 SUMMARY:');
    console.log(`   Products with variants: ${productsWithVariants}/${products.length}`);
    console.log(`   Total color variants: ${totalVariants}`);
    
    if (productsWithVariants === 0) {
      console.log('\n⚠️ ISSUE: No products have color variants!');
      console.log('   → Make sure to restart Backend/server.js');
      console.log('   → Then add a new product with colors');
    } else {
      console.log('\n✅ Database looks good! Color variants are being saved.');
    }

    console.log('\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

verifyDatabase();
