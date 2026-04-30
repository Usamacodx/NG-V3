import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

dotenv.config();

async function migrateOrderImages() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    console.log('📦 Fetching all orders...');
    const orders = await Order.find();
    console.log(`✅ Found ${orders.length} orders`);

    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const progress = `${i + 1}/${orders.length}`;

      try {
        let hasChanges = false;

        // Update each item's images
        for (let j = 0; j < order.items.length; j++) {
          const item = order.items[j];

          // Get product from database to get Cloudinary URLs
          if (item.productId) {
            const product = await Product.findById(item.productId)
              .select('frontImage backImage image')
              .lean();

            if (product) {
              // Update to Cloudinary URLs
              if (product.frontImage && product.frontImage !== item.frontImage) {
                item.frontImage = product.frontImage;
                hasChanges = true;
              }
              if (product.backImage && product.backImage !== item.backImage) {
                item.backImage = product.backImage;
                hasChanges = true;
              }
            }
          }
        }

        // Save if changes were made
        if (hasChanges) {
          await order.save();
          updatedCount++;
          console.log(`✅ Order ${progress} updated with Cloudinary URLs`);
        } else {
          console.log(`⏭️  Order ${progress} already using Cloudinary URLs`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating order ${progress}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${updatedCount} orders`);
    console.log(`❌ Errors: ${errorCount} orders`);
    console.log(`⏭️  Already migrated: ${orders.length - updatedCount - errorCount} orders`);

    return { updatedCount, errorCount };
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

migrateOrderImages().then(stats => {
  if (stats.errorCount === 0) {
    console.log('\n🎉 Order image migration completed successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Migration completed with errors');
    process.exit(1);
  }
});
