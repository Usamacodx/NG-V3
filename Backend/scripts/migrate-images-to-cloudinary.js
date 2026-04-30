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

// Configuration
const RATE_LIMIT_DELAY = 100; // ms delay between uploads to avoid rate limiting
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms
const LOGS_DIR = path.join(__dirname, '../logs');
const MIGRATION_REPORT = path.join(LOGS_DIR, `migration-report-${Date.now()}.json`);

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Logger
class MigrationLogger {
  constructor() {
    this.logs = [];
    this.errors = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message };
    this.logs.push(logEntry);
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    const errorEntry = { timestamp, message, error: error?.message || error };
    this.errors.push(errorEntry);
    console.error(`❌ ${message}`, error?.message || '');
  }

  saveReport(stats) {
    const report = {
      migration_start: new Date(this.startTime).toISOString(),
      migration_end: new Date().toISOString(),
      duration_ms: Date.now() - this.startTime,
      statistics: stats,
      errors: this.errors,
      summary: this.logs,
    };

    fs.writeFileSync(MIGRATION_REPORT, JSON.stringify(report, null, 2));
    console.log(`\n📋 Report saved to: ${MIGRATION_REPORT}`);
  }
}

// Initialize logger
const logger = new MigrationLogger();

// Helper function to upload image with retries
async function uploadImageWithRetries(imageUrl, publicId, retries = 0) {
  try {
    // Skip invalid URLs
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return null;
    }

    // Check if already uploaded to Cloudinary (avoid re-uploading)
    try {
      const existingResource = await cloudinary.v2.api.resource(publicId);
      logger.log(`⏭️  Image already exists in Cloudinary: ${publicId}`);
      return { public_id: publicId, secure_url: existingResource.secure_url };
    } catch (e) {
      // Resource doesn't exist, continue with upload
    }

    // Upload from URL
    const response = await cloudinary.v2.uploader.upload(imageUrl, {
      public_id: publicId,
      overwrite: false,
      resource_type: 'auto',
      timeout: 60000, // 60 seconds timeout
    });

    logger.log(`✅ Uploaded: ${publicId}`);
    return response;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      logger.log(
        `⚠️  Upload failed for ${publicId}, retrying (${retries + 1}/${MAX_RETRIES})...`,
        'warn'
      );
      await sleep(RETRY_DELAY);
      return uploadImageWithRetries(imageUrl, publicId, retries + 1);
    }
    throw error;
  }
}

// Helper function to sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Download image as buffer (for local images)
async function downloadImage(imageUrl) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    logger.error(`Failed to download image: ${imageUrl}`, error);
    return null;
  }
}

