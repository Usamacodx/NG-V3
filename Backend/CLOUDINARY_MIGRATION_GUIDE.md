# 🚀 Cloudinary Image Migration Guide

This guide will help you migrate all product images from MongoDB to Cloudinary while keeping your MongoDB data intact.

## 📋 Prerequisites

1. **Cloudinary Account**: Sign up at [cloudinary.com](https://cloudinary.com)
2. **API Credentials**: Get your Cloud Name, API Key, and API Secret from your Cloudinary dashboard
3. **MongoDB**: Ensure your MongoDB connection is working
4. **Node.js**: Version 14+ installed

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
cd Backend
npm install
```

This will install:
- `cloudinary` - For Cloudinary API integration
- `axios` - For HTTP requests
- All other dependencies

### 2. Configure Environment Variables

Create or update your `.env` file in the Backend directory with:

```env
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database_name
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret
```

**How to get Cloudinary credentials:**
1. Log in to [Cloudinary Console](https://cloudinary.com/console)
2. Go to Settings → API Keys
3. Copy your Cloud Name, API Key, and API Secret
4. Add them to your `.env` file

### 3. Verify MongoDB Connection

Before migration, ensure MongoDB is connected:

```bash
npm start
# Check if you see "✅ MongoDB connected" in the logs
```

## 🚀 Migration Process

### Option A: Full Migration (Recommended for first time)

Run all steps in sequence:

```bash
npm run migrate:all
```

This will:
1. ✅ Backup all products to `Backend/backups/`
2. ✅ Migrate all images to Cloudinary
3. ✅ Verify the migration

### Option B: Step-by-Step Migration

#### Step 1: Create Database Backup

```bash
npm run migrate:backup
```

**Output**: Backup files saved in `Backend/backups/`
- `products-backup-YYYY-MM-DD-HH-mm-ss.json` - Full backup
- `backup-summary-YYYY-MM-DD-HH-mm-ss.json` - Summary statistics

**Why this is important:**
- Protects against data loss
- Allows rollback if needed
- Creates restore point before changes

#### Step 2: Migrate Images to Cloudinary

```bash
npm run migrate:cloudinary
```

**This script will:**
- Fetch all 63 products from MongoDB
- Upload each image variant to Cloudinary
- Update MongoDB with new Cloudinary URLs
- Keep original URLs as backup in `backup_urls` field
- Show progress: `1/63`, `2/63`, etc.
- Create detailed migration report in `Backend/logs/`

**Expected output:**
```
🚀 Starting product image migration to Cloudinary...
📦 Fetching all products from MongoDB...
✅ Found 63 products to migrate

🔄 Processing product 1/63: T-Shirt Blue
  ✅ Main image uploaded
  ✅ Front image uploaded
  ✅ Back image uploaded
  ✅ Color variant 1 front image uploaded
  ✅ Color variant 1 back image uploaded
  ...

📊 MIGRATION SUMMARY
✅ Successfully migrated: 63/63
📸 Images uploaded: 630/630
```

**Features:**
- **Rate Limiting**: 100ms delay between uploads to avoid API limits
- **Retry Logic**: Automatically retries failed uploads up to 3 times
- **Idempotent**: Can run multiple times safely - won't re-upload existing images
- **Progress Tracking**: Shows X/63 for each product
- **Error Handling**: Detailed error logs for troubleshooting

#### Step 3: Verify Migration

```bash
npm run migrate:verify
```

**This script will:**
- Check all migrated URLs are accessible
- Verify Cloudinary integration
- Check backup data integrity
- Generate verification report in `Backend/logs/`

**Expected output:**
```
📊 VERIFICATION SUMMARY
📦 Total products: 63
✅ Migrated to Cloudinary: 63
📸 Accessible URLs: 630/630
☁️ Cloudinary Integration:
  ✅ Unique Cloudinary IDs: 630
  ✅ Products with backup: 63
📊 Migration Progress: 100% complete
```

## 📊 Data Structure After Migration

### Product Document in MongoDB

```javascript
{
  _id: ObjectId,
  name: "T-Shirt Blue",
  price: 29.99,
  image: "https://res.cloudinary.com/your-cloud/image/upload/...",
  frontImage: "https://res.cloudinary.com/your-cloud/image/upload/...",
  backImage: "https://res.cloudinary.com/your-cloud/image/upload/...",
  
  // ✅ Cloudinary tracking
  cloudinary: {
    image_id: "product-123-main",
    frontImage_id: "product-123-front",
    backImage_id: "product-123-back",
    migrated_at: "2024-01-15T10:30:00Z"
  },
  
  // ✅ Backup of original URLs (for other purposes)
  backup_urls: {
    image: "original-url-from-mongodb",
    frontImage: "original-url-from-mongodb",
    backImage: "original-url-from-mongodb",
    backed_up_at: "2024-01-15T10:30:00Z"
  },
  
  // Color variants with individual Cloudinary tracking
  colorVariants: [
    {
      colorName: "Blue",
      frontImage: "https://res.cloudinary.com/...",
      backImage: "https://res.cloudinary.com/...",
      cloudinary: {
        frontImage_id: "product-123-color-0-front",
        backImage_id: "product-123-color-0-back",
        migrated_at: "2024-01-15T10:30:00Z"
      }
    }
  ]
}
```

## 🆘 Troubleshooting

### Issue: "CLOUDINARY credentials not found"

**Solution:**
1. Check your `.env` file exists in Backend directory
2. Verify you have all three credentials:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Restart the migration script

### Issue: "Image upload failed - Rate limited"

**Solution:**
- The script automatically handles rate limiting with delays
- If it still fails, increase `RATE_LIMIT_DELAY` in the migration script
- Change line: `const RATE_LIMIT_DELAY = 200; // Increase from 100`

### Issue: "MongoDB connection failed"

**Solution:**
1. Check your `MONGO_URI` in `.env`
2. Ensure MongoDB server is running
3. Check network connectivity to MongoDB Atlas
4. Verify username and password are correct

### Issue: Some images failed to upload

**Solution:**
1. Check the migration report in `Backend/logs/`
2. Run verification to see which URLs failed: `npm run migrate:verify`
3. Check if image URLs are valid and accessible
4. Retry migration - it will skip already-uploaded images

## 🔄 Rollback (If Needed)

If you need to restore original URLs:

```bash
npm run migrate:rollback
```

**This will:**
- Restore original URLs from `backup_urls`
- Keep all other data intact
- Save rollback report in `Backend/logs/`

**⚠️ Note:** Images will still be on Cloudinary (can be deleted manually if needed)

## 📁 File Structure

```
Backend/
├── models/
│   └── Product.js (Updated with cloudinary & backup_urls fields)
├── config/
│   └── cloudinary.js (Cloudinary configuration)
├── scripts/
│   ├── backup-db.js (Create database backup)
│   ├── migrate-images-to-cloudinary.js (Main migration)
│   ├── verify-migration.js (Verify success)
│   └── rollback-migration.js (Restore original URLs)
├── backups/
│   ├── products-backup-YYYY-MM-DD.json
│   └── backup-summary-YYYY-MM-DD.json
├── logs/
│   ├── migration-report-1705314600000.json
│   ├── verification-report-1705314900000.json
│   └── rollback-report-1705315200000.json
├── .env (Your configuration)
├── .env.example (Template)
└── package.json (Updated scripts)
```

## 📊 Migration Statistics

For 63 products with 10 color variants each:

| Item | Count |
|------|-------|
| Total Products | 63 |
| Main Images | 63 |
| Front Images | 63 |
| Back Images | 63 |
| Color Variants | 630 |
| Variant Front Images | 630 |
| Variant Back Images | 630 |
| **Total Images** | **2,142** |

**Estimated Time:** 
- With 100ms rate limit: ~3.5 minutes
- With retries: ~5-10 minutes

## ✅ Verification Checklist

After migration, verify:

- [ ] All 63 products migrated
- [ ] All 2,142 images uploaded to Cloudinary
- [ ] All URLs are accessible (run verification script)
- [ ] Backups saved in `Backend/backups/`
- [ ] Migration logs generated in `Backend/logs/`
- [ ] Original URLs preserved in `backup_urls`
- [ ] Product functionality works with new Cloudinary URLs

## 🎯 Next Steps

1. **Test in Frontend**: Load products and check images display correctly
2. **Monitor Cloudinary**: Check dashboard for uploaded images
3. **Delete Old Storage**: If using another CDN, you can now safely remove images
4. **Update Documentation**: Document the new URL structure for your team

## 📞 Support

If you encounter issues:

1. Check the detailed logs in `Backend/logs/`
2. Review the troubleshooting section above
3. Verify environment variables are correct
4. Ensure MongoDB and Cloudinary are accessible

## 🔐 Security Notes

- **API Keys**: Never commit `.env` to version control
- **Backups**: Store backups securely
- **Logs**: Logs contain sensitive information - keep them private
- **Rate Limiting**: Be respectful of API rate limits

---

**Last Updated:** 2024
**Compatible with:** Node.js 14+, MongoDB 4.0+, Cloudinary API v1
