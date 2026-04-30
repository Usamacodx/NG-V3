import mongoose from 'mongoose';
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const VERIFICATION_REPORT = path.join(
  __dirname,
  `../logs/verification-report-${Date.now()}.json`
);

// Helper to verify URL is accessible
async function verifyUrlAccessible(url, timeout = 5000) {
  try {
    const response = await axios.head(url, { timeout });
    return response.status === 200;
  } catch (error) {
    // Try GET if HEAD fails
    try {
      const response = await axios.get(url, { timeout, maxContentLength: 1000 });
      return response.status === 200;
    } catch (e) {
      return false;
    }
  }
}

async function verifyMigration() {
  try {
    console.log('🔍 Starting migration verification...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Fetch all products
    const products = await Product.find().lean();
    console.log(`✅ Found ${products.length} products\n`);

    const verification = {
      verification_date: new Date().toISOString(),
      total_products: products.length,
      cloudinary_products: 0,
      non_migrated_products: 0,
      accessible_urls: 0,
      inaccessible_urls: 0,
      products_with_issues: [],
      cloudinary_ids_found: new Set(),
      backup_verification: 0,
    };

    console.log('📊 Analyzing products...\n');

    // Check each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const progress = `${i + 1}/${products.length}`;

      // Check if migrated
      if (!product.cloudinary?.migrated_at) {
        verification.non_migrated_products++;
        continue;
      }

      verification.cloudinary_products++;

      // Check if backup exists
      if (product.backup_urls?.backed_up_at) {
        verification.backup_verification++;
      }

      // Verify main image URL
      if (product.image) {
        const isAccessible = await verifyUrlAccessible(product.image);
        if (isAccessible) {
          verification.accessible_urls++;
        } else {
          verification.inaccessible_urls++;
          verification.products_with_issues.push({
            product_id: product._id,
            product_name: product.name,
            field: 'main_image',
            url: product.image,
            issue: 'URL not accessible',
          });
        }
      }

      // Verify front image URL
      if (product.frontImage) {
        const isAccessible = await verifyUrlAccessible(product.frontImage);
        if (isAccessible) {
          verification.accessible_urls++;
        } else {
          verification.inaccessible_urls++;
          verification.products_with_issues.push({
            product_id: product._id,
            product_name: product.name,
            field: 'frontImage',
            url: product.frontImage,
            issue: 'URL not accessible',
          });
        }
      }

      // Verify back image URL
      if (product.backImage) {
        const isAccessible = await verifyUrlAccessible(product.backImage);
        if (isAccessible) {
          verification.accessible_urls++;
        } else {
          verification.inaccessible_urls++;
          verification.products_with_issues.push({
            product_id: product._id,
            product_name: product.name,
            field: 'backImage',
            url: product.backImage,
            issue: 'URL not accessible',
          });
        }
      }

      // Track Cloudinary IDs
      if (product.cloudinary?.image_id) {
        verification.cloudinary_ids_found.add(product.cloudinary.image_id);
      }
      if (product.cloudinary?.frontImage_id) {
        verification.cloudinary_ids_found.add(product.cloudinary.frontImage_id);
      }
      if (product.cloudinary?.backImage_id) {
        verification.cloudinary_ids_found.add(product.cloudinary.backImage_id);
      }

      // Verify color variants
      if (product.colorVariants?.length > 0) {
        for (const variant of product.colorVariants) {
          if (variant.frontImage) {
            const isAccessible = await verifyUrlAccessible(variant.frontImage);
            if (!isAccessible) {
              verification.inaccessible_urls++;
              verification.products_with_issues.push({
                product_id: product._id,
                product_name: product.name,
                field: `colorVariant[${variant.colorName}].frontImage`,
                url: variant.frontImage,
                issue: 'URL not accessible',
              });
            } else {
              verification.accessible_urls++;
            }
          }

          if (variant.backImage) {
            const isAccessible = await verifyUrlAccessible(variant.backImage);
            if (!isAccessible) {
              verification.inaccessible_urls++;
              verification.products_with_issues.push({
                product_id: product._id,
                product_name: product.name,
                field: `colorVariant[${variant.colorName}].backImage`,
                url: variant.backImage,
                issue: 'URL not accessible',
              });
            } else {
              verification.accessible_urls++;
            }
          }

          if (variant.cloudinary?.frontImage_id) {
            verification.cloudinary_ids_found.add(variant.cloudinary.frontImage_id);
          }
          if (variant.cloudinary?.backImage_id) {
            verification.cloudinary_ids_found.add(variant.cloudinary.backImage_id);
          }
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ Verified ${progress} products`);
      }
    }

    // Convert Set to array for JSON serialization
    verification.total_cloudinary_ids = verification.cloudinary_ids_found.size;
    delete verification.cloudinary_ids_found;

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ VERIFICATION SUMMARY', 'info');
    console.log('='.repeat(70));
    console.log(`📦 Total products: ${verification.total_products}`);
    console.log(`✅ Migrated to Cloudinary: ${verification.cloudinary_products}`);
    console.log(`⏭️  Not yet migrated: ${verification.non_migrated_products}`);
    console.log(`\n📸 URL Verification:`);
    console.log(`  ✅ Accessible URLs: ${verification.accessible_urls}`);
    console.log(`  ❌ Inaccessible URLs: ${verification.inaccessible_urls}`);
    console.log(`\n☁️ Cloudinary Integration:`);
    console.log(`  ✅ Unique Cloudinary IDs: ${verification.total_cloudinary_ids}`);
    console.log(`  ✅ Products with backup: ${verification.backup_verification}`);

    if (verification.products_with_issues.length > 0) {
      console.log(
        `\n⚠️  Issues found: ${verification.products_with_issues.length} products have inaccessible URLs`
      );
    } else {
      console.log('\n🎉 No issues found - All URLs are accessible!');
    }

    // Save verification report
    fs.writeFileSync(VERIFICATION_REPORT, JSON.stringify(verification, null, 2));
    console.log(`\n📋 Verification report saved to: ${VERIFICATION_REPORT}`);

    // Calculate migration percentage
    const migrationPercentage = (
      (verification.cloudinary_products / verification.total_products) *
      100
    ).toFixed(2);
    console.log(`\n📊 Migration Progress: ${migrationPercentage}% complete`);

    return verification;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run verification
verifyMigration();
