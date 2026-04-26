import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Available colors with hex codes
const COLOR_OPTIONS = [
  { name: "Red", code: "#FF0000" },
  { name: "Yellow", code: "#FFFF00" },
  { name: "White", code: "#FFFFFF" },
  { name: "Black", code: "#000000" },
  { name: "Grey", code: "#808080" },
  { name: "Pink", code: "#FFC0CB" },
  { name: "Mustard", code: "#FFDB58" },
  { name: "Berry", code: "#663399" },
  { name: "Sea Green", code: "#2E8B57" },
  { name: "Yam", code: "#FF6B35" },
  { name: "Blue", code: "#0000FF" },
  { name: "Brown", code: "#8B4513" },
  { name: "Orange", code: "#FFA500" },
  { name: "Purple", code: "#800080" },
  { name: "Peach", code: "#FFDAB9" },
  { name: "Maroon", code: "#800000" },
  { name: "Sky", code: "#87CEEB" },
  { name: "Pepper", code: "#4B0082" },
  { name: "Crimson", code: "#DC143C" },
  { name: "Royal Blue", code: "#4169E1" },
  { name: "Bottle Green", code: "#006B3F" },
  { name: "Melon", code: "#FDBCB4" },
];

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [expandedColors, setExpandedColors] = useState({});

  const [product, setProduct] = useState({
    name: "",
    price: "",
    quantity: "",
    category: "",
    subcategory: "",
    fabric: "",
    description: "",
    frontImage: "",
    backImage: "",
    colors: [],
    colorVariants: [],
  });

  const [imageFiles, setImageFiles] = useState({
    frontImage: null,
    backImage: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
    setError("");
    setFieldErrors({ ...fieldErrors, [name]: "" });
  };

  const handleColorToggle = (colorName, colorCode) => {
    const exists = product.colors.includes(colorName);
    let newColors = exists 
      ? product.colors.filter((c) => c !== colorName)
      : [...product.colors, colorName];
    
    let newColorVariants = product.colorVariants;
    if (exists) {
      newColorVariants = newColorVariants.filter(v => v.colorName !== colorName);
    } else {
      newColorVariants.push({
        colorName: colorName,
        colorCode: colorCode,
        frontImage: "",
        backImage: ""
      });
    }

    setProduct({ 
      ...product, 
      colors: newColors,
      colorVariants: newColorVariants
    });
    setFieldErrors({ ...fieldErrors, colors: "" });
  };

  const handleColorImageUpload = async (e, colorName, imageType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setFieldErrors({ ...fieldErrors, [`${colorName}_${imageType}`]: "Only PNG/JPEG/WebP/SVG allowed" });
      return;
    }

    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      setFieldErrors({ ...fieldErrors, [`${colorName}_${imageType}`]: "Image must be ≤ 3MB" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result;
      const updatedVariants = product.colorVariants.map(v => 
        v.colorName === colorName 
          ? { ...v, [imageType === "front" ? "frontImage" : "backImage"]: base64String }
          : v
      );
      setProduct({ ...product, colorVariants: updatedVariants });
      setFieldErrors({ ...fieldErrors, [`${colorName}_${imageType}`]: "" });
    };
    reader.onerror = () => {
      setFieldErrors({ ...fieldErrors, [`${colorName}_${imageType}`]: "Failed to read file" });
    };
    reader.readAsDataURL(file);
  };

  // Handle general front/back image upload (fallback for all products)
  const handleFileUpload = async (e, imageField) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setFieldErrors({ ...fieldErrors, [imageField]: "Only PNG/JPEG/WebP/SVG images allowed" });
      return;
    }
    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      setFieldErrors({ ...fieldErrors, [imageField]: "Image must be <= 3MB" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result;
      setProduct({ ...product, [imageField]: base64String });
      setImageFiles({ ...imageFiles, [imageField]: file.name });
      setFieldErrors({ ...fieldErrors, [imageField]: "" });
    };
    reader.onerror = () => {
      setFieldErrors({ ...fieldErrors, [imageField]: "Failed to read file" });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const errors = {};
    
    if (!product.name || product.name.trim().length < 3) errors.name = "Product name (min 3 chars) required";
    if (product.price === "" || isNaN(Number(product.price)) || Number(product.price) < 0) errors.price = "Price ≥ 0 required";
    if (product.quantity !== "" && (!Number.isInteger(Number(product.quantity)) || Number(product.quantity) < 0)) errors.quantity = "Quantity must be non-negative integer";
    if (!product.category) errors.category = "Please select gender";
    if (!product.subcategory) errors.subcategory = "Please select type";
    if (!product.fabric) errors.fabric = "Please select fabric";
    if (!product.frontImage) errors.frontImage = "General front image required";
    if (!product.backImage) errors.backImage = "General back image required";

    // Validate color variants - each selected color must have front and back images
    if (product.colors.length > 0) {
      const missingImages = product.colorVariants.filter(v => !v.frontImage || !v.backImage);
      if (missingImages.length > 0) {
        errors.colorVariants = `Missing images for: ${missingImages.map(v => v.colorName).join(", ")}`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields");
      return;
    }

    setLoading(true);

    try {
      const healthRes = await fetch("http://localhost:5000/api/health");
      if (!healthRes.ok) throw new Error("Backend not responding");
      
      const health = await healthRes.json();
      if (!health.mongoConnected) throw new Error("MongoDB not connected");
      
      const payload = {
        name: product.name?.trim(),
        price: Number(product.price),
        quantity: Number(product.quantity) || 0,
        category: product.category,
        subcategory: product.subcategory,
        fabric: product.fabric,
        colors: product.colors || [],
        description: product.description?.trim() || "",
        frontImage: product.frontImage,
        backImage: product.backImage,
        colorVariants: product.colorVariants || [],
      };

      console.log("📤 Sending payload to API:", payload);
      console.log("   colorVariants in payload:", payload.colorVariants);
      console.log("   colorVariants count:", payload.colorVariants.length);
      if (payload.colorVariants.length > 0) {
        console.log("   First variant:", payload.colorVariants[0]);
      }

      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: `;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage += errorData.message || JSON.stringify(errorData);
        } catch {
          errorMessage += responseText.substring(0, 200);
        }
        throw new Error(errorMessage);
      }

      alert("✅ Product added successfully!");
      setProduct({
        name: "",
        price: "",
        quantity: "",
        category: "",
        subcategory: "",
        fabric: "",
        description: "",
        frontImage: "",
        backImage: "",
        colors: [],
        colorVariants: [],
      });
      setImageFiles({ frontImage: null, backImage: null });
      setFieldErrors({});
      setExpandedColors({});
      //navigate("/products");
    } catch (err) {
      setError(err.message || "Error adding product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <h2>➕ Add Product (Admin)</h2>
      
      {error && <div style={errorStyle}><strong>⚠️ Error:</strong> {error}</div>}

      <form onSubmit={handleSubmit} style={formStyle}>
        {/* BASIC INFO */}
        <h3 style={sectionHeadingStyle}>📋 Basic Information</h3>
        
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={product.name}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        {fieldErrors.name && <div style={errorFieldStyle}>{fieldErrors.name}</div>}
        
        <input
          type="number"
          name="price"
          placeholder="Price (PKR)"
          value={product.price}
          onChange={handleChange}
          required
          min="0"
          step="1"
          style={inputStyle}
        />
        {fieldErrors.price && <div style={errorFieldStyle}>{fieldErrors.price}</div>}
        
        <input
          type="number"
          name="quantity"
          placeholder="Available Stock"
          value={product.quantity}
          onChange={handleChange}
          style={inputStyle}
          min="0"
          step="1"
        />
        {fieldErrors.quantity && <div style={errorFieldStyle}>{fieldErrors.quantity}</div>}

        <textarea
          name="description"
          placeholder="Product Description"
          value={product.description}
          onChange={handleChange}
          rows="3"
          style={inputStyle}
        />

        {/* CATEGORY & TYPE */}
        <h3 style={sectionHeadingStyle}>🏷️ Category & Type</h3>

        <select name="category" value={product.category} onChange={handleChange} required style={inputStyle}>
          <option value="">Select Gender</option>
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="kids">Kids</option>
        </select>
        {fieldErrors.category && <div style={errorFieldStyle}>{fieldErrors.category}</div>}

        <select name="subcategory" value={product.subcategory} onChange={handleChange} style={inputStyle}>
          <option value="">Select Type</option>
          <option value="t-shirt">T-Shirt</option>
          <option value="hoodies">Hoodies</option>
          <option value="sweatshirt">Sweatshirt</option>
          <option value="long-sleeves">Long Sleeves</option>
          <option value="round-neck">Round Neck</option>
          <option value="v-neck">V Neck</option>
          <option value="polo-shirt">Polo Shirt</option>
        </select>
        {fieldErrors.subcategory && <div style={errorFieldStyle}>{fieldErrors.subcategory}</div>}

        <select name="fabric" value={product.fabric} onChange={handleChange} style={inputStyle}>
          <option value="">Select Fabric</option>
          <option value="Cotton">Cotton</option>
          <option value="Polyester">Polyester</option>
          <option value="Silk">Silk</option>
          <option value="Tri-Blend">Tri-Blend</option>
          <option value="Viscose">Viscose</option>
        </select>
        {fieldErrors.fabric && <div style={errorFieldStyle}>{fieldErrors.fabric}</div>}

        {/* GENERAL IMAGES */}
        <h3 style={sectionHeadingStyle}>🖼️ General Images (Fallback)</h3>
        
        <label style={{ fontWeight: "bold" }}>📷 Front Image</label>
        <input type="file" accept="image/*,.svg" onChange={(e) => handleFileUpload(e, "frontImage")} style={inputStyle} />
        {fieldErrors.frontImage && <div style={errorFieldStyle}>{fieldErrors.frontImage}</div>}
        {product.frontImage && <img src={product.frontImage} alt="Front" style={previewStyle} />}

        <label style={{ fontWeight: "bold", marginTop: "10px" }}>📷 Back Image</label>
        <input type="file" accept="image/*,.svg" onChange={(e) => handleFileUpload(e, "backImage")} style={inputStyle} />
        {fieldErrors.backImage && <div style={errorFieldStyle}>{fieldErrors.backImage}</div>}
        {product.backImage && <img src={product.backImage} alt="Back" style={previewStyle} />}

        {/* COLOR VARIANTS */}
        <h3 style={sectionHeadingStyle}>🎨 Available Colors (with Images)</h3>
        {fieldErrors.colorVariants && <div style={errorFieldStyle}>{fieldErrors.colorVariants}</div>}
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "10px" }}>
          {COLOR_OPTIONS.map((color) => (
            <label key={color.name} style={colorCheckboxStyle}>
              <input
                type="checkbox"
                checked={product.colors.includes(color.name)}
                onChange={() => handleColorToggle(color.name, color.code)}
              />
              <span style={{
                display: "inline-block",
                width: "20px",
                height: "20px",
                backgroundColor: color.code,
                border: "2px solid #ccc",
                borderRadius: "3px",
                marginRight: "8px",
                verticalAlign: "middle",
              }}></span>
              <span>{color.name}</span>
            </label>
          ))}
        </div>

        {/* COLOR IMAGE UPLOAD SECTION - BELOW GRID */}
        {product.colors.length > 0 && (
          <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
            <h4 style={{ margin: "0 0 15px 0", color: "#333", fontSize: "14px", fontWeight: "bold" }}>📸 Upload Images for Selected Colors</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {product.colors.map((colorName) => {
                const colorObj = COLOR_OPTIONS.find(c => c.name === colorName);
                return (
                  <div key={colorName} style={colorVariantCardStyle}>
                    <button
                      type="button"
                      onClick={() => setExpandedColors({...expandedColors, [colorName]: !expandedColors[colorName]})}
                      style={{
                        ...colorUploadToggleStyle,
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        justifyContent: "space-between"
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          display: "inline-block",
                          width: "24px",
                          height: "24px",
                          backgroundColor: colorObj.code,
                          border: "2px solid #0b84ff",
                          borderRadius: "4px",
                        }}></span>
                        {colorName}
                      </span>
                      <span>{expandedColors[colorName] ? "▼" : "►"}</span>
                    </button>

                    {expandedColors[colorName] && (
                      <div style={colorImagesContainerStyle}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <label style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#333" }}>📷 Front Image</label>
                          <input
                            type="file"
                            accept="image/*,.svg"
                            onChange={(e) => handleColorImageUpload(e, colorName, "front")}
                            style={miniInputStyle}
                          />
                          {fieldErrors[`${colorName}_front`] && <div style={errorFieldStyle}>{fieldErrors[`${colorName}_front`]}</div>}
                          {product.colorVariants.find(v => v.colorName === colorName)?.frontImage && (
                            <img 
                              src={product.colorVariants.find(v => v.colorName === colorName).frontImage} 
                              alt={`${colorName} Front`}
                              style={miniPreviewStyle}
                            />
                          )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <label style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#333" }}>📷 Back Image</label>
                          <input
                            type="file"
                            accept="image/*,.svg"
                            onChange={(e) => handleColorImageUpload(e, colorName, "back")}
                            style={miniInputStyle}
                          />
                          {fieldErrors[`${colorName}_back`] && <div style={errorFieldStyle}>{fieldErrors[`${colorName}_back`]}</div>}
                          {product.colorVariants.find(v => v.colorName === colorName)?.backImage && (
                            <img 
                              src={product.colorVariants.find(v => v.colorName === colorName).backImage} 
                              alt={`${colorName} Back`}
                              style={miniPreviewStyle}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button type="submit" style={loading ? submitBtnStyle_disabled : submitBtnStyle} disabled={loading}>
          {loading ? "⏳ Adding Product..." : "✅ Add Product"}
        </button>
      </form>
    </div>
  );
};

/* ===== STYLES ===== */
const pageStyle = {
  padding: "20px",
  maxWidth: "900px",
  margin: "30px auto",
  backgroundColor: "#f9f9f9",
  borderRadius: "10px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "15px",
};

const sectionHeadingStyle = {
  marginBottom: "10px",
  marginTop: "20px",
  color: "#333",
  fontSize: "16px",
  fontWeight: "bold",
  borderBottom: "2px solid #0b84ff",
  paddingBottom: "8px",
};

const inputStyle = {
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "5px",
  fontSize: "14px",
  fontFamily: "Arial, sans-serif",
};

const miniInputStyle = {
  ...inputStyle,
  fontSize: "12px",
  marginTop: "5px",
};

const colorCheckboxStyle = {
  display: "flex",
  alignItems: "center",
  padding: "8px",
  cursor: "pointer",
  fontSize: "13px",
  borderRadius: "5px",
  border: "1px solid #ddd",
  backgroundColor: "#fff",
};

const colorVariantCardStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  padding: "12px",
  backgroundColor: "#fff",
  border: "1px solid #e0e0e0",
  borderRadius: "6px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const colorImageUploadStyle = {
  marginTop: "8px",
  paddingLeft: "12px",
  borderLeft: "3px solid #0b84ff",
};

const colorUploadToggleStyle = {
  padding: "6px 12px",
  fontSize: "12px",
  backgroundColor: "#e3f2fd",
  color: "#0b84ff",
  border: "1px solid #0b84ff",
  borderRadius: "3px",
  cursor: "pointer",
  fontWeight: "bold",
};

const colorImagesContainerStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginTop: "8px",
  padding: "10px",
  backgroundColor: "#f5f5f5",
  borderRadius: "5px",
};

const previewStyle = {
  width: "100%",
  height: "200px",
  objectFit: "cover",
  borderRadius: "5px",
  marginTop: "10px",
  border: "1px solid #ddd",
};

const miniPreviewStyle = {
  width: "100%",
  height: "100px",
  objectFit: "cover",
  borderRadius: "3px",
  marginTop: "6px",
  border: "1px solid #ddd",
};

const submitBtnStyle = {
  padding: "12px",
  backgroundColor: "#0b84ff",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  borderRadius: "5px",
  fontWeight: "bold",
  marginTop: "20px",
  fontSize: "16px",
};

const submitBtnStyle_disabled = {
  ...submitBtnStyle,
  backgroundColor: "#888",
  cursor: "not-allowed",
  opacity: 0.6,
};

const errorStyle = {
  backgroundColor: "#ffebee",
  color: "#c62828",
  padding: "12px",
  borderRadius: "5px",
  marginBottom: "15px",
  border: "1px solid #ef5350",
  fontSize: "14px",
};

const errorFieldStyle = {
  color: "#b00020",
  fontSize: "12px",
  marginTop: "6px",
};

export default AddProduct;
