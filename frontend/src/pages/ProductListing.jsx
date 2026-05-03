import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import menCollectionHoodie from '../assets/men-collection-hoodie.jpeg';
import womenCollectionHoodie from '../assets/women-collection-hoodie.jpeg';
import kidsCollectionHoodie from '../assets/kids-collection-hoodie.jpeg';
import MtshirtThumbnail from '../assets/Male/Mt-shirt-thumbnail.jpeg';
import MhoodiesThumbnail from '../assets/Male/Mhoodies-thumbnail.jpeg';
import MsweatshirtThumbnail from '../assets/Male/Msweatshirt-thumbnail.jpeg';
import MlongSleevesThumbnail from '../assets/Male/Mlong-sleeves-thumbnail.jpeg';
import MroundNeckThumbnail from '../assets/Male/Mround-neck-thumbnail.jpeg';
import MvNeckThumbnail from '../assets/Male/Mv-neck-thumbnail.jpeg';
import MpoloShirtThumbnail from '../assets/Male/Mpolo-shirt-thumbnail.jpeg';

// Female category thumbnails
import FMtshirtThumbnail from '../assets/Female/FMt-shirt-thumbnail.jpeg';
import FMhoodiesThumbnail from '../assets/Female/FMhoodies-thumbnail.jpeg';
import FMsweatshirtThumbnail from '../assets/Female/FMsweatshirt-thumbnail.jpeg';
import FMlongSleevesThumbnail from '../assets/Female/FMlong-sleeves-thumbnail.jpeg';
import FMroundNeckThumbnail from '../assets/Female/FMround-neck-thumbnail.jpeg';
import FMvNeckThumbnail from '../assets/Female/FMv-neck-thumbnail.jpeg';
import FMpoloShirtThumbnail from '../assets/Female/FMpolo-shirt-thumbnail.jpeg';

// Kids category thumbnails
import KtshirtThumbnail from '../assets/Kids/Kt-shirt-thumbnail.jpeg';
import KhoodiesThumbnail from '../assets/Kids/Khoodies-thumbnail.jpeg';
import KsweatshirtThumbnail from '../assets/Kids/Ksweatshirt-thumbnail.jpeg';
import KlongSleevesThumbnail from '../assets/Kids/Klong-sleeves-thumbnail.jpeg';
import KroundNeckThumbnail from '../assets/Kids/Kround-neck-thumbnail.jpeg';
import KvNeckThumbnail from '../assets/Kids/Kv-neck-thumbnail.jpeg';
import KpoloShirtThumbnail from '../assets/Kids/Kpolo-shirt-thumbnail.jpeg';

// Hero section images
import hero1 from '../assets/hero/hero(1).png';
import hero2 from '../assets/hero/hero(2).png';
import hero3 from '../assets/hero/hero(3).png';
import hero4 from '../assets/hero/hero(4).png';

