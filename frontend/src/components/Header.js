import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaUserCircle, FaChevronDown } from "react-icons/fa";
import { ShoppingCart, LogOut, LogIn, UserPlus, Heart, Settings, Package, HelpCircle, MapPin, Home, Info, Mail, Palette } from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import ngLogo from "../assets/ng-logo.png";

const Header = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdminLoggedIn") === "true";
    setIsAdmin(adminStatus);
    const handleStorageChange = () => {
      setIsAdmin(localStorage.getItem("isAdminLoggedIn") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleAdminLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    setIsAdmin(false);
    window.dispatchEvent(new Event("storage"));
    navigate("/");
  };

  const handleCustomerLogout = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user._id) localStorage.removeItem(`cart_${user._id}`);
    localStorage.removeItem("token");
    logout();
    setShowProfileDropdown(false);
    window.dispatchEvent(new Event("storage"));
    alert("Logout successfully!");
    navigate("/");
  };

  return (
    <header style={headerStyle}>

      {/* LEFT — Nav Links */}
      <nav style={leftNavStyle}>
        {[
          { label: 'Home', icon: <Home size={16} />, path: '/' },
          { label: 'Products', icon: <Palette size={16} />, path: '/products' },
          { label: 'About', icon: <Info size={16} />, path: '/about' },
          { label: 'Contact', icon: <Mail size={16} />, path: '/contact' },
        ].map(({ label, icon, path }) => (
          <button
            key={label}
            style={navBtnStyle}
            onClick={() => navigate(path)}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#c9a84c';
              e.currentTarget.style.background = 'rgba(201,168,76,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#cbd5e1';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}

        {/* Admin buttons — left side when admin */}
        {isAdmin && (
          <>
            <button
              style={adminNavBtnStyle}
              onClick={() => navigate('/admin/orders')}
              onMouseEnter={e => e.currentTarget.style.background = '#d45f00'}
              onMouseLeave={e => e.currentTarget.style.background = '#ff6b00'}
            >
              <Package size={16} />
              <span>Orders</span>
            </button>
            <button
              style={adminLogoutBtnStyle}
              onClick={handleAdminLogout}
              onMouseEnter={e => e.currentTarget.style.background = '#c82333'}
              onMouseLeave={e => e.currentTarget.style.background = '#dc3545'}
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </nav>

      {/* CENTER — Logo */}
      <div style={brandContainerStyle} onClick={() => navigate("/")}>
        <div style={logoWrapStyle}>
          <img
            src={ngLogo}
            alt="NextGen Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
              filter: 'invert(1)',
            }}
          />
        </div>
        <div style={brandTextStyle}>
          <div style={brandNameStyle}>NextGen</div>
          <div style={brandSubtextStyle}>Apparel Studio</div>
        </div>
      </div>

      {/* RIGHT — Cart + Profile */}
      <div style={rightActionsStyle}>

        {/* Cart */}
        {!isAdmin && (
          <button
            style={cartBtnStyle}
            onClick={() => navigate("/cart")}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#c9a84c';
              e.currentTarget.style.color = '#0f172a';
              e.currentTarget.style.borderColor = '#c9a84c';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#c9a84c';
              e.currentTarget.style.borderColor = '#c9a84c';
            }}
          >
            <ShoppingCart size={20} />
          </button>
        )}

        {/* Profile Dropdown */}
        <div style={profileContainerStyle}>
          <div
            style={profileBtnStyle}
            onMouseEnter={() => setShowProfileDropdown(true)}
            onMouseLeave={() => setShowProfileDropdown(false)}
          >
            <FaUserCircle size={22} />
            <FaChevronDown size={11} />
          </div>

          {showProfileDropdown && (
            <div
              style={dropdownStyle}
              onMouseEnter={() => setShowProfileDropdown(true)}
              onMouseLeave={() => setShowProfileDropdown(false)}
            >
              {user && user.name ? (
                <>
                  <div style={userProfileHeaderStyle}>
                    <FaUserCircle size={44} style={{ color: '#c9a84c', flexShrink: 0 }} />
                    <div>
                      <div style={userNameStyle}>{user.name}</div>
                      <div style={userEmailStyle}>{user.email || "customer@apparel.com"}</div>
                      <div style={userStatusStyle}>Premium Member</div>
                    </div>
                  </div>
                  <div style={dividerStyle} />
                  {[
                    { icon: <ShoppingCart size={16} />, label: 'My Cart', action: () => { navigate("/cart"); setShowProfileDropdown(false); } },
                    { icon: <Package size={16} />, label: 'My Orders', action: () => { setShowProfileDropdown(false); alert("Coming soon!"); } },
                    { icon: <Heart size={16} />, label: 'Wishlist', action: () => { setShowProfileDropdown(false); alert("Coming soon!"); } },
                    { icon: <MapPin size={16} />, label: 'Delivery Address', action: () => { setShowProfileDropdown(false); alert("Coming soon!"); } },
                    { icon: <Settings size={16} />, label: 'Settings', action: () => { setShowProfileDropdown(false); alert("Coming soon!"); } },
                    { icon: <HelpCircle size={16} />, label: 'Help & Support', action: () => { navigate("/contact"); setShowProfileDropdown(false); } },
                  ].map(({ icon, label, action }) => (
                    <button key={label} style={dropdownOptionStyle} onClick={action}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <span style={{ marginRight: 10, color: '#c9a84c' }}>{icon}</span>
                      {label}
                    </button>
                  ))}
                  <div style={dividerStyle} />
                  <button style={dropdownLogoutStyle} onClick={handleCustomerLogout}
                    onMouseEnter={e => e.currentTarget.style.background = '#c82333'}
                    onMouseLeave={e => e.currentTarget.style.background = '#dc3545'}
                  >
                    <LogOut size={16} style={{ marginRight: 8 }} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <div style={notLoggedInHeaderStyle}>
                    <FaUserCircle size={52} style={{ color: '#c9a84c' }} />
                    <div style={notLoggedTextStyle}>Welcome to NextGen</div>
                    <div style={notLoggedSubtextStyle}>Sign in to your account</div>
                  </div>
                  <div style={dividerStyle} />
                  <button style={dropdownLoginStyle}
                    onClick={() => { navigate("/login"); setShowProfileDropdown(false); }}
                    onMouseEnter={e => e.currentTarget.style.background = '#b8923e'}
                    onMouseLeave={e => e.currentTarget.style.background = '#c9a84c'}
                  >
                    <LogIn size={16} style={{ marginRight: 8 }} /> Login
                  </button>
                  <button style={dropdownSignupStyle}
                    onClick={() => { navigate("/signup"); setShowProfileDropdown(false); }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                    onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
                  >
                    <UserPlus size={16} style={{ marginRight: 8 }} /> Create Account
                  </button>
                  <div style={dividerStyle} />
                  <button style={dropdownOptionStyle}
                    onClick={() => { navigate("/contact"); setShowProfileDropdown(false); }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <span style={{ marginRight: 10, color: '#c9a84c' }}><HelpCircle size={16} /></span>
                    Help & Support
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/* ── STYLES ── */
const headerStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",  // left | center | right
  alignItems: "center",
  padding: "16px 2.5rem",
  backgroundColor: "#0f172a",
  color: "#fff",
  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  borderBottom: "1px solid #1e293b",
  minHeight: "80px",
  fontFamily: "'DM Sans', sans-serif",
  position: "sticky",
  top: 0,
  zIndex: 999,
 
  paddingBottom: '30px'
};

const leftNavStyle = {
  display: "flex",
  gap: "4px",
  alignItems: "center",
  justifyContent: "flex-start",  // anchors to left
};

const rightActionsStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  justifyContent: "flex-end",  // anchors to right
};

const brandContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",  // true center
  gap: "12px",
  cursor: "pointer",
};

const logoWrapStyle = {
  width: 52,
  height: 52,
  borderRadius: '50%',
  background: '#c9a84c',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  padding: '5px',
  flexShrink: 0,
};

const brandTextStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const brandNameStyle = {
  fontSize: "1.6rem",
  fontWeight: "700",
  color: "#e8d5a0",
  letterSpacing: "0.02em",
  lineHeight: "1.2",
  fontFamily: "'Playfair Display', serif",
};

const brandSubtextStyle = {
  fontSize: "0.6rem",
  color: "#475569",
  fontWeight: "600",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

const navBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "9px 13px",
  backgroundColor: "transparent",
  color: "#cbd5e1",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "0.6 rem",
  transition: "all 0.2s ease",
  whiteSpace: "nowrap",
  fontFamily: "'DM Sans', sans-serif",
};

const cartBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 14px",
  backgroundColor: "transparent",
  color: "#c9a84c",
  border: "2px solid #c9a84c",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const adminNavBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "9px 13px",
  backgroundColor: "#ff6b00",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "1rem",
  transition: "all 0.2s ease",
  fontFamily: "'DM Sans', sans-serif",
};

const adminLogoutBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 14px",
  backgroundColor: "#dc3545",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const profileContainerStyle = {
  position: "relative",
  display: "inline-block",
};

const profileBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "9px 14px",
  backgroundColor: "#c9a84c",
  color: "#0f172a",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "1rem",
  transition: "all 0.2s ease",
};

const dropdownStyle = {
  position: "absolute",
  top: "48px",
  right: "0",
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
  zIndex: 100,
  minWidth: "300px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  maxHeight: "80vh",
  overflowY: "auto",
};

const userProfileHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px",
  backgroundColor: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
};

const userNameStyle = {
  fontSize: "1rem",
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: "2px",
};

const userEmailStyle = {
  fontSize: "0.82rem",
  color: "#64748b",
  marginBottom: "2px",
};

const userStatusStyle = {
  fontSize: "0.7rem",
  fontWeight: "700",
  color: "#c9a84c",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const notLoggedInHeaderStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
  padding: "20px 16px",
  backgroundColor: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
};

const notLoggedTextStyle = {
  fontSize: "1rem",
  fontWeight: "700",
  color: "#0f172a",
};

const notLoggedSubtextStyle = {
  fontSize: "0.82rem",
  color: "#94a3b8",
};

const dividerStyle = {
  height: "1px",
  backgroundColor: "#f1f5f9",
};

const dropdownOptionStyle = {
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "#fff",
  color: "#334155",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "0.95rem",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  borderBottom: "1px solid #f8fafc",
  fontFamily: "'DM Sans', sans-serif",
};

const dropdownLoginStyle = {
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "#c9a84c",
  color: "#0f172a",
  border: "none",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "0.95rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
  fontFamily: "'DM Sans', sans-serif",
};

const dropdownSignupStyle = {
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "#0f172a",
  color: "#e8d5a0",
  border: "none",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "0.95rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
  fontFamily: "'DM Sans', sans-serif",
};

const dropdownLogoutStyle = {
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "#dc3545",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "0.95rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
  fontFamily: "'DM Sans', sans-serif",
};

export default Header;