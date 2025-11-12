import React, { useState, useEffect, createContext, useContext } from "react";

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

// Helper function to safely read environment variables (resolves compiler warnings)
const getApiUrl = () => {
  // Check if VITE_API_BASE_URL is set (usually true when running locally with npm run dev)
  if (typeof import.meta !== 'undefined' && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL; // Returns http://localhost:5000
  }
  // Fallback to the deployed production URL
  return "https://susegad-supplies.onrender.com";
};

const API_URL = getApiUrl();

/* Small helper to fetch JSON safely */
async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  // If server returned non-JSON, avoid crashing
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("loggedInUser")) || null
  );
  const [cart, setCart] = useState({ email: null, items: [] });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // ---------- Initial loads ----------
  useEffect(() => {
    (async () => {
      try {
        const [prod, cats] = await Promise.all([
          jsonFetch(`${API_URL}/shop/products`),
          jsonFetch(`${API_URL}/shop/categories`),
        ]);
        setProducts(Array.isArray(prod) ? prod : []);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (err) {
        console.error("Initial data load failed:", err);
      }
    })();
  }, []);

  // Load / clear cart when user changes
  useEffect(() => {
    if (user?.email) {
      fetchCart();
      localStorage.setItem("loggedInUser", JSON.stringify(user));
    } else {
      setCart({ email: null, items: [] });
      localStorage.removeItem("loggedInUser");
    }
  }, [user]);

  // ---------- Auth ----------
  const signup = async ({ name, email, password }) => {
    setLoading(true);
    try {
      await jsonFetch(`${API_URL}/shop/signup`, {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      // Auto-login UX: set user right away
      setUser({ name, email });
      showToast("Sign up successful!", "success");
      return true;
    } catch (err) {
      showToast(err.message || "Sign up failed", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const data = await jsonFetch(`${API_URL}/shop/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      // backend returns { message, user: { name, email } }
      const u = data?.user || { email };
      setUser(u);
      showToast("Logged in!", "success");
      return true;
    } catch (err) {
      showToast(err.message || "Login failed", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    showToast("Logout successful!");
  };

  // ---------- Cart ----------
  const fetchCart = async () => {
    if (!user?.email) return;
    try {
      const data = await jsonFetch(`${API_URL}/shop/cart/${user.email}`);
      // backend returns { email, items: [...] } or fallback
      setCart({
        email: data?.email || user.email,
        items: Array.isArray(data?.items) ? data.items : [],
      });
    } catch (err) {
      console.error("Fetch cart failed:", err);
      setCart({ email: user.email, items: [] });
    }
  };

  const addToCart = async ({ productId, quantity = 1 }) => {
    if (!user?.email) {
      showToast("Please login to add items to cart.", "error");
      return false;
    }
    try {
      await jsonFetch(`${API_URL}/shop/cart/add`, {
        method: "POST",
        body: JSON.stringify({ email: user.email, productId, quantity }),
      });
      await fetchCart();
      showToast("Added to cart!");
      return true;
    } catch (err) {
      showToast(err.message || "Failed to add to cart", "error");
      return false;
    }
  };

  const updateCartItem = async ({ productId, quantity }) => {
    if (!user?.email) return false;
    try {
      await jsonFetch(`${API_URL}/shop/cart/update`, {
        method: "PUT",
        body: JSON.stringify({ email: user.email, productId, quantity }),
      });
      await fetchCart();
      return true;
    } catch (err) {
      showToast(err.message || "Failed to update cart", "error");
      return false;
    }
  };

  const removeFromCart = async (productId) => {
    if (!user?.email) return false;
    try {
      await jsonFetch(
        `${API_URL}/shop/cart/remove/${encodeURIComponent(
          user.email
        )}/${encodeURIComponent(productId)}`,
        { method: "DELETE" }
      );
      await fetchCart();
      showToast("Removed from cart");
      return true;
    } catch (err) {
      showToast(err.message || "Failed to remove item", "error");
      return false;
    }
  };

  const checkout = async ({ itemsOverride, total }) => {
    if (!user?.email) {
      showToast("Please login to checkout.", "error");
      return { ok: false };
    }
    const items = itemsOverride || cart.items || [];
    try {
      const data = await jsonFetch(`${API_URL}/shop/checkout`, {
        method: "POST",
        body: JSON.stringify({ email: user.email, items, total }),
      });
      await fetchCart(); // cart is cleared server-side
      showToast("Order placed!", "success");
      return { ok: true, order: data?.order || null };
    } catch (err) {
      showToast(err.message || "Checkout failed", "error");
      return { ok: false };
    }
  };

  // ---------- UI helpers ----------
  const showToast = (message, type = "success") => {
    const event = new CustomEvent("showtoast", { detail: { message, type } });
    window.dispatchEvent(event);
  };

  const value = {
    API_URL,

    loading,

    // data
    products,
    categories,
    cart,
    user,

    // auth
    signup,
    login,
    handleLogout,
    setUser,

    // cart ops
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    checkout,

    // misc
    setCart,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};