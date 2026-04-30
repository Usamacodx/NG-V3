# 🆘 Troubleshooting Guide - Cloudinary Migration

## Common Issues & Solutions

---

## ❌ Installation Issues

### Issue: `npm install` fails with dependency errors

**Error:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**
```bash
# Option 1: Force install (most common)
npm install --legacy-peer-deps

# Option 2: Clear npm cache
npm cache clean --force
npm install

# Option 3: Use specific Node version
nvm use 16
npm install
```

---

## ❌ Cloudinary Configuration Issues

### Issue: "CLOUDINARY credentials not found"

**Error:**
```
Error: Cloudinary credentials not configured
CLOUDINARY_CLOUD_NAME is missing
```

**Solutions:**

1. **Check .env file exists:**
   ```bash
   # Verify file exists
   ls Backend/.env
   
   # If not, create it from template
   cp Backend/.env.example Backend/.env
   ```

2. **Verify credentials are set:**
   ```bash
   # Check content
   cat Backend/.env
   
   # Should contain:
   # CLOUDINARY_CLOUD_NAME=xxx
   # CLOUDINARY_API_KEY=xxx
   # CLOUDINARY_API_SECRET=xxx
   ```

3. **Get credentials from Cloudinary:**
   - Go to: https://cloudinary.com/console/settings/api-keys
   - Copy your credentials
   - Paste into `.env`

4. **Restart migration script:**
   ```bash
   npm run migrate:cloudinary
   ```

### Issue: "Invalid Cloudinary credentials"

**Error:**
```
Error: Invalid credentials - Check your cloud name, key, and secret
```

**Solutions:**

1. **Verify credentials format:**
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name  # No spaces, no quotes
   CLOUDINARY_API_KEY=123456789          # Just the key, no quotes
   CLOUDINARY_API_SECRET=abcdef123        # Just the secret, no quotes
   ```

2. **Check for typos:**
   - Copy credentials directly from Cloudinary dashboard
   - Don't manually type them

3. **Test credentials:**
   ```bash
   # Try uploading a test image
   curl -X POST https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/upload \
     -F "file=@test.jpg" \
     -F "api_key=YOUR_API_KEY" \
     -F "api_secret=YOUR_API_SECRET"
   ```

---

## ❌ MongoDB Connection Issues

### Issue: "MongoDB connection failed"

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
MongooseError: Cannot connect to MongoDB
```

**Solutions:**

1. **Verify MongoDB URI:**
   ```bash
   # Check .env file
   cat Backend/.env | grep MONGO_URI
   
   # Should look like:
   # MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
   ```

2. **Test MongoDB connection:**
   ```bash
   # Start backend server first
   npm start
   
   # Should show: ✅ MongoDB connected
   ```

3. **Common MONGO_URI issues:**
   - Missing username/password
   - Wrong cluster name
   - Spaces in password not URL encoded
   - Database name missing

4. **Fix password encoding:**
   ```
   Password: my@password!
   URL Encoded: my%40password%21
   
   In MONGO_URI: ...username:my%40password%21@...
   ```

5. **Test MongoDB directly:**
   ```bash
   # Install MongoDB tools
   npm install -g mongodb-cli-tools
   
   # Test connection
   mongosh "YOUR_MONGO_URI"
   ```

---

## ❌ Migration Script Issues

### Issue: "Migration started but no products found"

**Error:**
```
✅ MongoDB connected
📦 Fetching all products from MongoDB...
✅ Found 0 products to migrate
```

**Solutions:**

1. **Check if products exist:**
   ```bash
   # Start backend
   npm start
   
   # In another terminal, check products API
   curl http://localhost:5000/api/products
   ```

2. **Check database name:**
   ```bash
   # Verify MONGO_URI has correct database name
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/NG-V2
                                                              ^^^^^^
                                                         Database name
   ```

3. **Verify products in MongoDB:**
   ```bash
   # Connect to MongoDB and count products
   mongosh "your_mongo_uri"
   > use NG-V2
   > db.products.countDocuments()
   ```

---

### Issue: "Rate limit errors - 429 Too Many Requests"

**Error:**
```
Error: 429 Too Many Requests
Rate limit exceeded from Cloudinary
```

**Solutions:**

