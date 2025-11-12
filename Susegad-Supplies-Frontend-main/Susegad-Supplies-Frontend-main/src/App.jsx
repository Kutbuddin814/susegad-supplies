import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// CRITICAL STEP: Wrap your entire application in the AppProvider
import { AppProvider } from "./context/AppContext.jsx";

// ✅ Layout Components
import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import CartSidebar from "./components/UI/CartSidebar.jsx";
import LoginModal from "./components/Modals/LoginModal.jsx";
import SignupModal from "./components/Modals/SignupModal.jsx";

// ✅ Pages
import HomePage from "./pages/HomePage/HomePage.jsx";
import ProductsPage from "./pages/ProductsPage/ProductsPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage/ProductDetailPage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage/SearchResultsPage.jsx";
import ProfilePage from "./pages/ProfilePage/ProfilePage.jsx";
import ContactPage from "./pages/ContactPage/ContactPage.jsx";
import CheckoutPage from "./pages/CheckoutPage/CheckoutPage.jsx";
import BillingPage from "./pages/BillingPage/BillingPage.jsx";
import ConfirmationPage from "./pages/ConfirmationPage/ConfirmationPage.jsx";
import OrderHistoryPage from "./pages/OrderHistoryPage/OrderHistoryPage.jsx";

function AppContent() {
  // ✅ STATE for Login Signup + Cart Sidebar
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <BrowserRouter>

      {/* ✅ Header needs props */}
      <Header
        onLoginClick={() => setShowLogin(true)}
        onCartClick={() => setCartOpen(true)}
      />

      {/* ✅ Cart Sidebar */}
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ✅ Login Modal */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />

      {/* ✅ Signup Modal */}
      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />

      <Routes>

        {/* ✅ Redirect "/" → "/shop" */}
        <Route path="/" element={<Navigate to="/shop" replace />} />

        {/* ✅ Homepage */}
        <Route path="/shop" element={<HomePage />} />

        {/* ✅ Product pages */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />

        {/* ✅ Search */}
        <Route path="/search" element={<SearchResultsPage />} />

        {/* ✅ User profile */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* ✅ Contact */}
        <Route path="/contact" element={<ContactPage />} />

        {/* ✅ Checkout flow */}
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />

        {/* ✅ Orders */}
        <Route path="/orders" element={<OrderHistoryPage />} />

        {/* ✅ Fallback */}
        <Route path="*" element={<Navigate to="/shop" replace />} />
      </Routes>

      <Footer />

    </BrowserRouter>
  );
}

// Wrapper component to provide the context
function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    )
}

export default App;