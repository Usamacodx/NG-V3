import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.join(__dirname, '../logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const ROLLBACK_REPORT = path.join(LOGS_DIR, `rollback-report-${Date.now()}.json`);

async function rollbackMigration() {
  try {
    console.log('🔄 Starting rollback process...\n');
    console.log('⚠️  WARNING: This will restore original URLs from backups\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Fetch all products with backups
    const products = await Product.find({ 'backup_urls.backed_up_at': { $exists: true } });
    console.log(`✅ Found ${products.length} products with backups\n`);

    const rollbackStats = {
      rollback_date: new Date().toISOString(),
      total_products_with_backup: products.length,
      successfully_rolled_back: 0,
      failed_rollbacks: [],
    };

    // Rollback each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const progress = `${i + 1}/${products.length}`;

      try {
        console.log(`🔄 Rolling back product ${progress}: ${product.name}`);

        const backup = product.backup_urls;

        if (backup) {
          // Restore original URLs
          if (backup.image) product.image = backup.image;
          if (backup.frontImage) product.frontImage = backup.frontImage;
          if (backup.backImage) product.backImage = backup.backImage;

          // Restore color variant URLs
          if (backup.colorVariants && product.colorVariants) {
            for (let j = 0; j < product.colorVariants.length; j++) {
              const backupVariant = backup.colorVariants[j];
              if (
                backupVariant &&
                product.colorVariants[j]
              ) {
                if (backupVariant.frontImage) {
                  product.colorVariants[j].frontImage = backupVariant.frontImage;
                }
                if (backupVariant.backImage) {
                  product.colorVariants[j].backImage = backupVariant.backImage;
                }
              }
            }
          }

          // Clear cloudinary data but keep backup for reference
          // If you want to delete backup too, uncomment the next line:
          // product.backup_urls = undefined;

          await product.save();
          console.log(`  ✅ Product ${progress} rolled back successfully`);
          rollbackStats.successfully_rolled_back++;
        }
      } catch (error) {
        console.error(`  ❌ Failed to rollback product ${progress}`, error.message);
        rollbackStats.failed_rollbacks.push({
          product_id: product._id,
          product_name: product.name,
          error: error.message,
        });
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 ROLLBACK SUMMARY', 'info');
    console.log('='.repeat(60));
    console.log(`✅ Successfully rolled back: ${rollbackStats.successfully_rolled_back}`);
    console.log(`❌ Failed rollbacks: ${rollbackStats.failed_rollbacks.length}`);

    // Save rollback report
    fs.writeFileSync(ROLLBACK_REPORT, JSON.stringify(rollbackStats, null, 2));
    console.log(`\n📋 Rollback report saved to: ${ROLLBACK_REPORT}`);

    return rollbackStats;
  } catch (error) {
    console.error('❌ Rollback process failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Confirm rollback before proceeding
console.log('⚠️  ROLLBACK WILL RESTORE ORIGINAL URLS FROM BACKUPS');
console.log('⚠️  THIS ACTION MAY TAKE SOME TIME\n');

// You can add interactive confirmation here if needed
// For now, proceeding with rollback
rollbackMigration().then(stats => {
  if (stats.failed_rollbacks.length === 0) {
    console.log('\n✅ Rollback completed successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Rollback completed with issues');
    process.exit(1);
  }
});
