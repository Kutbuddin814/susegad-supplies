import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import './HomePage.css';

function HomePage({ setCartOpen }) {
    const { products, categories, API_URL } = useAppContext();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [testimonials, setTestimonials] = useState([]);

    const categoryImages = {
        "Local Goan Drinks": "/images/cashew-feni.jpg",
        "Sweets & Desserts": "/images/bebinca.jpg",
        "Spices & Masalas": "/images/recheado.jpg",
        "Bakery & Breads": "/images/pao.jpg",
        "Pickles & Preserves": "/images/balchao.jpg"
    };

    // ✅ FIXED SUGGESTIONS API
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSuggestions([]);
            return;
        }
        const debounceTimer = setTimeout(() => {
            const fetchSuggestions = async () => {
                try {
                    const res = await fetch(`${API_URL}/shop/products/suggestions?q=${searchQuery}`);
                    const data = await res.json();
                    setSuggestions(data);
                    setShowSuggestions(true);
                } catch (err) { console.error("Failed to fetch suggestions:", err); }
            };
            fetchSuggestions();
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, API_URL]);

    // ✅ FIXED TESTIMONIALS API
    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const res = await fetch(`${API_URL}/shop/testimonials`);
                if (res.ok) setTestimonials(await res.json());
            } catch (err) { console.error("Failed to fetch testimonials:", err); }
        };
        fetchTestimonials();
    }, [API_URL]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setShowSuggestions(false);
            setSuggestions([]);
            navigate(`/search?q=${searchQuery}`);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchQuery(suggestion);
        setShowSuggestions(false);
        setSuggestions([]);
        navigate(`/search?q=${suggestion}`);
    };

    return (
        <div>
            <section className="hero-split">
                <div className="container hero-container">
                    <div className="hero-text">
                        <h1>Authentic Goan Flavors, Delivered Fast.</h1>
                        <p>Your one-stop shop for fresh, local Goan supplies, from traditional masalas to freshly baked pão.</p>

                        <div className="search-wrapper">
                            <form className="hero-search" onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    placeholder="Search for products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                    autoComplete="off"
                                />
                                <button type="submit" className="cta-button">Search</button>
                            </form>

                            {showSuggestions && suggestions.length > 0 && (
                                <div className="suggestions-dropdown">
                                    {suggestions.map((s, index) => (
                                        <div
                                            key={index}
                                            className="suggestion-item"
                                            onMouseDown={() => handleSuggestionClick(s.name)}
                                        >
                                            {s.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="popular-searches">
                            <strong>Popular:</strong>
                            <a href="#shop-by-category">Masalas</a>
                            <a href="#shop-by-category">Pão</a>
                            <a href="#shop-by-category">Bebinca</a>
                        </div>
                    </div>

                    <div className="hero-image">
                        <img src="/images/goan-food-spread.jpg" alt="A spread of authentic Goan food" />
                    </div>
                </div>
            </section>

            <section id="shop-by-category">
                <div className="container">
                    <h2>Shop by Category</h2>
                    <div className="category-grid-home">
                        {categories.slice(0, 5).map(cat => (
                            <Link to="/products" className="category-card-home" key={cat._id}>
                                <img src={categoryImages[cat.name] || 'https://via.placeholder.com/150'} alt={cat.name} />
                                <span>{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section id="featured-products">
                <div className="container">
                    <h2>Featured Products</h2>
                    <div className="product-grid">
                        {products.slice(0, 4).map(p => (
                            <ProductCard key={p._id} product={p} setCartOpen={setCartOpen} />
                        ))}
                    </div>
                </div>
            </section>

            <section id="testimonials">
                <div className="container">
                    <h2>What Our Customers Say</h2>
                    {testimonials.length > 0 ? (
                        <div className="testimonials-grid">
                            {testimonials.map((testimonial) => (
                                <div className="testimonial-card" key={testimonial._id}>
                                    <p>"{testimonial.text}"</p>
                                    <span>- {testimonial.author}, {testimonial.location}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p style={{ textAlign: 'center' }}>Loading testimonials...</p>}
                </div>
            </section>

        </div>
    );
}

export default HomePage;
