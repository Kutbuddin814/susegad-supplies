// src/components/CheckoutGuard.jsx (Updated with Flag Check)
import React, { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';

function CheckoutGuard() {
    const { cart, showToast } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname;

    useEffect(() => {
        // Define the pages we protect
        const isProtectedFlow = path === '/checkout' || path === '/billing';
        const isCartEmpty = cart?.items?.length === 0;

        // ✅ FIX: Check the temporary flag set by AppContext.checkout
        const isCheckoutInProgress = localStorage.getItem('checkoutSuccessFlag') === 'true';

        // If cart is empty AND we are on a protected page AND checkout is NOT in progress, redirect.
        if (isCartEmpty && isProtectedFlow && !isCheckoutInProgress) {
            showToast("Your cart is empty. Please add items to proceed.", "error");
            navigate('/products', { replace: true });
        }
        // Only watch cart and path.
    }, [cart, path, navigate, showToast]);

    // Render child routes (Checkout/Billing)
    return <Outlet />;
}

export default CheckoutGuard;