import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';

// --- IMPORT YOUR LOGO HERE ---
import logo from '../../assets/images/logo.png'; // Adjust path if needed

// --- IMPORT YOUR HEADER CSS ---
import './Header.css';

function Header({ onLoginClick, onCartClick }) {
    const { user, handleLogout, cart } = useAppContext();
    const [isMenuOpen, setMenuOpen] = useState(false);
    const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    return (
        <header>
            <div className="container">
                {/* --- LOGO + TITLE LINK --- */}
                <Link to="/" className="logo-container">
                    <img src={logo} alt="Susegad Supplies Logo" className="header-logo" />
                    <span className="logo-text">Susegad Supplies</span>
                </Link>

                {/* --- NAVIGATION --- */}
                <nav className="main-nav">
                    <ul>
                        <li><NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink></li>
                        <li><NavLink to="/products" className={({ isActive }) => isActive ? "active" : ""}>Products</NavLink></li>
                        <li><NavLink to="/contact" className={({ isActive }) => isActive ? "active" : ""}>Contact</NavLink></li>
                    </ul>
                </nav>

                {/* --- ACTIONS (CART, LOGIN/PROFILE) --- */}
                <div className="header-actions">
                    <button className="header-cart-btn" onClick={onCartClick}>
                        <img src="https://api.iconify.design/mdi/cart-outline.svg?color=%2343362a" alt="Shopping Cart"/>
                        <span className={`cart-item-count ${totalItems > 0 ? 'visible' : ''}`}>{totalItems}</span>
                    </button>
                    {user ? (
                        <div id="user-profile-container" ref={menuRef}>
                            <button className="profile-btn" onClick={() => setMenuOpen(!isMenuOpen)}>
                                <img src="https://api.iconify.design/mdi/account-circle.svg?color=%236a994e" alt="User Profile" id="user-icon" />
                            </button>
                            {isMenuOpen && (
                                <div className="user-menu">
                                    <h4>Welcome, {user.name || user.email.split('@')[0]}!</h4>
                                    <ul>
                                        <li><Link to="/profile" onClick={() => setMenuOpen(false)}>View Profile</Link></li>
                                        {/* FIX: Corrected link path to /orders to match App.jsx route */}
                                        <li><Link to="/orders" onClick={() => setMenuOpen(false)}>Order History</Link></li>
                                        <li><button onClick={() => { handleLogout(); setMenuOpen(false); }}>Logout</button></li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button onClick={onLoginClick} className="login-button">Login / Sign Up</button>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;