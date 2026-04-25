import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaUserCircle, FaChevronDown } from "react-icons/fa";
import { ShoppingCart, LogOut, LogIn, UserPlus, Heart, Settings, Package, HelpCircle, MapPin, Home, Info, Mail, Palette } from 'lucide-react';
import { useAuth } from "../context/AuthContext";

// Import the NG logo
const NGLogo = () => (
  <svg width="85" height="85" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 2px 8px rgba(11, 132, 255, 0.3))" }}>
    {/* Circle Border */}
    <circle cx="140" cy="140" r="130" stroke="#000000" strokeWidth="10" fill="white"/>
    
    {/* N - Black */}
    <g>
      <rect x="90" y="95" width="28" height="100" fill="#000000"/>
      <polygon points="118,95 165,95 118,195" fill="#000000"/>
      <rect x="160" y="95" width="28" height="100" fill="#000000"/>
    </g>
    
    {/* G - Gold */}
    <g>
      <path d="M 215 105 Q 245 105 245 145 Q 245 185 215 185 Q 190 185 185 165 L 210 165 Q 215 180 215 180 Q 230 180 230 145 Q 230 120 215 120 Q 200 120 200 145 L 200 165 L 175 165 Q 175 120 215 120" fill="#C9A227" stroke="#C9A227" strokeWidth="3"/>
    </g>
  </svg>
);

