import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function backupDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    console.log('📦 Fetching all products...');
    const products = await Product.find().lean();
    console.log(`✅ Found ${products.length} products`);

    // Create backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `products-backup-${timestamp}.json`);

    // Write backup file
    fs.writeFileSync(backupFile, JSON.stringify(products, null, 2));
    console.log(`✅ Backup saved to: ${backupFile}`);

    // Also create a summary file
    const summaryFile = path.join(BACKUP_DIR, `backup-summary-${timestamp}.json`);
    const summary = {
      total_products: products.length,
      backup_date: new Date().toISOString(),
      backup_file: backupFile,
      images_per_product: {
        main_image: products.filter(p => p.image).length,
        front_image: products.filter(p => p.frontImage).length,
        back_image: products.filter(p => p.backImage).length,
        color_variants: products.reduce((sum, p) => sum + (p.colorVariants?.length || 0), 0),
      },
    };;

    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📋 Summary saved to: ${summaryFile}`);

    console.log('\n✅ Backup completed successfully!');
    console.log(`📦 Total products backed up: ${products.length}`);

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run backup
backupDatabase();
