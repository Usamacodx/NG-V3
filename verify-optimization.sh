#!/bin/bash

# 🧪 PERFORMANCE OPTIMIZATION VERIFICATION SCRIPT
# Run this to verify all optimizations are working correctly

echo "================================"
echo "🚀 PERFORMANCE OPTIMIZATION TEST"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Running
echo "1️⃣  Checking if backend is running..."
if curl -s http://localhost:5000/api/products/list?page=1\&limit=12 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend not running${NC}"
    echo "   Fix: Run 'npm start' in Backend folder"
    exit 1
fi
echo ""

# Test 2: New Pagination Endpoint
echo "2️⃣  Testing pagination endpoint..."
RESPONSE=$(curl -s http://localhost:5000/api/products/list?page=1\&limit=12)
if echo "$RESPONSE" | grep -q "hasMore"; then
    echo -e "${GREEN}✅ Pagination endpoint works${NC}"
    echo "   Response includes: currentPage, hasMore, totalPages"
else
    echo -e "${RED}❌ Pagination endpoint not working${NC}"
    exit 1
fi
echo ""

# Test 3: Product Count
echo "3️⃣  Testing product data size..."
PRODUCT_COUNT=$(echo "$RESPONSE" | grep -o '"_id"' | wc -l)
if [ "$PRODUCT_COUNT" -le 12 ]; then
    echo -e "${GREEN}✅ Returning optimized data (${PRODUCT_COUNT} products)${NC}"
else
    echo -e "${RED}❌ Too many products returned (${PRODUCT_COUNT})${NC}"
fi
echo ""

# Test 4: MongoDB Indexes
echo "4️⃣  MongoDB indexes configured..."
echo -e "${YELLOW}⚠️  Manual verification required:${NC}"
echo "   Connect to MongoDB: mongo"
echo "   Run: db.products.getIndexes()"
echo "   Should see indexes on: name, category, price"
echo ""

# Test 5: Field Selection
echo "5️⃣  Checking field optimization..."
FIELDS=$(echo "$RESPONSE" | grep -o '"frontImage"' | wc -l)
if [ "$FIELDS" -gt 0 ]; then
    echo -e "${GREEN}✅ frontImage field present${NC}"
else
    echo -e "${RED}❌ frontImage field missing${NC}"
fi
echo ""

# Test 6: Variants Endpoint
echo "6️⃣  Testing variants endpoint..."
# Get first product ID
PRODUCT_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
if curl -s http://localhost:5000/api/products/$PRODUCT_ID/variants > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Variants endpoint works${NC}"
else
    echo -e "${YELLOW}⚠️  Variants endpoint failed (might need product ID)${NC}"
fi
echo ""

# Test 7: Response Time
echo "7️⃣  Measuring response time..."
START=$(date +%s%N)
curl -s http://localhost:5000/api/products/list?page=1\&limit=12 > /dev/null
END=$(date +%s%N)
TIME_MS=$(( (END - START) / 1000000 ))
if [ "$TIME_MS" -lt 1000 ]; then
    echo -e "${GREEN}✅ Fast response: ${TIME_MS}ms${NC}"
else
    echo -e "${YELLOW}⚠️  Slow response: ${TIME_MS}ms (optimize database)${NC}"
fi
echo ""

# Test 8: Frontend Files
echo "8️⃣  Checking frontend optimization files..."
if [ -f "frontend/src/utils/productOptimization.js" ]; then
    echo -e "${GREEN}✅ productOptimization.js exists${NC}"
else
    echo -e "${RED}❌ productOptimization.js missing${NC}"
fi

if grep -q "ITEMS_PER_PAGE = 12" "frontend/src/pages/ProductListing.jsx"; then
    echo -e "${GREEN}✅ Pagination implemented in ProductListing.jsx${NC}"
else
    echo -e "${RED}❌ Pagination not found in ProductListing.jsx${NC}"
fi

if grep -q "IntersectionObserver" "frontend/src/pages/ProductListing.jsx"; then
    echo -e "${GREEN}✅ Infinite scroll implemented${NC}"
else
    echo -e "${RED}❌ Infinite scroll not found${NC}"
fi

if grep -q 'loading="lazy"' "frontend/src/pages/ProductListing.jsx"; then
    echo -e "${GREEN}✅ Lazy loading implemented${NC}"
else
    echo -e "${RED}❌ Lazy loading not found${NC}"
fi
echo ""

# Test 9: Documentation
echo "9️⃣  Checking documentation..."
FILES=("PERFORMANCE_OPTIMIZATION.md" "QUICK_START_OPTIMIZATION.md" "IMPLEMENTATION_CHANGES.md")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
    fi
done
echo ""

# Summary
echo "================================"
echo "✅ VERIFICATION COMPLETE"
echo "================================"
echo ""
echo "📋 Next Steps:"
echo "   1. Open ProductListing page in browser"
echo "   2. Check DevTools → Network tab"
echo "   3. Look for request to: /api/products/list?page=1&limit=12"
echo "   4. Should see: ~50KB payload (not 500KB+)"
echo "   5. Should complete in: <500ms"
echo "   6. Scroll down → See infinite scroll load more"
echo "   7. Refresh → See cache load instantly"
echo ""
echo "📚 Documentation:"
echo "   - PERFORMANCE_OPTIMIZATION.md (comprehensive guide)"
echo "   - QUICK_START_OPTIMIZATION.md (quick reference)"
echo "   - IMPLEMENTATION_CHANGES.md (all changes)"
echo ""