1. **Increase rate limit delay:**
   Edit `Backend/scripts/migrate-images-to-cloudinary.js`:
   ```javascript
   // Change this line (around line 20):
   const RATE_LIMIT_DELAY = 100; // Increase to 200 or 300
   ```

2. **Check Cloudinary plan:**
   - Free plan: 5,000 API calls/hour
   - With 2,142 images: might need 1-2 hour delay
   - Pro plan: Much higher limits

3. **Run migration with extended delay:**
   ```bash
   # Edit script first, then run
   npm run migrate:cloudinary
   ```

---

### Issue: "Image upload fails with 'Invalid URL'"

**Error:**
```
❌ Failed to upload main image
Error: Invalid URL: the URL provided is invalid or inaccessible
```

**Solutions:**

1. **Check image URLs in MongoDB:**
   ```bash
   mongosh "your_mongo_uri"
   > use NG-V2
   > db.products.findOne({ _id: ObjectId("...") })
   
   # Check if image URLs are valid strings
   ```

2. **Verify URLs are accessible:**
   ```bash
   # Test URL in browser or with curl
   curl -I "https://your-image-url.jpg"
   
   # Should return 200 OK
   ```

3. **Common image URL issues:**
   - Broken/expired links
   - Local file paths (not URLs)
   - CORS blocked URLs
   - Typos in URLs

4. **Fix invalid URLs:**
   - Update MongoDB with valid URLs before migration
   - Or skip migration and fix images first

---

### Issue: "Verification failed - URLs not accessible"

**Error:**
```
❌ Inaccessible URLs: 50
Some Cloudinary URLs are not working
```

**Solutions:**

1. **Check Cloudinary dashboard:**
   - Log into https://cloudinary.com/console
   - Verify images are uploaded
   - Check if images are public (not private)

2. **Check image permissions:**
   - Images should be public by default
   - Edit `migrate-images-to-cloudinary.js` if needed:
   ```javascript
   // In uploadImageWithRetries function:
   const response = await cloudinary.v2.uploader.upload(imageUrl, {
     public_id: publicId,
     overwrite: false,
     resource_type: 'auto',
     type: 'upload', // Ensure public upload
   });
   ```

3. **Verify URLs format:**
   - Should be: `https://res.cloudinary.com/your-cloud/image/upload/...`
   - Not: `https://your-cloud.cloudinary.com/...`

4. **Test URL directly:**
   ```bash
   # Copy URL from Cloudinary and test
   curl -I "https://res.cloudinary.com/..."
   ```

---

## ❌ Performance Issues

### Issue: "Migration taking too long"

**Status:**
```
Stuck on: 🔄 Processing product 32/63
Waiting for images to upload...
```

**Solutions:**

1. **Check network connection:**
   ```bash
   ping cloudinary.com
   # Should respond quickly
   ```

2. **Monitor Cloudinary API:**
   - Check API usage at: https://cloudinary.com/console/usage
   - Look for errors or rate limiting

3. **Reduce image size first:**
   - Compress images before migration
   - Smaller files upload faster

4. **Run migration in batches:**
   Edit `migrate-images-to-cloudinary.js`:
   ```javascript
   // Limit number of products to migrate at once
   const products = await Product.find().limit(20);
   // First run: 20 products
   // Second run: 20 products
   // Third run: 23 products
   ```

---

### Issue: "Out of memory / Node heap size exceeded"

**Error:**
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

**Solutions:**

```bash
# Increase Node.js heap size
node --max-old-space-size=4096 Backend/scripts/migrate-images-to-cloudinary.js

# Or update package.json script:
"migrate:cloudinary": "node --max-old-space-size=4096 scripts/migrate-images-to-cloudinary.js"
```

---

## ❌ Database Issues

### Issue: "Database locked or timeout"

**Error:**
```
MongooseError: Client must be connected before calling OperationHandler.constructor
```

**Solutions:**

1. **Ensure MongoDB is running:**
   ```bash
   # For local MongoDB
   mongod
   
   # For MongoDB Atlas, check connection string
   ```

2. **Increase connection timeout:**
   Edit scripts to add:
   ```javascript
   const mongooseOptions = {
     connectTimeoutMS: 10000,
     socketTimeoutMS: 45000,
   };
   await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
   ```

3. **Check MongoDB Atlas status:**
   - Go to: https://cloud.mongodb.com
   - Verify cluster is running
   - Check IP whitelist (add your IP)

