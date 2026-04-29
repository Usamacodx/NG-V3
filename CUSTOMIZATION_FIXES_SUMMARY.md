# Customization Studio Fixes - Complete

## Issues Fixed

### 1. ✅ Sticker Duplication on Preview Page
**Problem:** When adding 1 sticker and viewing preview, it showed 2 stickers (doubled).

**Root Cause:** Race condition during `addToCart` when switching views. The view sync effect would fire during view changes, causing stickers to be duplicated in both front/back designs.

**Solution:**
- Save the current UI state to the appropriate design (front/back) BEFORE switching views in `handleAddToCart`
- Set `suppressViewSync = true` during view switching to prevent race conditions
- Reduced the setTimeout delay from 300ms to 100ms for faster transitions
- This ensures stickers are captured from the correct design without duplication

**File:** `CustomizationStudio.jsx` - `handleAddToCart` function

---

### 2. ✅ Shirt Color Not Persisting on Back to Edit
**Problem:** When editing a cart item, shirt color reset to white (#FFFFFF) while text and stickers remained.

**Root Cause:** The shirt color was being checked with `if (shirtColor)` which would fail if it was null/undefined, causing it not to be set when loading saved customization data.

**Solution:**
- Changed condition from `if (customDetails.frontDesign.shirtColor)` to always set: `setShirtColor(customDetails.frontDesign.shirtColor || "#FFFFFF")`
- Applied fix in TWO places where customization is loaded:
  1. Initial load from location.state
  2. Re-application in setTimeout (to ensure proper syncing)
- Added explicit shirtColor to saved customization data with default value

**Files:** 
- `CustomizationStudio.jsx` - Lines 239 & 278 (loading customization)
- `CustomizationStudio.jsx` - `handleAddToCart` (saving with shirtColor)

---

### 3. ✅ Sticker Resize Limited to Increase Only
**Problem:** Could only increase sticker size from edges, couldn't decrease it by dragging inward.

**Root Cause:** The resize logic only tracked absolute distance, so moving in any direction away from starting point increased size. Moving back towards starting point would decrease size, but the logic wasn't intuitive.

**Solution:**
- Improved the resize direction calculation to properly handle both diagonal movement
- Calculate direction based on which way the mouse is moving relative to the resize handle (bottom-right corner)
- Now supports:
  - **Move away (↘)** = increase size
  - **Move toward (↖)** = decrease size
  - **Move horizontally/vertically** = resize in dominant direction

**File:** `CustomizationStudio.jsx` - `handleMouseMove` function

**Technical Detail:** 
```javascript
const direction = (distX > 0 && distY > 0) ? 1 : (distX < 0 && distY < 0) ? -1 : 
                 (Math.abs(distX) > Math.abs(distY)) ? (distX > 0 ? 1 : -1) : (distY > 0 ? 1 : -1);
const newSize = Math.max(40, Math.min(200, resizeStart.size + (distance * direction / 2)));
```

---

### 4. ✅ Sticker Position Mismatch on Preview
**Problem:** Stickers shown at wrong positions on preview page.

**Root Cause:** The preview page was using array index (`sticker-0`, `sticker-1`) to look up positions, but CustomizationStudio saves positions using the actual sticker.id (like `pexels_123`, `unsplash_5`).

**Solution:**
- Updated PreviewPage to use `sticker.id` as the position lookup key instead of array index
- This ensures positions saved in the studio are correctly retrieved on preview

**File:** `PreviewPage.jsx` - `drawDesignOnCanvas` function

---

## Testing Checklist

- [ ] Add 1 sticker → Add to cart → Preview (should show exactly 1 sticker)
- [ ] Customize shirt color → Add to cart → Edit (color should persist)
- [ ] Add sticker → Resize by dragging bottom-right handle:
  - [ ] Drag away (bottom-right) = size increases
  - [ ] Drag back toward center = size decreases
- [ ] Add multiple stickers → Check all display correctly on preview
- [ ] Switch between front/back views → Check colors and stickers persist
- [ ] Test backwards compatibility with old saved customizations

---

## Files Modified

1. **CustomizationStudio.jsx**
   - `handleAddToCart()` - Save state before view switching
   - `handleMouseMove()` - Improved sticker resize logic
   - Customization loading - Always set shirtColor with default

2. **PreviewPage.jsx**
   - `drawDesignOnCanvas()` - Use sticker.id for position lookup

---

## Impact

- **User Experience:** Fixes all three critical issues with customization flow
- **Data Integrity:** Ensures customization data is saved and loaded correctly
- **Backwards Compatibility:** Default values prevent breaking old saved customizations
