import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';

function SearchResultsPage({ setCartOpen }) {
    const { API_URL } = useAppContext();
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');

    useEffect(() => {
        if (!query) {
            setSearchResults([]);
            return;
        }

        const fetchResults = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_URL}/search?q=${query}`);
                const data = await res.json();
                setSearchResults(data);
            } catch (err) {
                console.error("Failed to fetch search results", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query, API_URL]);

    return (
        <section id="search-results-page">
            <div className="container">
                <h1 className="page-title">Search Results for "{query}"</h1>
                {loading ? (
                    <p style={{textAlign: 'center'}}>Loading...</p>
                ) : searchResults.length > 0 ? (
                    <div className="product-grid">
                        {searchResults.map(p => (
                            <ProductCard key={p._id} product={p} setCartOpen={setCartOpen} />
                        ))}
                    </div>
                ) : (
                    <p style={{textAlign: 'center'}}>No products found matching your search.</p>
                )}
            </div>
        </section>
    );
}

export default SearchResultsPage;