---

### Issue: "Duplicate key error or constraint violation"

**Error:**
```
MongoError: E11000 duplicate key error
```

**Solutions:**

1. **This is normal if migration ran before:**
   - Run verification: `npm run migrate:verify`
   - It skips already-migrated products

2. **If it's blocking:**
   - Run rollback: `npm run migrate:rollback`
   - Then run migration again

---

## ❌ Backup Issues

### Issue: "Backup directory doesn't exist"

**Error:**
```
Error: ENOENT: no such file or directory, open 'Backend/backups/...'
```

**Solutions:**

```bash
# Create backups directory
mkdir -p Backend/backups

# Run backup again
npm run migrate:backup
```

### Issue: "Backup file too large"

**Status:**
```
63 products with many images = large JSON file (50-100MB)
```

**Solutions:**

1. **Split backup into smaller files:**
   - Edit `backup-db.js` to backup in batches

2. **Use compression:**
   ```bash
   gzip Backend/backups/products-backup-*.json
   ```

3. **Store on external storage:**
   - Upload to cloud storage
   - Upload to NAS or external drive

---

## ⚠️ Data Issues

### Issue: "Some products have missing images"

**Status:**
```
🔄 Processing product 15/63: T-Shirt Blue
  ✅ Front image uploaded
  ⚠️ Back image skipped (empty/null)
  ✅ 5/6 color variants uploaded
```

**This is normal!**

Solutions:
1. Update products with missing images
2. Run migration again (it's idempotent)
3. Check `Backend/logs/migration-report-*.json` for details

### Issue: "Backup URLs are wrong format"

**Check:**
```bash
# View backup in database
mongosh "your_mongo_uri"
> db.products.findOne()._

# Look for backup_urls field
```

**This is a tracking field - not an issue**

---

## 🔄 Rollback Issues

### Issue: "Rollback fails to restore URLs"

**Error:**
```
❌ Failed to rollback product
```

**Solutions:**

1. **Verify backup data exists:**
   ```bash
   mongosh "your_mongo_uri"
   > db.products.findOne({ "backup_urls": { $exists: true } })
   ```

2. **Check backup structure:**
   - Backup should have: `image`, `frontImage`, `backImage`

3. **Manual rollback:**
   ```bash
   # If rollback script fails, you can manually restore:
   mongosh "your_mongo_uri"
   > use NG-V2
   > db.products.updateMany(
      {},
      [{ $set: {
        image: "$backup_urls.image",
        frontImage: "$backup_urls.frontImage",
        backImage: "$backup_urls.backImage"
      }}]
    )
   ```

---

## 📊 Verification Issues

### Issue: "Verification shows inaccessible URLs"

**Error:**
```
❌ Inaccessible URLs: 15/630
```

**Solutions:**

1. **Wait for Cloudinary processing:**
   - Just uploaded images might not be immediately available
   - Wait 30 seconds and run verification again

2. **Check image details:**
   ```bash
   mongosh "your_mongo_uri"
   > db.products.findOne({ _id: ObjectId("...") })
   
   # Copy a URL and test:
   curl -I "https://res.cloudinary.com/..."
   ```

3. **Check Cloudinary status:**
   - Maybe Cloudinary API is having issues
   - Try again in a few minutes

---

## 💡 General Tips

1. **Always backup first:**
   ```bash
   npm run migrate:backup
   ```

2. **Run verification after migration:**
   ```bash
   npm run migrate:verify
   ```

3. **Check logs for details:**
   ```bash
   cat Backend/logs/migration-report-*.json
   ```

4. **Test one product first:**
   - Run migration script manually for 1 product
   - Verify it works before full migration

5. **Monitor Cloudinary dashboard:**
   - Watch uploads in real-time
   - Check for errors or limits

---

## 🔗 Useful Resources

- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Cloudinary API**: https://cloudinary.com/documentation/admin_api
- **MongoDB Docs**: https://docs.mongodb.com
- **Node.js Docs**: https://nodejs.org/en/docs

---

## 📞 Still Need Help?

1. **Check all above solutions**
2. **Review logs in `Backend/logs/`**
3. **Verify `.env` configuration**
4. **Test MongoDB connection separately**
5. **Test Cloudinary credentials separately**

---

**Last Updated**: 2024
**Version**: 1.0
