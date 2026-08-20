import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import BrandLogo from '../../components/common/BrandLogo';

interface Product {
    asin: string;
    productName: string;
    price:  number;
    rating: number;
    reviewsCount: number;
    imageUrl: string;
    categoryName: string;
    stockQuantity: number;
    sellerName: string;
}

const PublicShopPage:  React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/public/products', {
                params: { page: 0, size: 50 }
            });
            const data = response.data?.data?.content || response.data?.data || [];
            setProducts(data);
            const cats = [...new Set(data.map((p: Product) => p.categoryName).filter(Boolean))];
            setCategories(cats as string[]);
        } catch (error) {
            console.error('Error fetching products:', error);
            try {
                const fallbackResponse = await axios.get('/api/products', {
                    params: { page: 0, size: 50 }
                });
                const data = fallbackResponse.data?.data?.content || [];
                setProducts(data);
            } catch (e) {
                console.error('Fallback also failed:', e);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBuyClick = (product: Product) => {
        if (isAuthenticated) {
            if (user?.role === 'BUYER') {
                navigate(`/shop/product/${product.asin}`);
            } else if (user?.role === 'SELLER') {
                navigate(`/seller/shop/product/${product.asin}`);
            } else {
                navigate(`/shop/product/${product.asin}`);
            }
        } else {
            setShowLoginModal(true);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.asin?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.categoryName === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-ink-950">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 border-b border-brand-400/20 bg-ink-900/95 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" aria-label="Irys Store home">
                            <BrandLogo markClassName="h-10 w-10" tone="onDark" />
                        </Link>

                        <div className="hidden md:flex items-center gap-6">
                            <Link to="/" className="text-white/65 hover:text-brand-200 transition-colors">Home</Link>
                            <Link to="/explore" className="text-white font-medium">Shop</Link>
                            <Link to="/about" className="text-white/65 hover:text-brand-200 transition-colors">About</Link>
                        </div>

                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => {
                                        if (user?.role === 'ADMIN') navigate('/admin');
                                        else if (user?.role === 'SELLER') navigate('/seller/dashboard');
                                        else navigate('/shop');
                                    }}
                                    className="rounded-full bg-brand-400 px-6 py-2.5 font-semibold text-ink-900 transition-colors hover:bg-brand-300"
                                >
                                    My Dashboard
                                </button>
                            ) : (
                                <>
                                    <Link to="/signin" className="text-white/65 hover:text-white transition-colors">
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="rounded-full bg-brand-400 px-6 py-2.5 font-semibold text-ink-900 transition-colors hover:bg-brand-300"
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="border-b border-brand-400/15 bg-ink-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <p className="mb-5 text-xs font-semibold uppercase tracking-[0.42em] text-brand-300">The collection</p>
                    <h1 className="mb-5 font-display text-5xl font-light text-white sm:text-6xl">
                        Explore our <span className="italic text-gilded-soft">products</span>
                    </h1>
                    <hr className="rule-champagne mb-6 max-w-sm" />
                    <p className="text-lg text-white/55">
                        Browse our collection of premium products. Sign in to add to cart and make purchases.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-brand-400/15 bg-ink-800 p-4 md:flex-row">
                    <div className="relative flex-1 max-w-md">
                        <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-300/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-md border border-brand-400/20 bg-ink-950 py-3 pl-12 pr-4 text-white placeholder-white/30 focus:border-transparent focus:ring-2 focus:ring-brand-400"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="rounded-md border border-brand-400/20 bg-ink-950 px-4 py-3 text-white focus:ring-2 focus:ring-brand-400"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <p className="text-white/45">
                        Showing <span className="text-white font-semibold">{filteredProducts.length}</span> products
                    </p>
                </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-brand-400"></div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
                        <p className="text-white/45">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.asin}
                                className="group overflow-hidden rounded-2xl border border-brand-400/15 bg-ink-800 transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/50 hover:shadow-brand-glow"
                            >
                                {/* Image */}
                                <div className="relative aspect-square overflow-hidden bg-ink-950">
                                    {product.imageUrl ?  (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.productName}
                                            className="w-full h-full object-cover group-hover: scale-110 transition-transform duration-500"
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://via.placeholder.com/300? text=No+Image';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20">
                                            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    {product.categoryName && (
                                        <span className="absolute left-3 top-3 rounded-md bg-brand-600/95 px-3 py-1 text-xs font-medium text-white">
                                            {product.categoryName}
                                        </span>
                                    )}
                                    {product.stockQuantity === 0 && (
                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                            <span className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg">OUT OF STOCK</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="mb-2 line-clamp-2 font-semibold text-white transition-colors group-hover:text-brand-200">
                                        {product.productName}
                                    </h3>

                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center gap-1">
                                            <span className="text-yellow-400">⭐</span>
                                            <span className="text-white font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
                                        </div>
                                        <span className="text-white/30">•</span>
                                        <span className="text-white/45 text-sm">{product.reviewsCount || 0} reviews</span>
                                    </div>

                                    {product.sellerName && (
                                        <p className="text-white/40 text-sm mb-3">
                                            Sold by: <span className="text-white/60">{product.sellerName}</span>
                                        </p>
                                    )}

                                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                                        <span className="text-2xl font-bold text-brand-200">
                                            ${product.price?.toFixed(2) || '0.00'}
                                        </span>
                                        <button
                                            onClick={() => handleBuyClick(product)}
                                            disabled={product.stockQuantity === 0}
                                            className={`rounded-md px-4 py-2 font-semibold transition-colors ${
                                                product.stockQuantity === 0
                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    : 'bg-brand-500 hover:bg-brand-600 text-white'
                                            }`}
                                        >
                                            {product.stockQuantity === 0 ? 'Sold Out' : 'Buy Now'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 🆕 Browse More Products Card */}
                        <Link
                            to="/signup"
                            className="group flex min-h-[400px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-brand-400/35 bg-brand-500/5 transition-colors hover:border-brand-300 hover:bg-brand-500/10"
                        >
                            <div className="text-center p-8">
                                {/* Cart Icon */}
                                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-500/15 transition-colors group-hover:bg-brand-500/25">
                                    <svg className="h-12 w-12 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>

                                {/* Text */}
                                <h3 className="mb-3 font-display text-3xl font-light text-white">
                                    Want to Browse More?
                                </h3>
                                <p className="mx-auto mb-6 max-w-[220px] text-white/50">
                                    Create a free account to unlock full access and start shopping!
                                </p>

                                {/* CTA Button */}
                                <div className="inline-flex items-center gap-2 rounded-full bg-brand-400 px-7 py-3 font-semibold text-ink-900 transition-colors group-hover:bg-brand-300">
                                    <span>Sign Up Now</span>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>

                                {/* Features */}
                                <div className="mt-6 flex flex-col gap-2 text-sm text-white/45">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span>Free account</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span>Secure checkout</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span>Order tracking</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="mx-4 w-full max-w-md rounded-2xl border border-brand-400/25 bg-ink-800 p-8 shadow-2xl">
                        <div className="text-center">
                            <h3 className="mb-3 font-display text-3xl font-light text-white">
                                Sign In Required
                            </h3>
                            <p className="mb-8 text-white/55">
                                Please sign in to your account to add items to cart and make purchases.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Link
                                    to="/signin"
                                    className="w-full rounded-full bg-brand-400 py-3.5 font-semibold text-ink-900 transition-colors hover:bg-brand-300"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="w-full rounded-md border border-brand-400/30 bg-brand-500/10 py-3 font-semibold text-white transition-colors hover:bg-brand-500/20"
                                >
                                    Create Account
                                </Link>
                                <button
                                    onClick={() => setShowLoginModal(false)}
                                    className="w-full py-3 text-white/50 transition-colors hover:text-white"
                                >
                                    Continue Browsing
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="mt-12 border-t border-brand-400/15 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg: px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <BrandLogo markClassName="h-8 w-8" tone="onDark" />
                    <p className="text-sm text-white/35">&copy; {new Date().getFullYear()} Irys Store. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicShopPage;