function ProductListing() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const productSectionRef = useRef(null);
  const observerTarget = useRef(null);
  const { addToCart } = useCart();
  const { user } = useAuth();

  const ITEMS_PER_PAGE = 12;

  // Add CSS keyframes for animation
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      .carousel-image {
        animation: fadeInOut 0.6s ease-in-out;
      }
      .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #0b84ff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Hero carousel images
  const heroImages = [
    hero1,
    hero2,
    hero3,
    hero4,
  ];

  const subcategories = [
    "t-shirt",
    "hoodies",
    "sweatshirt",
    "long-sleeves",
    "round-neck",
    "v-neck",
    "polo-shirt",
  ];

  const categories = [
    { name: "All", key: "all" },
    { name: "Men", key: "men" },
    { name: "Women", key: "women" },
    { name: "Kids", key: "kids" },
  ];

  // Thumbnail images mapping for Men category
  const menThumbnails = {
    "t-shirt": MtshirtThumbnail,
    "hoodies": MhoodiesThumbnail,
    "sweatshirt": MsweatshirtThumbnail,
    "long-sleeves": MlongSleevesThumbnail,
    "round-neck": MroundNeckThumbnail,
    "v-neck": MvNeckThumbnail,
    "polo-shirt": MpoloShirtThumbnail,
  };

  // Thumbnail images mapping for Women category
  const womenThumbnails = {
    "t-shirt": FMtshirtThumbnail,
    "hoodies": FMhoodiesThumbnail,
    "sweatshirt": FMsweatshirtThumbnail,
    "long-sleeves": FMlongSleevesThumbnail,
    "round-neck": FMroundNeckThumbnail,
    "v-neck": FMvNeckThumbnail,
    "polo-shirt": FMpoloShirtThumbnail,
  };

  // Thumbnail images mapping for Kids category
  const kidsThumbnails = {
    "t-shirt": KtshirtThumbnail,
    "hoodies": KhoodiesThumbnail,
    "sweatshirt": KsweatshirtThumbnail,
    "long-sleeves": KlongSleevesThumbnail,
    "round-neck": KroundNeckThumbnail,
    "v-neck": KvNeckThumbnail,
    "polo-shirt": KpoloShirtThumbnail,
  };

  // ✅ Check admin login status on load
  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdminLoggedIn") === "true";
    setIsAdmin(adminStatus);

    // Listen for storage changes
    const handleStorageChange = () => {
      const status = localStorage.getItem("isAdminLoggedIn") === "true";
      setIsAdmin(status);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Auto-rotate hero carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(interval);
  }, []);

  // Carousel navigation
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  // ✅ OPTIMIZED: Fetch products with caching and pagination
  const fetchProducts = async (page = 1) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      // Fetch from API with pagination
      const response = await fetch(
        `http://localhost:5000/api/products/list?page=${page}&limit=${ITEMS_PER_PAGE}`
      );
      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      const newProducts = data.products;

      if (page === 1) {
        setProducts(newProducts);
        // Cache first page
        if (newProducts.length > 0) {
          localStorage.setItem("productsCache", JSON.stringify(newProducts));
          localStorage.setItem("productsCache_time", String(Date.now()));
        }
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
      }

      setHasMore(data.hasMore || false);
      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Backend not running or error fetching products");
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // ✅ Fetch initial products on mount
  useEffect(() => {
    fetchProducts(1);
  }, []);

  // ✅ Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current) return;
    
    const handleIntersection = (entries) => {
      if (
        entries[0].isIntersecting &&
        hasMore &&
        !loadingMore &&
        !loading
      ) {
        setCurrentPage((prev) => {
          fetchProducts(prev + 1);
          return prev + 1;
        });
      }
    };

    const observer = new IntersectionObserver(handleIntersection, { threshold: 0.1 });
    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchProducts]);

  // Delete product
  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`http://localhost:5000/api/products/${id}`, { method: "DELETE" });
      setProducts(products.filter((p) => p._id !== id));
      // Clear cache
      localStorage.removeItem("productsCache");
      localStorage.removeItem("productsCache_time");
    } catch {
      alert("Delete failed");
    }
  };

  // Filtered products
  const filteredProducts =
    filter === "all"
      ? products.filter(
          (p) =>
            subcategoryFilter === "all" ||
            p.subcategory?.toLowerCase() === subcategoryFilter.toLowerCase()
        )
      : products.filter(
          (p) =>
            p.category?.toLowerCase() === filter.toLowerCase() &&
            (subcategoryFilter === "all" ||
              p.subcategory?.toLowerCase() === subcategoryFilter.toLowerCase())
        );

  if (loading) return <h2 style={{ textAlign: "center" }}>Loading products...</h2>;
  if (error) return <h2 style={{ textAlign: "center", color: "red" }}>{error}</h2>;

  return (
    <div style={{ padding: "0" }}>
      {/* CATEGORY FILTER SECTION */}
      <div style={filterSectionStyle}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", fontSize: "24px", fontWeight: "bold", color: "#0a0e27" }}>
          Browse Collections
        </h2>

        {/* Main Category Buttons */}
        <div style={filterBtnContainer}>
          {categories.map((cat) => (
            <div key={cat.key} style={{ position: "relative" }}>
              <button
                style={
                  filter === cat.key
                    ? { ...filterBtnStyle, backgroundColor: "#0b84ff", color: "#fff", boxShadow: "0 4px 12px rgba(11, 132, 255, 0.3)" }
                    : filterBtnStyle
                }
                onClick={() => {
                  setFilter(cat.key);
                  setSubcategoryFilter("all");
                  setExpandedCategory(
                    expandedCategory === cat.key ? null : cat.key
                  );
                  // ✅ Scroll to products section
                  setTimeout(() => {
                    productSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              >
                {cat.name}
                {cat.key !== "all" && expandedCategory === cat.key
                  ? " ▼"
                  : cat.key !== "all"
                  ? " ▶"
                  : ""}
              </button>

              {/* Subcategory Dropdown */}
              {expandedCategory === cat.key && cat.key !== "all" && (
                <div style={subcategoryDropdown}>
                  <button
                    style={{
                      ...subcategoryBtnStyle,
                      backgroundColor:
                        subcategoryFilter === "all" ? "#0b84ff" : "#f0f7ff",
                      color: subcategoryFilter === "all" ? "#fff" : "#333",
                    }}
                    onClick={() => setSubcategoryFilter("all")}
                  >
                    All {cat.name}
                  </button>
                  {subcategories.map((subcat) => (
                    <button
                      key={subcat}
                      style={{
                        ...subcategoryBtnStyle,
                        backgroundColor:
                          subcategoryFilter === subcat ? "#0b84ff" : "#f0f7ff",
                        color: subcategoryFilter === subcat ? "#fff" : "#333",
                      }}
                      onClick={() => setSubcategoryFilter(subcat)}
                    >
                      {subcat
                        .split("-")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Show Add Product only if admin is logged in */}
          {isAdmin && (
            <button style={adminBtnStyle} onClick={() => navigate("/admin/add-product")}>
              + Add Product
            </button>
          )}
        </div>
      </div>

      {/* HERO CAROUSEL SECTION */}
      <div style={heroCarouselStyle}>
        {/* Left Arrow */}
        <button
          style={{ ...carouselArrowStyle, left: "20px" }}
          onClick={prevSlide}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#0b84ff";
            e.target.style.transform = "translateY(-50%) scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(11, 132, 255, 0.9)";
            e.target.style.transform = "translateY(-50%)";
          }}
        >
          <ChevronLeft size={40} />
        </button>

        {/* Carousel Image Container */}
        <div style={carouselImageContainerStyle}>
          <img
            key={currentSlide}
            src={heroImages[currentSlide]}
            alt={`Slide ${currentSlide + 1}`}
            className="carousel-image"
            style={carouselImageStyle}
          />
        </div>

        {/* Right Arrow */}
        <button
          style={{ ...carouselArrowStyle, right: "20px" }}
          onClick={nextSlide}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#0b84ff";
            e.target.style.transform = "translateY(-50%) scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(11, 132, 255, 0.9)";
            e.target.style.transform = "translateY(-50%)";
          }}
        >
          <ChevronRight size={40} />
        </button>

        {/* Dot Indicators */}
        <div style={carouselDotsStyle}>
          {heroImages.map((_, index) => (
            <button
              key={index}
              style={{
                ...carouselDotStyle,
                backgroundColor: index === currentSlide ? "#0b84ff" : "#ccc",
              }}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>

      {/* CATEGORY SECTIONS */}
      <div id="collections" style={{ padding: "0" }}>
        {/* MEN COLLECTION - NEW LAYOUT */}
        <div style={{ backgroundColor: "#1a1a1a" }}>
          <div style={categoryHeadingContainerStyle}>
            <h2 style={categoryMainHeadingStyle}>👔 Men Collection</h2>
          </div>
          
          <div style={categoryCollectionNewStyle}>
            <div style={categoryLeftSideStyle}>
              <img
                src={menCollectionHoodie}
                alt="Men Collection"
                style={categoryMainImageStyle}
              />
            </div>
            
            <div style={categoryRightSideStyle}>
              <h3 style={categoriesLabelStyle}>Categories</h3>
              <div style={categoryGridContainerStyle}>
                {subcategories.map((subcat) => {
                  const product = products.find(
                    p => p.category?.toLowerCase() === "men" && 
                    p.subcategory?.toLowerCase() === subcat.toLowerCase()
                  );
                  return (
                    <div
                      key={`men-${subcat}`}
                      style={categoryCardStyle}
                      onClick={() => {
                        setFilter("men");
                        setSubcategoryFilter(subcat);
                        productSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 12px 32px rgba(11, 132, 255, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                      }}
                    >
                      <img 
                        src={menThumbnails[subcat] || product?.frontImage || "https://via.placeholder.com/250x300?text=" + subcat}
                        alt={subcat}
                        style={categoryCardImageStyle}
                      />
                      <div style={categoryCardOverlayStyle}>
                        <span style={categoryCardLabelStyle}>
                          {subcat
                            .split("-")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* WOMEN COLLECTION - NEW LAYOUT */}
        <div style={{ backgroundColor: "#fff", borderTop: "1px solid #e0e0e0" }}>
          <div style={categoryHeadingContainerStyle}>
            <h2 style={categoryMainHeadingStyle}>👗 Women Collection</h2>
          </div>
          
          <div style={categoryCollectionNewStyle}>
            <div style={categoryLeftSideStyle}>
              <img 
                src={womenCollectionHoodie}
                alt="Women Collection"
                style={categoryMainImageStyle}
              />
            </div>
            
            <div style={categoryRightSideStyle}>
              <h3 style={categoriesLabelStyle}>Categories</h3>
              <div style={categoryGridContainerStyle}>
                {subcategories.map((subcat) => {
                  const product = products.find(
                    p => p.category?.toLowerCase() === "women" && 
                    p.subcategory?.toLowerCase() === subcat.toLowerCase()
                  );
                  return (
                    <div
                      key={`women-${subcat}`}
                      style={categoryCardStyle}
                      onClick={() => {
                        setFilter("women");
                        setSubcategoryFilter(subcat);
                        productSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 12px 32px rgba(11, 132, 255, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                      }}
                    >
                      <img 
                        src={womenThumbnails[subcat] || product?.frontImage || "https://via.placeholder.com/250x300?text=" + subcat}
                        alt={subcat}
                        style={categoryCardImageStyle}
                      />
                      <div style={categoryCardOverlayStyle}>
                        <span style={categoryCardLabelStyle}>
                          {subcat
                            .split("-")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* KIDS COLLECTION - NEW LAYOUT */}
        <div style={{ backgroundColor: "#fff", borderTop: "1px solid #e0e0e0" }}>
          <div style={categoryHeadingContainerStyle}>
            <h2 style={categoryMainHeadingStyle}>🧒 Kids Collection</h2>
          </div>
          
          <div style={categoryCollectionNewStyle}>
            <div style={categoryLeftSideStyle}>
              <img 
                src={kidsCollectionHoodie}
                alt="Kids Collection"
                style={categoryMainImageStyle}
              />
            </div>
            
            <div style={categoryRightSideStyle}>
              <h3 style={categoriesLabelStyle}>Categories</h3>
              <div style={categoryGridContainerStyle}>
                {subcategories.map((subcat) => {
                  const product = products.find(
                    p => p.category?.toLowerCase() === "kids" && 
                    p.subcategory?.toLowerCase() === subcat.toLowerCase()
                  );
                  return (
                    <div
                      key={`kids-${subcat}`}
                      style={categoryCardStyle}
                      onClick={() => {
                        setFilter("kids");
                        setSubcategoryFilter(subcat);
                        productSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 12px 32px rgba(11, 132, 255, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                      }}
                    >
                      <img 
                        src={kidsThumbnails[subcat] || product?.frontImage || "https://via.placeholder.com/250x300?text=" + subcat}
                        alt={subcat}
                        style={categoryCardImageStyle}
                      />
                      <div style={categoryCardOverlayStyle}>
                        <span style={categoryCardLabelStyle}>
                          {subcat
                            .split("-")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div ref={productSectionRef} style={{ padding: "30px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px", fontSize: "24px", fontWeight: "bold" }}>
          All Products
        </h2>
        <div style={gridStyle}>
          {filteredProducts.map((product) => (
            <div key={product._id} style={cardStyle}>
              <img
                src={product.frontImage || "https://via.placeholder.com/300"}
                alt={product.name}
                style={imageStyle}
                loading="lazy"
                onClick={() => navigate(`/product/${product._id}`)}
                className="cursor-pointer"
              />

              <h3 style={{cursor: "pointer"}} onClick={() => navigate(`/product/${product._id}`)}>{product.name}</h3>
              <p><strong>Price:</strong> Rs. {product.price}</p>
              <p><strong>Category:</strong> {product.category}</p>

              {/* Add to Cart & Customize (customer-only) - compact icon buttons with tooltips */}
              {!isAdmin && (
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: 10 }}>
                  <button
                    title="Add to cart"
                    aria-label="Add to cart"
                    style={{
                      backgroundColor: "#111",
                      color: "#fff",
                      border: "none",
                      padding: "8px",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        alert("Please login first to add products to cart!");
                        navigate("/login");
                        return;
                      }
                      addToCart(product, 1, null, null, 0);
                      alert(`${product.name} added to cart`);
                    }}
                  >
                    <ShoppingCart size={18} />
                  </button>

                  <button
                    title="Customize"
                    aria-label="Customize product"
                    style={{
                      backgroundColor: "#0b84ff",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        alert("Please login first to customize products!");
                        navigate("/login");
                        return;
                      }
                      navigate(`/customize/${product._id}`);
                    }}
                  >
                    <Edit3 size={18} />
                  </button>
                </div>
              )}

              {/* Edit & Delete buttons only for admin */}
              {isAdmin && (
                <div style={adminBtnContainerStyle}>
                  <button
                    style={editBtnStyle}
                    onClick={() => navigate(`/admin/edit-product/${product._id}`)}
                  >
                    Edit
                  </button>

                  <button
                    style={deleteBtnStyle}
                    onClick={() => handleDelete(product._id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ✅ INFINITE SCROLL OBSERVER */}
        <div
          ref={observerTarget}
          style={{
            textAlign: "center",
            padding: "40px 20px",
            display: loadingMore ? "block" : "none",
          }}
        >
          <div className="loading-spinner"></div>
          <p style={{ marginTop: "10px", color: "#666" }}>Loading more products...</p>
        </div>

        {/* No more products message */}
        {!hasMore && filteredProducts.length > 0 && (
          <p style={{ textAlign: "center", color: "#999", padding: "20px" }}>
            ✓ All products loaded
          </p>
        )}
      </div>
    </div>
  );
}

/* ===== STYLES ===== */
const filterSectionStyle = {
  display: "flex", 
  flexDirection: "column", 
  gap: "15px", 
  marginBottom: "20px", 
  padding: "30px 30px 20px 30px",
  backgroundColor: "#f8f9fa",
  borderBottom: "2px solid rgba(11, 132, 255, 0.1)",
};
const filterBtnContainer = { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "10px", position: "relative" };
const filterBtnStyle = { backgroundColor: "#fff", color: "#0a0e27", fontWeight: "bold", border: "2px solid #ddd", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease" };
const subcategoryDropdown = {
  position: "absolute",
  top: "100%",
  left: "0",
  backgroundColor: "#fff",
  border: "2px solid #0b84ff",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  zIndex: 100,
  minWidth: "160px",
  marginTop: "8px",
  boxShadow: "0 8px 20px rgba(11, 132, 255, 0.2)",
};
const subcategoryBtnStyle = {
  backgroundColor: "#f0f7ff",
  color: "#333",
  border: "none",
  padding: "12px 16px",
  cursor: "pointer",
  textAlign: "left",
  fontSize: "14px",
  fontWeight: "500",
  borderBottom: "1px solid #e0e0e0",
  transition: "all 0.2s ease",
};
const adminBtnStyle = { backgroundColor: "#ff6b00", color: "#fff", fontWeight: "bold", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease" };

/* ===== HERO CAROUSEL STYLES ===== */
const heroCarouselStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "650px",
  backgroundColor: "#000",
  overflow: "hidden",
  margin: "0",
  padding: "0",
};

const carouselImageContainerStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const carouselImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  animation: "fadeInOut 0.6s ease-in-out",
  display: "block",
};

const carouselArrowStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 10,
  backgroundColor: "rgba(11, 132, 255, 0.9)",
  color: "#fff",
  border: "none",
  padding: "16px 20px",
  borderRadius: "50%",
  cursor: "pointer",
  transition: "all 0.3s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
};

const carouselDotsStyle = {
  position: "absolute",
  bottom: "30px",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: "14px",
  zIndex: 10,
  backgroundColor: "rgba(0,0,0,0.4)",
  padding: "12px 20px",
  borderRadius: "50px",
};

const carouselDotStyle = {
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  border: "none",
  cursor: "pointer",
  transition: "all 0.3s ease",
  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
};

/* ===== CATEGORY SECTIONS STYLES ===== */
const categoryCollectionStyle = {
  marginBottom: "60px",
};

/* NEW CATEGORY COLLECTION LAYOUT */
const categoryCollectionNewStyle = {
  display: "flex",
  gap: "0",
  marginBottom: "0",
  minHeight: "550px",
  backgroundColor: "#fff",
};

const categoryHeadingContainerStyle = {
  padding: "30px 40px",
  backgroundColor: "#f8f9fa",
  borderBottom: "2px solid #e0e0e0",
};

const categoryMainHeadingStyle = {
  fontSize: "28px",
  fontWeight: "900",
  color: "#0a0e27",
  margin: "0",
  letterSpacing: "-0.5px",
};

const categoryLeftSideStyle = {
  flex: "0 0 40%",
  display: "flex",
  flexDirection: "column",
  padding: "40px 30px",
  backgroundColor: "#f8f9fa",
  justifyContent: "center",
  alignItems: "center",
};

const categoryMainImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "8px",
  border: "4px solid #0b84ff",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
};

const categoryRightSideStyle = {
  flex: "0 0 60%",
  display: "flex",
  flexDirection: "column",
  padding: "40px 30px",
  justifyContent: "flex-start",
  alignItems: "center",
  backgroundColor: "#fff",
};

const categoriesLabelStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#0a0e27",
  marginBottom: "20px",
  margin: "0 0 20px 0",
  alignSelf: "flex-start",
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "#f0f7ff",
  borderRadius: "6px",
  textAlign: "center",
};

const categoryGridContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "16px",
  width: "100%",
};

const categoryRowBtnStyle = {
  padding: "14px 22px",
  backgroundColor: "#f0f7ff",
  color: "#0a0e27",
  border: "2px solid #0b84ff",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "700",
  transition: "all 0.3s ease",
  flex: "0 1 calc(50% - 6px)",
  minWidth: "120px",
  textAlign: "center",
  boxShadow: "0 2px 8px rgba(11, 132, 255, 0.1)",
};

/* Category Card Styles for Product Images */
const categoryCardStyle = {
  position: "relative",
  width: "100%",
  height: "180px",
  cursor: "pointer",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
  transform: "scale(1)",
};

const categoryCardImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const categoryCardOverlayStyle = {
  position: "absolute",
  top: "0",
  left: "0",
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.3s ease",
};

const categoryCardLabelStyle = {
  fontSize: "16px",
  fontWeight: "800",
  color: "#fff",
  textAlign: "center",
  textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)",
  letterSpacing: "1px",
};

const categoryTitleStyle = {
  fontSize: "28px",
  fontWeight: "800",
  color: "#000",
  marginBottom: "30px",
  paddingBottom: "16px",
  borderBottom: "3px solid #0b84ff",
  display: "inline-block",
};

const subcategoryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "24px",
  marginBottom: "40px",
};

const subcategoryBoxStyle = {
  cursor: "pointer",
  transition: "all 0.3s ease",
  transform: "scale(1)",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
};

const subcategoryImageStyle = {
  width: "100%",
  height: "240px",
  objectFit: "cover",
  borderRadius: "12px 12px 0 0",
  transition: "transform 0.3s ease",
};

const subcategoryNameStyle = {
  padding: "12px 16px",
  backgroundColor: "#f8f9fa",
  textAlign: "center",
  fontSize: "14px",
  fontWeight: "700",
  color: "#333",
  margin: "0",
  borderRadius: "0 0 12px 12px",
};

/* ===== PRODUCTS GRID STYLES ===== */
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" };
const cardStyle = { border: "1px solid #ddd", borderRadius: "10px", padding: "15px", textAlign: "center", backgroundColor: "#fff" };
const imageStyle = { width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" };
const editBtnStyle = { backgroundColor: "#000", color: "#fff", border: "none", padding: "6px 12px", cursor: "pointer", borderRadius: "4px" };
const deleteBtnStyle = { backgroundColor: "crimson", color: "#fff", border: "none", padding: "6px 12px", cursor: "pointer", borderRadius: "4px" };
const adminBtnContainerStyle = { display: "flex", gap: "10px", justifyContent: "center", marginTop: "10px" };

export default ProductListing;
