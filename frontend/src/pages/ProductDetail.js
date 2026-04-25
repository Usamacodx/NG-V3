import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [customization, setCustomization] = useState("");
  const [customizationPrice, setCustomizationPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [currentFrontImage, setCurrentFrontImage] = useState("");
  const [currentBackImage, setCurrentBackImage] = useState("");

  // ✅ Check login using context or token
  const isLoggedIn = user || !!localStorage.getItem("token");

  // ✅ Check admin login status on load
  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdminLoggedIn") === "true";
    setIsAdmin(adminStatus);
  }, []);

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setCurrentFrontImage(data.frontImage);
        setCurrentBackImage(data.backImage);
        // If there are color variants, select the first color by default
        if (data.colorVariants && data.colorVariants.length > 0) {
          setSelectedColor(data.colorVariants[0].colorName);
          setCurrentFrontImage(data.colorVariants[0].frontImage);
          setCurrentBackImage(data.colorVariants[0].backImage);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  // Handle color selection
  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName);
    
    // Find the color variant
    const variant = product.colorVariants?.find(v => v.colorName === colorName);
    if (variant) {
      setCurrentFrontImage(variant.frontImage || product.frontImage);
      setCurrentBackImage(variant.backImage || product.backImage);
    } else {
      // Fallback to default images if variant not found
      setCurrentFrontImage(product.frontImage);
      setCurrentBackImage(product.backImage);
    }
  };

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      alert("Please login first to add products to the cart!");
      navigate("/login");
      return;
    }

    addToCart(product, quantity, selectedSize, customization, customizationPrice);
    alert(`Added ${quantity} item(s) to cart!`);
    navigate("/cart");
  };

  const handleCustomizeNow = () => {
    if (!isLoggedIn) {
      alert("Please login first to customize the product!");
      navigate("/login");
      return;
    }

    console.log("🎨 ProductDetail - Passing product to CustomizationStudio:");
    console.log("   Product object:", product);
    console.log("   colorVariants:", product?.colorVariants);
    console.log("   colorVariants length:", product?.colorVariants?.length);

    navigate(`/customize/${id}`, { state: { product } });
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return (
      <>
        {"★".repeat(fullStars)}
        {halfStar ? "⯨" : ""}
        {"☆".repeat(emptyStars)}
      </>
    );
  };

  if (loading) return <h2 style={styles.loading}>Loading product...</h2>;
  if (!product) return <h2 style={styles.loading}>Product not found</h2>;

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate("/products")}>
        ← Back to Products
      </button>

      <div style={styles.contentWrapper}>
        {/* Image Section */}
        <div style={styles.imageSection}>
          <img
            src={currentFrontImage || "https://via.placeholder.com/500"}
            alt={product.name}
            style={styles.mainImage}
          />

          <div style={styles.thumbnailContainer}>
            {currentFrontImage && (
              <img
                src={currentFrontImage}
                alt="Front View"
                title="Front View"
                style={styles.thumbnail}
              />
            )}
            {currentBackImage && (
              <img
                src={currentBackImage}
                alt="Back View"
                title="Back View"
                style={styles.thumbnail}
              />
            )}
          </div>
        </div>

        {/* Details Section */}
        <div style={styles.detailsSection}>
          <h1 style={styles.productName}>{product.name}</h1>

          <div style={styles.priceSection}>
            <span style={styles.price}>Rs. {product.price}</span>
          </div>

          {/* Product Information */}
          <div style={styles.productInfoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Category:</span>
              <span style={styles.infoValue}>{product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : "N/A"}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Subcategory:</span>
              <span style={styles.infoValue}>{product.subcategory ? product.subcategory.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "N/A"}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Fabric:</span>
              <span style={styles.infoValue}>{product.fabric ? product.fabric.charAt(0).toUpperCase() + product.fabric.slice(1) : "N/A"}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Available Stock:</span>
              <span style={styles.infoValue}>{product.quantity || 0} items</span>
            </div>
          </div>

          <p style={styles.description}>
            {product.description ||
              "High-quality fabric with a comfortable fit. Soft, breathable and perfect for daily wear. Ideal for summer and winter layering."}
          </p>

          {/* ✅ Color Swatches with Dynamic Images */}
          {product.colorVariants && product.colorVariants.length > 0 && (
            <div style={styles.sectionGroup}>
              <label style={styles.label}>🎨 Select Color</label>
              <div style={styles.colorSwatchContainer}>
                {product.colorVariants.map((variant) => (
                  <button
                    key={variant.colorName}
                    style={{
                      ...styles.colorSwatch,
                      backgroundColor: variant.colorCode,
                      border: selectedColor === variant.colorName ? "3px solid #000" : "2px solid #ccc",
                      boxShadow: selectedColor === variant.colorName ? "0 0 12px rgba(0,0,0,0.4)" : "none",
                    }}
                    onClick={() => handleColorSelect(variant.colorName)}
                    title={variant.colorName}
                  />
                ))}
              </div>
              <p style={styles.selectedColorText}>
                Selected: <strong>{selectedColor || "None"}</strong>
              </p>
            </div>
          )}

          {/* Fallback: Show available colors as text if no variants */}
          {(!product.colorVariants || product.colorVariants.length === 0) && product.colors && product.colors.length > 0 && (
            <div style={styles.sectionGroup}>
              <label style={styles.label}>Available Colors</label>
              <div style={styles.colorContainer}>
                {product.colors.map((color) => (
                  <span key={color} style={styles.colorBadge}>
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          <div style={styles.sectionGroup}>
            <label style={styles.label}>📏 Select Size</label>
            <div style={styles.sizeOptions}>
              {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                <button
                  key={size}
                  style={{
                    ...styles.sizeBtn,
                    ...(selectedSize === size ? styles.sizeBtnActive : {}),
                  }}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          <div style={styles.sectionGroup}>
            <label style={styles.label}>📦 Quantity</label>
            <div style={styles.quantitySelector}>
              <button
                style={styles.quantityBtn}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                style={styles.quantityInput}
                min="1"
              />
              <button
                style={styles.quantityBtn}
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.buttonGroup}>
            {!isAdmin && (
              <>
                <button style={styles.addToCartBtn} onClick={handleAddToCart}>
                  🛒 Add to Cart
                </button>
                <button style={styles.customizeNowBtn} onClick={handleCustomizeNow}>
                  ✏️ Customize Now
                </button>
              </>
            )}
          </div>

          {/* Customization Info */}
          {customization && (
            <div style={styles.customizationInfo}>
              <p style={styles.customizationText}>
                <strong>Customization:</strong> {customization}
              </p>
              {customizationPrice > 0 && (
                <p style={styles.customizationPrice}>
                  Customization Price: Rs.{customizationPrice.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Benefits Section */}
          <div style={styles.benefitsSection}>
            <div style={styles.benefitItem}>
              <span style={styles.checkmark}>✓</span>
              <div>
                <strong>Premium Quality</strong>
                <p>100% export-grade fabric</p>
              </div>
            </div>
            <div style={styles.benefitItem}>
              <span style={styles.checkmark}>✓</span>
              <div>
                <strong>Delivery</strong>
                <p>All over Pakistan</p>
              </div>
            </div>
            <div style={styles.benefitItem}>
              <span style={styles.checkmark}>✓</span>
              <div>
                <strong>Easy Returns</strong>
                <p>7-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Styles ===== */
const styles = {
  container: { padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Arial, sans-serif" },
  backBtn: { backgroundColor: "#000", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", marginBottom: "30px", fontSize: "14px" },
  contentWrapper: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" },
  imageSection: { display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: "15px" },
  mainImage: { width: "100%", maxWidth: "450px", height: "500px", borderRadius: "10px", objectFit: "cover" },
  thumbnailContainer: { display: "flex", gap: "15px", justifyContent: "flex-start", width: "100%" },
  thumbnail: { width: "215px", height: "180px", borderRadius: "8px", objectFit: "cover", border: "2px solid #ddd", cursor: "pointer", transition: "all 0.3s", flexShrink: 0 },
  detailsSection: { display: "flex", flexDirection: "column", gap: "20px" },
  productName: { fontSize: "32px", fontWeight: "bold", margin: "0", color: "#000" },
  priceSection: { display: "flex", alignItems: "center", gap: "15px" },
  price: { fontSize: "28px", fontWeight: "bold", color: "#000" },
  productInfoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "8px", border: "1px solid #ddd" },
  infoItem: { display: "flex", flexDirection: "column", gap: "5px" },
  infoLabel: { fontSize: "12px", fontWeight: "bold", color: "#666", textTransform: "uppercase" },
  infoValue: { fontSize: "15px", fontWeight: "500", color: "#000" },
  description: { fontSize: "14px", color: "#555", lineHeight: "1.6", margin: "0" },
  sectionGroup: { display: "flex", flexDirection: "column", gap: "10px" },
  label: { fontSize: "14px", fontWeight: "bold", color: "#000" },
  sizeOptions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  sizeBtn: { padding: "10px 15px", border: "2px solid #ddd", borderRadius: "5px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", backgroundColor: "#fff", color: "#000", transition: "all 0.2s" },
  sizeBtnActive: { backgroundColor: "#000", color: "#fff", borderColor: "#000" },
  quantitySelector: { display: "flex", alignItems: "center", gap: "10px", width: "fit-content" },
  quantityBtn: { backgroundColor: "#000", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "5px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" },
  quantityInput: { width: "60px", padding: "8px", fontSize: "14px", border: "2px solid #ddd", borderRadius: "5px", textAlign: "center" },
  buttonGroup: { display: "flex", gap: "15px", marginTop: "10px" },
  addToCartBtn: { flex: 1, padding: "15px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "5px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" },
  customizeNowBtn: { flex: 1, padding: "15px", backgroundColor: "#fff", color: "#000", border: "2px solid #000", borderRadius: "5px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" },
  benefitsSection: { display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #ddd" },
  benefitItem: { display: "flex", alignItems: "flex-start", gap: "15px" },
  checkmark: { fontSize: "20px", color: "#4CAF50", fontWeight: "bold", marginTop: "2px" },
  customizationInfo: { backgroundColor: "#f0f0f0", padding: "12px", borderRadius: "5px", marginTop: "15px" },
  customizationText: { margin: "0 0 8px 0", fontSize: "14px", color: "#333" },
  customizationPrice: { margin: "0", fontSize: "14px", color: "#4CAF50", fontWeight: "bold" },
  loading: { textAlign: "center", fontSize: "18px", color: "#666" },
  colorContainer: { display: "flex", gap: "8px", flexWrap: "wrap" },
  colorBadge: { display: "inline-block", padding: "8px 12px", backgroundColor: "#f0f0f0", border: "1px solid #ddd", borderRadius: "5px", fontSize: "13px", fontWeight: "500", color: "#333" },
  // ✅ NEW: Color Swatches
  colorSwatchContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: "12px" },
  colorSwatch: { width: "60px", height: "60px", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease", position: "relative" },
  selectedColorText: { fontSize: "13px", color: "#666", margin: "5px 0 0 0" },
};

export default ProductDetail;
