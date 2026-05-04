import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import './index.css'; // ← ADD THIS LINE
import ThreeDViewer from "./pages/ThreeDViewer";




// Components
import Header from "./components/Header";
import Footer from "./components/Footer";

// Pages
import ProductListing from "./pages/ProductListing";
import ProductDetail from "./pages/ProductDetail";
import CustomizationStudio from "./pages/CustomizationStudio";
import ShirtViewer3D from "./pages/ShirtViewer3D";
import AddProduct from "./pages/admin/AddProduct";
import AdminOrders from "./pages/admin/AdminOrders";
import Signup from "./pages/SignUp";
import Login from "./pages/Login";
import EditProduct from "./pages/admin/EditProduct";
import Cart from "./pages/Cart";
import AdminLogin from "./pages/AdminLogin";
import PreviewPage from "./pages/PreviewPage";
import Checkout from "./pages/Checkout";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AboutUs from "./pages/AboutUs";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import FAQs from "./pages/FAQs";
import ContactUs from "./pages/ContactUs";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import SVGColorTest from "./pages/SVGColorTest";
import CategoryPage from "./pages/CategoryPage";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false); // Track admin login

  // ✅ Initialize app in customer mode on first load
  useEffect(() => {
    // Clear admin session on app startup
    localStorage.removeItem("isAdminLoggedIn");
    setIsAdmin(false);
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          {/* Header */}
          <Header />

          {/* Routes */}
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<ProductListing />} />
            <Route path="/products" element={<ProductListing />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/category/:category/:subcategory" element={<CategoryPage />} />
            <Route path="/customize/:id" element={<CustomizationStudio />} />
            <Route path="/customize/:id/3d-view" element={<ShirtViewer3D />} />
            <Route path="/svg-test" element={<SVGColorTest />} />
            <Route path="/preview" element={<PreviewPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login setIsAdmin={setIsAdmin} />} />
            <Route path="/signup" element={<Signup setIsAdmin={setIsAdmin} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/edit-product/:id" element={<EditProduct />} />
            <Route path="/customize/:id/3d-view" element={<ThreeDViewer />} />

            
            {/* Footer Links Routes */}
            <Route path="/about" element={<AboutUs />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            
            {/* Admin routes */}
            <Route
              path="/admin"
              element={<AdminLogin setIsAdmin={setIsAdmin} />}
            />
            <Route
              path="/admin/add-product"
              element={<AddProduct />}
            />
            <Route path="/admin/orders" element={<AdminOrders />} />
          </Routes>

          {/* Footer */}
          <Footer />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
