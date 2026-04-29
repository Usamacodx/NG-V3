import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import SVGShirtContainer from "../components/SVGShirtContainer";

// Helper function to check if image is SVG
const isSVGImage = (imageData) => {
  if (!imageData) return false;
  if (imageData.includes("data:image/svg+xml")) return true;
  if (typeof imageData === "string" && imageData.toLowerCase().endsWith(".svg")) return true;
  return false;
};

export default function PreviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const item = location.state?.item;
  const [selectedSize, setSelectedSize] = useState(item?.size || "M");
  const [sizeQuantities, setSizeQuantities] = useState({
    S: item?.size === "S" ? item?.quantity : 0,
    M: item?.size === "M" ? item?.quantity : 0,
    L: item?.size === "L" ? item?.quantity : 0,
    XL: item?.size === "XL" ? item?.quantity : 0,
    XXL: item?.size === "XXL" ? item?.quantity : 0,
  });

  const canvasRefFront = useRef(null);
  const canvasRefBack = useRef(null);
  const [frontImageDataUrl, setFrontImageDataUrl] = useState(null);
  const [backImageDataUrl, setBackImageDataUrl] = useState(null);

  // Parse customization details
  const customizationDetails = item?.customization
    ? typeof item.customization === "string"
      ? JSON.parse(item.customization)
      : item.customization
    : {};

  // Get front and back designs
  const frontDesign = customizationDetails.frontDesign || {};
  const backDesign = customizationDetails.backDesign || {};

  // Normalize design object to a consistent shape used by the canvas renderer
  const normalizeDesign = (d = {}) => {
    return {
      text: d.text || d.designText || "",
      color: d.color || d.selectedColor || "#000000",
      shirtColor: d.shirtColor || "#FFFFFF",
      font: d.font || d.selectedFont || "Arial",
      fontSize: d.fontSize || 24,
      logo: d.logo || d.logoData || null,
      logoSize: d.logoSize || 100,
      stickers: d.selectedStickers || [], // New: array of stickers
      sticker: d.sticker || d.selectedSticker || null, // Keep for backwards compatibility
      stickerSize: d.stickerSize || 80,
      textPos: d.textPos || { x: 50, y: 50 },
      logoPos: d.logoPos || { x: 20, y: 20 },
      instructions: d.instructions || d.instruction || "",
      charge: d.charge || d.price || d.chargeAmount || 0,
    };
  };

  const normalizedFront = normalizeDesign(frontDesign);
  const normalizedBack = normalizeDesign(backDesign);

  // Pass sticker positions to normalized designs
  if (frontDesign?.stickerPositions) normalizedFront.stickerPositions = frontDesign.stickerPositions;
  if (backDesign?.stickerPositions) normalizedBack.stickerPositions = backDesign.stickerPositions;

  // Calculate total quantity
  const totalQuantity = Object.values(sizeQuantities).reduce((a, b) => a + b, 0);

  // Calculate total amount
  const basePrice = item?.price || 0;
  const customizationPrice = item?.customizationPrice || 0;
  const totalAmount = (basePrice + customizationPrice) * totalQuantity;

  // Draw design on canvas
  const drawDesignOnCanvas = (canvas, design, side) => {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Studio canvas reference height is 500px (see CustomizationStudio.styles.canvas.height)
    // Use height-based scale so px sizes saved from the studio map correctly to this canvas
    const studioRefHeight = 500;
    const scale = height / studioRefHeight;

    const drawOverlays = () => {
      // subtle border
      ctx.strokeStyle = "#E8E8E8";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, height);

      // Draw text
      if (design.text) {
        const textSize = (design.fontSize || 24) * scale;
        const fontFamily = design.font || "Arial";
        const textColor = design.color || "#000000";

        ctx.fillStyle = textColor;
        ctx.font = `bold ${textSize}px ${fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const x = design.textPos?.x ? (design.textPos.x / 100) * width : width / 2;
        const y = design.textPos?.y ? (design.textPos.y / 100) * height : height / 2;

        const lines = design.text.split("\n");
        const lineHeight = textSize + 5;
        const totalHeight = lineHeight * lines.length;
        let startY = y - totalHeight / 2;

        lines.forEach((line, index) => {
          ctx.fillText(line, x, startY + index * lineHeight);
        });

        // text shadow
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        lines.forEach((line, index) => {
          ctx.fillText(line, x + 2, startY + index * lineHeight + 2);
        });
      }

      // Draw logo (supports data:, blob:, http(s) or object with url)
      const drawImageFromSource = (src, x, y, w, h) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => ctx.drawImage(img, x, y, w, h);
        img.onerror = () => console.warn("Failed to load image", src);
        img.src = src;
      };

      if (design.logo) {
        // logo may be string (data URL or url) or object { url }
        const logoSrc = typeof design.logo === 'string' ? design.logo : design.logo?.url || null;
        if (logoSrc) {
            const logoWidth = (design.logoSize || 100) * scale;
            const logoHeight = (design.logoSize || 100) * scale;
          const logoX = design.logoPos?.x ? (design.logoPos.x / 100) * width : (width - logoWidth) / 2;
          const logoY = design.logoPos?.y ? (design.logoPos.y / 100) * height : (height - logoHeight) / 2;
          // Studio positions use translate(-50%, -50%) (center anchor), so draw centered here too
          drawImageFromSource(logoSrc, logoX - logoWidth / 2, logoY - logoHeight / 2, logoWidth, logoHeight);
        }
      }

      // Draw stickers: supports emoji, object with emoji, or image url
      // Handle array of stickers (new) and single sticker (old for backwards compatibility)
      const drawStickerFile = (sticker, stickerId, stickerPositions = {}) => {
        const stickerSize = (sticker.stickerSize || sticker.size || 80) * scale;
        // ✅ FIX: Use sticker.id if available to match the position key used in studio
        const posKey = sticker.id || stickerId;
        const pos = stickerPositions[posKey] || { x: 50, y: 50 };
        const stickerX = (pos.x / 100) * width;
        const stickerY = (pos.y / 100) * height;

        if (typeof sticker === 'string') {
          // string could be emoji or url/data
          if (sticker.startsWith('data:') || sticker.startsWith('http') || sticker.startsWith('blob:')) {
            drawImageFromSource(sticker, stickerX - stickerSize / 2, stickerY - stickerSize / 2, stickerSize, stickerSize);
          } else {
            ctx.font = `${stickerSize}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(sticker, stickerX, stickerY);
          }
        } else if (typeof sticker === 'object') {
          if (sticker.emoji) {
            ctx.font = `${stickerSize}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(sticker.emoji, stickerX, stickerY);
          } else if (sticker.url) {
            drawImageFromSource(sticker.url, stickerX - stickerSize / 2, stickerY - stickerSize / 2, stickerSize, stickerSize);
          }
        }
      };

      // Draw multiple stickers from array (new)
      if (design.stickers && design.stickers.length > 0) {
        design.stickers.forEach((sticker) => {
          // ✅ FIX: Use sticker.id as the key to match positions saved in studio
          drawStickerFile(sticker, sticker.id || sticker.name, design.stickerPositions || {});
        });
      } else if (design.sticker) {
        // Fallback to single sticker for backwards compatibility (old format)
        drawStickerFile(design.sticker, 'sticker-0', design.stickerPositions || {});
      }
    };

    // Clear canvas first
    ctx.clearRect(0, 0, width, height);

    // Prefer already-converted data URLs, otherwise fall back to item product images
    const bgDataUrl = side === "front"
      ? (frontImageDataUrl || item?.frontImage || item?.image || null)
      : (backImageDataUrl || item?.backImage || item?.image || null);
    if (bgDataUrl) {
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, width, height);
        drawOverlays();
      };
      bgImg.onerror = () => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        drawOverlays();
      };
      bgImg.src = bgDataUrl;
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      drawOverlays();
    }
  };

  // Helper to convert URL -> data URL
  const toDataUrl = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('toDataUrl failed for', url, e.message);
      return null;
    }
  };

  // Load product images for background (prefer item fields, otherwise fetch product)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (item?.frontImage) {
          setFrontImageDataUrl(item.frontImage.startsWith('data:') ? item.frontImage : await toDataUrl(item.frontImage));
        }
        if (item?.backImage) {
          setBackImageDataUrl(item.backImage.startsWith('data:') ? item.backImage : await toDataUrl(item.backImage));
        }

        if ((!item?.frontImage || !item?.backImage) && item?._id) {
          const resp = await fetch(`http://localhost:5000/api/products/${item._id}`);
          if (resp.ok) {
            const prod = await resp.json();
            if (mounted) {
              if (!frontImageDataUrl && prod.frontImage) {
                setFrontImageDataUrl(prod.frontImage.startsWith('data:') ? prod.frontImage : await toDataUrl(prod.frontImage));
              }
              if (!backImageDataUrl && prod.backImage) {
                setBackImageDataUrl(prod.backImage.startsWith('data:') ? prod.backImage : await toDataUrl(prod.backImage));
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed loading preview images', err.message);
      }
    })();
    return () => { mounted = false; };
  }, [item?._id]);

  // Draw on canvas when component mounts or design changes
  useEffect(() => {
    // Use requestAnimationFrame to ensure canvas is ready
    const timer = setTimeout(() => {
      const frontCanvas = canvasRefFront.current;
      const backCanvas = canvasRefBack.current;

      if (frontCanvas) {
        drawDesignOnCanvas(frontCanvas, normalizedFront, "front");
      }
      if (backCanvas) {
        drawDesignOnCanvas(backCanvas, normalizedBack, "back");
      }
    }, 100); // Small delay to ensure canvases are mounted

    return () => clearTimeout(timer);
  }, [frontDesign, backDesign, frontImageDataUrl, backImageDataUrl]);

  // Update quantity for a size
  const handleSizeQuantityChange = (size, value) => {
    setSizeQuantities({
      ...sizeQuantities,
      [size]: Math.max(0, value),
    });
  };

  // Handle back to edit
  const handleBackToEdit = () => {
    if (item?._id) {
      navigate(`/customize/${item._id}`, { 
        state: { item } 
      });
    } else {
      navigate("/products");
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!user) {
      alert("Please sign in to add items to cart");
      navigate("/login");
      return;
    }

    if (totalQuantity === 0) {
      alert("Please select at least one size and quantity");
      return;
    }

    // Add items for each size with quantity
    Object.keys(sizeQuantities).forEach((size) => {
      const qty = sizeQuantities[size];
      if (qty > 0) {
        addToCart(
          item,
          qty,
          size,
          item.customization,
          item.customizationPrice
        );
      }
    });

    alert("Added to cart successfully!");
    navigate("/cart");
  };

  if (!item) {
    return (
      <div style={styles.container}>
        <div style={styles.errorMessage}>
          <p>No item to preview. Please select a product from cart.</p>
          <button style={styles.backBtn} onClick={() => navigate("/cart")}>
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.mainHeading}>Preview Your Apparel</h1>
      <h2 style={styles.subHeading}>White T-Shirt Preview</h2>

      <div style={styles.previewSection}>
        {/* Back Design - Left */}
        <div style={styles.designContainer}>
          <h3 style={styles.sideHeading}>Back</h3>
          <canvas
            ref={canvasRefBack}
            width={300}
            height={350}
            style={styles.canvas}
          />
        </div>

        {/* Center Details */}
        <div style={styles.detailsContainer}>
          <h2 style={styles.productName}>My Custom Shirt</h2>

          <div style={styles.priceSection}>
            <p style={styles.priceLabel}>Price: <strong>Rs. {basePrice} /-</strong></p>
            {customizationPrice > 0 && (
              <p style={styles.customizationLabel}>
                Customization: <strong>Rs. {customizationPrice} /-</strong>
              </p>
            )}
            <p style={styles.totalLabel}>
              Total per Item: <strong>Rs. {basePrice + customizationPrice} /-</strong>
            </p>
          </div>

          {/* Customization Details */}
          {(normalizedFront.text || normalizedFront.logo || normalizedFront.stickers?.length > 0 || 
            normalizedBack.text || normalizedBack.logo || normalizedBack.stickers?.length > 0) && (
            <div style={styles.customizationBox}>
              <h4 style={styles.customHeading}>Customization Details</h4>
              {(normalizedFront.text || normalizedFront.logo || normalizedFront.stickers?.length > 0) && (
                <div>
                  <p style={styles.sideLabel}>🔹 Front Side:</p>
                  {normalizedFront.shirtColor && <p style={styles.detailText}>👕 Shirt Color: <span style={{display:'inline-block', width:'16px', height:'16px', backgroundColor: normalizedFront.shirtColor, border:'1px solid #ccc', borderRadius:'3px', verticalAlign:'middle', marginLeft:'5px', marginRight:'5px'}}></span>{normalizedFront.shirtColor}</p>}
                  {normalizedFront.text && <p style={styles.detailText}>Text: {normalizedFront.text}</p>}
                  {normalizedFront.logo && <p style={styles.detailText}>Logo: Included</p>}
                  {normalizedFront.stickers && normalizedFront.stickers.length > 0 && (
                    <p style={styles.detailText}>Stickers: {normalizedFront.stickers.map((s) => s.name || s.emoji || 'Sticker').join(', ')}</p>
                  )}
                  {normalizedFront.charge ? <p style={styles.chargeText}>Charge: Rs. {normalizedFront.charge}</p> : null}
                </div>
              )}
              {(normalizedBack.text || normalizedBack.logo || normalizedBack.stickers?.length > 0) && (
                <div>
                  <p style={styles.sideLabel}>🔹 Back Side:</p>
                  {normalizedBack.text && <p style={styles.detailText}>Text: {normalizedBack.text}</p>}
                  {normalizedBack.logo && <p style={styles.detailText}>Logo: Included</p>}
                  {normalizedBack.stickers && normalizedBack.stickers.length > 0 && (
                    <p style={styles.detailText}>Stickers: {normalizedBack.stickers.map((s) => s.name || s.emoji || 'Sticker').join(', ')}</p>
                  )}
                  {normalizedBack.charge ? <p style={styles.chargeText}>Charge: Rs. {normalizedBack.charge}</p> : null}
                </div>
              )}
            </div>
          )}

          {/* Size Selection */}
          <div style={styles.sizeSection}>
            <h4 style={styles.sizeHeading}>Select Sizes & Quantity</h4>
            <div style={styles.sizeGrid}>
              {Object.keys(sizeQuantities).map((size) => (
                <div key={size} style={styles.sizeItem}>
                  <button
                    style={{
                      ...styles.sizeBtn,
                      ...(selectedSize === size ? styles.sizeBtnActive : {}),
                    }}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={sizeQuantities[size]}
                    onChange={(e) =>
                      handleSizeQuantityChange(size, parseInt(e.target.value) || 0)
                    }
                    style={styles.quantityInputSmall}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Total Summary */}
          <div style={styles.summaryBox}>
            <div style={styles.summaryRow}>
              <span>Total Quantity:</span>
              <strong style={styles.summaryValue}>{totalQuantity}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Total Amount:</span>
              <strong style={styles.summaryValue}>Rs. {totalAmount} /-</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.actionButtons}>
            <button style={styles.backBtn} onClick={handleBackToEdit}>
              Back to Edit
            </button>
            <button style={styles.addToCartBtn} onClick={handleAddToCart}>
              Add to Cart
            </button>
          </div>
        </div>

        {/* Front Design - Right */}
        <div style={styles.designContainer}>
          <h3 style={styles.sideHeading}>Front</h3>
          <canvas
            ref={canvasRefFront}
            width={300}
            height={350}
            style={styles.canvas}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px 20px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  mainHeading: {
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center",
    margin: "0 0 10px 0",
    color: "#000",
  },
  subHeading: {
    fontSize: "18px",
    textAlign: "center",
    color: "#666",
    margin: "0 0 30px 0",
    fontWeight: "500",
  },
  previewSection: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr 1fr",
    gap: "30px",
    alignItems: "start",
  },
  designContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
  },
  sideHeading: {
    fontSize: "16px",
    fontWeight: "bold",
    margin: "0",
    color: "#000",
  },
  canvas: {
    border: "2px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: "300px",
    height: "auto",
  },
  detailsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "10px",
    border: "1px solid #ddd",
  },
  productName: {
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0",
    color: "#000",
  },
  priceSection: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "15px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  priceLabel: {
    fontSize: "14px",
    margin: "0",
    color: "#333",
  },
  customizationLabel: {
    fontSize: "13px",
    margin: "0",
    color: "#666",
  },
  totalLabel: {
    fontSize: "14px",
    margin: "8px 0 0 0",
    color: "#000",
    fontWeight: "bold",
  },
  customizationBox: {
    padding: "12px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  customHeading: {
    fontSize: "13px",
    fontWeight: "bold",
    margin: "0 0 8px 0",
    color: "#333",
  },
  sideLabel: {
    fontSize: "12px",
    fontWeight: "bold",
    margin: "6px 0 4px 0",
    color: "#555",
  },
  detailText: {
    fontSize: "12px",
    margin: "2px 0 2px 12px",
    color: "#666",
  },
  chargeText: {
    fontSize: "12px",
    margin: "4px 0 2px 12px",
    color: "#4CAF50",
    fontWeight: "bold",
  },
  sizeSection: {
    padding: "15px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  sizeHeading: {
    fontSize: "13px",
    fontWeight: "bold",
    margin: "0 0 10px 0",
    color: "#333",
  },
  sizeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "8px",
  },
  sizeItem: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    alignItems: "center",
  },
  sizeBtn: {
    padding: "8px 12px",
    border: "2px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#333",
    transition: "all 0.3s",
  },
  sizeBtnActive: {
    backgroundColor: "#000",
    color: "#fff",
    borderColor: "#000",
  },
  quantityInputSmall: {
    width: "45px",
    padding: "5px",
    fontSize: "11px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    textAlign: "center",
  },
  summaryBox: {
    padding: "15px",
    backgroundColor: "#FFF9E6",
    borderRadius: "8px",
    border: "2px solid #FFD700",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
  },
  summaryValue: {
    color: "#000",
  },
  actionButtons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  backBtn: {
    padding: "12px",
    backgroundColor: "#fff",
    color: "#000",
    border: "2px solid #000",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "all 0.3s",
  },
  addToCartBtn: {
    padding: "12px",
    backgroundColor: "#000",
    color: "#fff",
    border: "2px solid #000",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "all 0.3s",
  },
  errorMessage: {
    textAlign: "center",
    padding: "50px 20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "10px",
    border: "1px solid #ddd",
  },
};