const Header = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Admin login status
  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdminLoggedIn") === "true";
    setIsAdmin(adminStatus);

    const handleStorageChange = () => {
      setIsAdmin(localStorage.getItem("isAdminLoggedIn") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Admin logout
  const handleAdminLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    setIsAdmin(false);
    window.dispatchEvent(new Event("storage"));
    navigate("/");
  };

  // Customer logout
  const handleCustomerLogout = () => {
    // Clear user-specific cart before logout
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user._id) {
      localStorage.removeItem(`cart_${user._id}`);
    }
    
    // Clear token
    localStorage.removeItem("token");
    
    // Call AuthContext logout to update user state and localStorage
    logout();
    
    setShowProfileDropdown(false);
    window.dispatchEvent(new Event("storage"));
    alert("Logout successfully!");
    navigate("/");
  };

  return (
    <header style={headerStyle}>
      {/* Left: Logo and Brand */}
      <div style={brandContainerStyle} onClick={() => navigate("/")}>
        <NGLogo />
        <div style={brandTextStyle}>
          <div style={brandNameStyle}>NextGen</div>
          <div style={brandSubtextStyle}>Apparel Studio</div>
        </div>
      </div>

      {/* Center: Navigation Menu */}
      <nav style={navContainerStyle}>
        <button 
          style={navBtnStyle} 
          onClick={() => navigate("/")}
          title="Home"
          onMouseEnter={(e) => e.target.style.color = "#0b84ff"}
          onMouseLeave={(e) => e.target.style.color = "#fff"}
        >
          <Home size={20} />
          <span style={navBtnTextStyle}>Home</span>
        </button>
        
        <button 
          style={navBtnStyle} 
          onClick={() => navigate("/products")}
          title="Products"
          onMouseEnter={(e) => e.target.style.color = "#0b84ff"}
          onMouseLeave={(e) => e.target.style.color = "#fff"}
        >
          <Palette size={20} />
          <span style={navBtnTextStyle}>Products</span>
        </button>

        <button 
          style={navBtnStyle} 
          onClick={() => navigate("/about")}
          title="About Us"
          onMouseEnter={(e) => e.target.style.color = "#0b84ff"}
          onMouseLeave={(e) => e.target.style.color = "#fff"}
        >
          <Info size={20} />
          <span style={navBtnTextStyle}>About</span>
        </button>

        <button 
          style={navBtnStyle} 
          onClick={() => navigate("/contact")}
          title="Contact"
          onMouseEnter={(e) => e.target.style.color = "#0b84ff"}
          onMouseLeave={(e) => e.target.style.color = "#fff"}
        >
          <Mail size={20} />
          <span style={navBtnTextStyle}>Contact</span>
        </button>
        {/* Cart button - hide for admin */}
        {!isAdmin && (
          <button 
            style={cartBtnStyle}
            onClick={() => navigate("/cart")}
            title="Shopping Cart"
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#0b84ff";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.transform = "scale(1)";
            }}
          >
            <ShoppingCart size={22} />
          </button>
        )}

        {/* Admin Panel */}
        {isAdmin && (
          <>
            <button 
              style={adminNavBtnStyle}
              onClick={() => navigate('/admin/orders')}
              title="Orders"
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#0b84ff";
                e.target.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#ff6b00";
                e.target.style.transform = "scale(1)";
              }}
            >
              <Package size={20} />
              <span style={navBtnTextStyle}>Orders</span>
            </button>
            <button 
              style={adminLogoutBtnStyle}
              onClick={handleAdminLogout}
              title="Admin Logout"
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#c82333";
                e.target.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#dc3545";
                e.target.style.transform = "scale(1)";
              }}
            >
              <LogOut size={20} />
            </button>
          </>
        )}

        {/* Professional Account Dropdown */}
        <div style={profileContainerStyle}>
          <div
            style={profileBtnStyle}
            onMouseEnter={() => setShowProfileDropdown(true)}
            onMouseLeave={() => setShowProfileDropdown(false)}
            title="Account Menu"
          >
            <FaUserCircle size={24} />
            <FaChevronDown size={12} style={{ marginLeft: "5px" }} />
          </div>
          
          {showProfileDropdown && (
            <div 
              style={dropdownStyle}
              onMouseEnter={() => setShowProfileDropdown(true)}
              onMouseLeave={() => setShowProfileDropdown(false)}
            >
              {/* If user is logged in */}
              {user && user.name ? (
                <>
                  {/* User Profile Header */}
                  <div style={userProfileHeaderStyle}>
                    <FaUserCircle size={48} style={{ color: "#0b84ff" }} />
                    <div style={userHeaderTextStyle}>
                      <div style={userNameStyle}>{user.name}</div>
                      <div style={userEmailStyle}>{user.email || "customer@apparel.com"}</div>
                      <div style={userStatusStyle}>Premium Member</div>
                    </div>
                  </div>
                  
                  <div style={dividerStyle}></div>
                  
                  {/* Main Options */}
                  <button
                    style={dropdownOptionStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "#fff"}
                    onClick={() => {
                      navigate("/cart");
                      setShowProfileDropdown(false);
                    }}
                  >
                    <ShoppingCart size={18} style={{ marginRight: "10px" }} />
                    My Cart
                  </button>
                  
                  <button
                    style={dropdownOptionStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "#fff"}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      alert("Order tracking coming soon!");
                    }}
                  >
                    <Package size={18} style={{ marginRight: "10px" }} />
                    My Orders
                  </button>
                  
                  <button
                    style={dropdownOptionStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "#fff"}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      alert("Wishlist feature coming soon!");
                    }}
                  >
                    <Heart size={18} style={{ marginRight: "10px" }} />
                    Wishlist
                  </button>
                  
                  <button
                    style={dropdownOptionStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "#fff"}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      alert("Address settings coming soon!");
                    }}
                  >
                    <MapPin size={18} style={{ marginRight: "10px" }} />
                    Delivery Address
                  </button>
                  
                  <div style={dividerStyle}></div>
                  
                  {/* Settings & Support */}
                  <button
                    style={dropdownOptionStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "#fff"}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      alert("Account settings coming soon!");
                    }}
                  >
                    <Settings size={18} style={{ marginRight: "10px" }} />
                    Settings
                  </button>
                  
                  <button
                    style={dropdownOptionStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "#fff"}
                    onClick={() => {
                      navigate("/contact");
                      setShowProfileDropdown(false);
                    }}
                  >
                    <HelpCircle size={18} style={{ marginRight: "10px" }} />
                    Help & Support
                  </button>
                  
                  <div style={dividerStyle}></div>
                  
                  {/* Logout */}
                  <button
                    style={dropdownLogoutStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#c82333"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "#dc3545"}
                    onClick={handleCustomerLogout}
                  >
                    <LogOut size={18} style={{ marginRight: "10px" }} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  {/* Not Logged In State */}
                  <div style={notLoggedInHeaderStyle}>
                    <FaUserCircle size={56} style={{ color: "#ccc" }} />
                    <div style={notLoggedTextStyle}>Welcome to NextGen</div>
                    <div style={notLoggedSubtextStyle}>Sign in to your account</div>
                  </div>
                  
                  <div style={dividerStyle}></div>
                  
                  {/* Login & Signup Buttons */}
                  <button
                    style={dropdownLoginStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#1e7e34"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "#28a745"}
                    onClick={() => {
                      navigate("/login");
                      setShowProfileDropdown(false);
                    }}
                  >
                    <LogIn size={18} style={{ marginRight: "10px" }} />
                    Login
                  </button>
                  
                  <button
                    style={dropdownSignupStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#0056b3"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "#0b84ff"}
                    onClick={() => {
                      navigate("/signup");
                      setShowProfileDropdown(false);
                    }}
                  >
                    <UserPlus size={18} style={{ marginRight: "10px" }} />
                    Create Account
                  </button>
                  
                  <div style={dividerStyle}></div>
                  
                  {/* Help for guests */}
                  <button
                    style={dropdownOptionStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "#fff"}
                    onClick={() => {
                      navigate("/contact");
                      setShowProfileDropdown(false);
                    }}
                  >
                    <HelpCircle size={18} style={{ marginRight: "10px" }} />
                    Help & Support
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

/* ===== MODERN HEADER STYLES ===== */
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 30px",
  backgroundColor: "#0a0e27",
  color: "#fff",
  boxShadow: "0 4px 20px rgba(11, 132, 255, 0.15)",
  borderBottom: "2px solid rgba(11, 132, 255, 0.2)",
  minHeight: "75px",
};

/* Brand Section */
const brandContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  cursor: "pointer",
  transition: "all 0.3s ease",
  padding: "8px 16px",
  borderRadius: "8px",
  minWidth: "auto",
};

const ngLogoStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "56px",
  height: "56px",
};

const brandTextStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "2px",
};

const brandNameStyle = {
  fontSize: "26px",
  fontWeight: "900",
  color: "#0b84ff",
  letterSpacing: "-0.5px",
  lineHeight: "1.2",
};

const brandSubtextStyle = {
  fontSize: "13px",
  color: "#888",
  fontWeight: "700",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  lineHeight: "1",
};

/* Navigation Container */
const navContainerStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
};

const navBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "11px 16px",
  backgroundColor: "transparent",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "16px",
  transition: "all 0.3s ease",
  whiteSpace: "nowrap",
};

const navBtnTextStyle = {
  display: "inline",
  fontWeight: "600",
};

const cartBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "11px 15px",
  backgroundColor: "transparent",
  color: "#0b84ff",
  border: "2px solid #0b84ff",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.3s ease",
  fontWeight: "700",
  fontSize: "16px",
};

const adminNavBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "11px 16px",
  backgroundColor: "#ff6b00",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "16px",
  transition: "all 0.3s ease",
  whiteSpace: "nowrap",
};

const adminLogoutBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "11px 15px",
  backgroundColor: "#dc3545",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "all 0.3s ease",
  fontWeight: "700",
  fontSize: "16px",
};

const profileContainerStyle = {
  position: "relative",
  display: "inline-block",
};

const profileBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "11px 16px",
  backgroundColor: "#0b84ff",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "16px",
  transition: "all 0.3s ease",
};

const dropdownStyle = {
  position: "absolute",
  top: "50px",
  right: "0",
  backgroundColor: "#fff",
  border: "2px solid rgba(11, 132, 255, 0.1)",
  borderRadius: "10px",
  boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
  zIndex: 100,
  minWidth: "340px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  maxHeight: "80vh",
};

const userProfileHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "18px",
  backgroundColor: "#f0f7ff",
  borderBottom: "2px solid #e0e0e0",
};

const userHeaderTextStyle = {
  flex: 1,
};

const userProfileSection = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px",
  backgroundColor: "#f8f9fa",
};

const userInfoStyle = {
  padding: "12px 16px",
  backgroundColor: "#f8f9fa",
};

const userNameStyle = {
  fontSize: "18px",
  fontWeight: "800",
  color: "#000",
  marginBottom: "4px",
  letterSpacing: "-0.3px",
};

const userEmailStyle = {
  fontSize: "14px",
  color: "#666",
  marginBottom: "2px",
  fontWeight: "500",
};

const userStatusStyle = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#0b84ff",
  marginTop: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
};

const notLoggedInStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  padding: "20px 16px",
  backgroundColor: "#f8f9fa",
};

const notLoggedInHeaderStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  padding: "24px 16px",
  backgroundColor: "#f0f7ff",
  borderBottom: "1px solid #e0e0e0",
};

const notLoggedTextStyle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#333",
  marginTop: "8px",
};

const notLoggedSubtextStyle = {
  fontSize: "12px",
  color: "#999",
};

const dividerStyle = {
  height: "1px",
  backgroundColor: "#e0e0e0",
  margin: "0",
};

const dropdownOptionStyle = {
  width: "100%",
  padding: "14px 18px",
  backgroundColor: "#fff",
  color: "#333",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "15px",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  borderBottom: "1px solid #f5f5f5",
  lineHeight: "1.4",
};

const dropdownBtnStyle = {
  width: "100%",
  padding: "14px 18px",
  backgroundColor: "#fff",
  color: "#333",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "15px",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
};

const dropdownLoginStyle = {
  ...dropdownBtnStyle,
  backgroundColor: "#28a745",
  color: "#fff",
  border: "none",
  justifyContent: "center",
  marginBottom: "8px",
  fontWeight: "700",
  fontSize: "15px",
};

const dropdownSignupStyle = {
  ...dropdownBtnStyle,
  backgroundColor: "#0b84ff",
  color: "#fff",
  border: "none",
  justifyContent: "center",
  marginBottom: "0",
  fontWeight: "700",
  fontSize: "15px",
};

const dropdownLogoutStyle = {
  ...dropdownBtnStyle,
  backgroundColor: "#dc3545",
  color: "#fff",
  border: "none",
  justifyContent: "center",
  fontWeight: "700",
  fontSize: "15px",
};

export default Header;
