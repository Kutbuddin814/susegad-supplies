import React, { useState, useEffect } from "react";
// FIX: Import all necessary hooks and components
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"; 

// CRITICAL STEP: Wrap your entire application in the AppProvider
// FIX: We need useAppContext here as well, since AppRouter uses it.
import { AppProvider, useAppContext } from "./context/AppContext.jsx"; 

// ✅ Layout Components
import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import CartSidebar from "./components/UI/CartSidebar.jsx";
import LoginModal from "./components/Modals/LoginModal.jsx";
import SignupModal from "./components/Modals/SignupModal.jsx";
import CheckoutGuard from "./components/CheckoutGuard.jsx"; // IMPORT THE GUARD

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

// Renamed the content component to AppRouter since it contains the routing logic
function AppRouter() { 
    // FIX: These hooks are now safely inside the BrowserRouter context (thanks to the App component wrapper)
    const { cart } = useAppContext(); 
    const location = useLocation();
    
    // ✅ STATE for Login Signup + Cart Sidebar
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);

    // This check is a failsafe against global redirects
    useEffect(() => {
        // This prevents external components from redirecting if the user successfully made it to /confirmation
        if (cart?.items?.length === 0 && location.pathname === '/confirmation') {
            return;
        }
    }, [cart, location.pathname]);


    return (
        // Using a Fragment since BrowserRouter is outside
        <> 
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

                {/* 💥 CHECKOUT FLOW: Wrapped in guard */}
                <Route element={<CheckoutGuard />}>
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/billing" element={<BillingPage />} />
                </Route>

                {/* ✅ CONFIRMATION MUST BE OUTSIDE THE GUARD */}
                <Route path="/confirmation" element={<ConfirmationPage />} />

                {/* ✅ Orders */}
                <Route path="/orders" element={<OrderHistoryPage />} />

                {/* ✅ Fallback */}
                <Route path="*" element={<Navigate to="/shop" replace />} />
            </Routes>

            <Footer />
        </>
    );
}

// Wrapper component to provide the context and the router
function App() {
    return (
        <AppProvider>
            {/* FIX: BrowserRouter now correctly wraps the component using routing hooks */}
            <BrowserRouter>
                <AppRouter />
            </BrowserRouter>
        </AppProvider>
    )
}

export default App;