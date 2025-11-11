import React from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';

function ProductsPage({ setCartOpen }) {
    const { products, categories } = useAppContext();
    return (
        <section id="all-products">
            <div className="container">
                <h1 className="page-title">Our Goan Specialties</h1>
                {categories.map(cat => (
                    <React.Fragment key={cat._id}>
                        <h2 className="category-title">{cat.name}</h2>
                        <div className="product-grid">
                            {products.filter(p => p.category === cat.name).map(p => (
                                <ProductCard key={p._id} product={p} setCartOpen={setCartOpen} />
                            ))}
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </section>
    );
}

export default ProductsPage;