// Main migration function
async function migrateProducts() {
  try {
    logger.log('🚀 Starting product image migration to Cloudinary...');
    logger.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);

    // Connect to MongoDB
    logger.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    logger.log('✅ MongoDB connected');

    // Fetch all products
    logger.log('📦 Fetching all products from MongoDB...');
    const products = await Product.find();
    logger.log(`✅ Found ${products.length} products to migrate`);

    const stats = {
      total_products: products.length,
      successfully_migrated: 0,
      failed_products: [],
      skipped_products: [],
      images_uploaded: 0,
      total_images: 0,
      errors: [],
    };

    // Migrate each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const progress = `${i + 1}/${products.length}`;

      try {
        logger.log(`\n🔄 Processing product ${progress}: ${product.name}`);

        // Check if already migrated
        if (product.cloudinary?.migrated_at) {
          logger.log(`⏭️  Product ${progress} already migrated, skipping...`, 'warn');
          stats.skipped_products.push(product._id);
          continue;
        }

        // Create backup of original URLs
        const backup = {
          image: product.image,
          frontImage: product.frontImage,
          backImage: product.backImage,
          colorVariants: product.colorVariants?.map(v => ({
            colorName: v.colorName,
            frontImage: v.frontImage,
            backImage: v.backImage,
          })),
          backed_up_at: new Date(),
        };

        const cloudinaryData = {
          migrated_at: new Date(),
        };

        // Upload main image if exists
        if (product.image) {
          try {
            stats.total_images++;
            const imageId = `product-${product._id}-main`;
            const uploadedImage = await uploadImageWithRetries(product.image, imageId);
            if (uploadedImage) {
              product.image = uploadedImage.secure_url;
              cloudinaryData.image_id = uploadedImage.public_id;
              stats.images_uploaded++;
              logger.log(`  ✅ Main image uploaded`);
            }
            await sleep(RATE_LIMIT_DELAY);
          } catch (error) {
            logger.error(`  ❌ Failed to upload main image`, error);
            stats.errors.push({
              product_id: product._id,
              field: 'main_image',
              error: error.message,
            });
          }
        }

        // Upload front image
        if (product.frontImage) {
          try {
            stats.total_images++;
            const frontImageId = `product-${product._id}-front`;
            const uploadedFront = await uploadImageWithRetries(product.frontImage, frontImageId);
            if (uploadedFront) {
              product.frontImage = uploadedFront.secure_url;
              cloudinaryData.frontImage_id = uploadedFront.public_id;
              stats.images_uploaded++;
              logger.log(`  ✅ Front image uploaded`);
            }
            await sleep(RATE_LIMIT_DELAY);
          } catch (error) {
            logger.error(`  ❌ Failed to upload front image`, error);
            stats.errors.push({
              product_id: product._id,
              field: 'frontImage',
              error: error.message,
            });
          }
        }

        // Upload back image
        if (product.backImage) {
          try {
            stats.total_images++;
            const backImageId = `product-${product._id}-back`;
            const uploadedBack = await uploadImageWithRetries(product.backImage, backImageId);
            if (uploadedBack) {
              product.backImage = uploadedBack.secure_url;
              cloudinaryData.backImage_id = uploadedBack.public_id;
              stats.images_uploaded++;
              logger.log(`  ✅ Back image uploaded`);
            }
            await sleep(RATE_LIMIT_DELAY);
          } catch (error) {
            logger.error(`  ❌ Failed to upload back image`, error);
            stats.errors.push({
              product_id: product._id,
              field: 'backImage',
              error: error.message,
            });
          }
        }

        // Upload color variant images
        if (product.colorVariants && product.colorVariants.length > 0) {
          for (let j = 0; j < product.colorVariants.length; j++) {
            const variant = product.colorVariants[j];
            const variantCloudinary = { colorName: variant.colorName };

            try {
              // Upload variant front image
              if (variant.frontImage) {
                stats.total_images++;
                const variantFrontId = `product-${product._id}-color-${j}-front`;
                const uploadedVariantFront = await uploadImageWithRetries(
                  variant.frontImage,
                  variantFrontId
                );
                if (uploadedVariantFront) {
                  variant.frontImage = uploadedVariantFront.secure_url;
                  variantCloudinary.frontImage_id = uploadedVariantFront.public_id;
                  stats.images_uploaded++;
                  logger.log(`  ✅ Color variant ${j} front image uploaded`);
                }
                await sleep(RATE_LIMIT_DELAY);
              }

              // Upload variant back image
              if (variant.backImage) {
                stats.total_images++;
                const variantBackId = `product-${product._id}-color-${j}-back`;
                const uploadedVariantBack = await uploadImageWithRetries(
                  variant.backImage,
                  variantBackId
                );
                if (uploadedVariantBack) {
                  variant.backImage = uploadedVariantBack.secure_url;
                  variantCloudinary.backImage_id = uploadedVariantBack.public_id;
                  stats.images_uploaded++;
                  logger.log(`  ✅ Color variant ${j} back image uploaded`);
                }
                await sleep(RATE_LIMIT_DELAY);
              }

              // Assign cloudinary data to variant
              if (!variant.cloudinary) {
                variant.cloudinary = {};
              }
              Object.assign(variant.cloudinary, variantCloudinary);
            } catch (error) {
              logger.error(
                `  ❌ Failed to upload color variant ${j} for product ${product._id}`,
                error
              );
              stats.errors.push({
                product_id: product._id,
                field: `colorVariants[${j}]`,
                error: error.message,
              });
            }
          }
        }

        // Update product with cloudinary data and backup
        product.cloudinary = cloudinaryData;
        product.backup_urls = backup;

        // Save updated product
        await product.save();
        logger.log(`✅ Product ${progress} saved successfully`);
        stats.successfully_migrated++;
      } catch (error) {
        logger.error(`❌ Failed to process product ${progress}`, error);
        stats.failed_products.push({
          product_id: product._id,
          product_name: product.name,
          error: error.message,
        });
      }
    }

    // Print summary
    logger.log('\n' + '='.repeat(60));
    logger.log('📊 MIGRATION SUMMARY', 'info');
    logger.log('='.repeat(60));
    logger.log(`✅ Successfully migrated: ${stats.successfully_migrated}/${stats.total_products}`);
    logger.log(`⏭️  Skipped (already migrated): ${stats.skipped_products.length}`);
    logger.log(`❌ Failed: ${stats.failed_products.length}`);
    logger.log(`📸 Images uploaded: ${stats.images_uploaded}/${stats.total_images}`);

    if (stats.errors.length > 0) {
      logger.log(`\n⚠️  Errors encountered: ${stats.errors.length}`, 'warn');
    }

    // Save detailed report
    logger.saveReport(stats);

    return stats;
  } catch (error) {
    logger.error('❌ Migration process failed', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.log('🔌 MongoDB connection closed');
  }
}

// Run migration
migrateProducts().then(stats => {
  if (stats.successfully_migrated === stats.total_products) {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Migration completed with issues');
    process.exit(stats.failed_products.length > 0 ? 1 : 0);
  }
});
