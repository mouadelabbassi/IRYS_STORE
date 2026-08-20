import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAllProducts, Product } from '../../service/api';
import { useCart } from '../../context/CartContext';
import Toast from '../../components/common/Toast';

const PRODUCTS_PER_PAGE = 12;

const getProductScore = (product: Product) => {
    const ratingScore = (product.rating || 0) * 1000;
    const salesScore = (product.salesCount || 0) * 100;
    const rankingBonus = product.ranking && product.ranking <= 100
        ? Math.max(0, 100 - product.ranking)
        : 0;
    return ratingScore + salesScore + rankingBonus;
};

const ShopPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get('category') || 'all';
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
    const [priceRange, setPriceRange] = useState('all');
    const [sortBy, setSortBy] = useState('ranking');
    const [currentPage, setCurrentPage] = useState(1);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const { addToCart, getItemQuantity } = useCart();

    useEffect(() => {
        let active = true;

        const loadProducts = async () => {
            try {
                setLoading(true);
                const data = await getAllProducts();
                if (active) setProducts(data);
            } catch (error) {
                console.error('Error fetching products:', error);
                if (active) setToast({ message: 'The collection could not be loaded.', type: 'error' });
            } finally {
                if (active) setLoading(false);
            }
        };

        void loadProducts();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        setSelectedCategory(categoryFromUrl);
    }, [categoryFromUrl]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, priceRange, sortBy]);

    const categories = useMemo(
        () => [
            'all',
            ...new Set(
                products
                    .map((product) => product.categoryName)
                    .filter((category): category is string => Boolean(category)),
            ),
        ],
        [products],
    );

    const rankByAsin = useMemo(() => {
        const ranked = [...products].sort((a, b) => getProductScore(b) - getProductScore(a));
        return new Map(ranked.map((product, index) => [product.asin, index + 1]));
    }, [products]);

    const filteredProducts = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        const result = products.filter((product) => {
            const matchesSearch = !normalizedQuery ||
                product.productName.toLowerCase().includes(normalizedQuery) ||
                product.description?.toLowerCase().includes(normalizedQuery);
            const matchesCategory = selectedCategory === 'all' || product.categoryName === selectedCategory;

            let matchesPrice = true;
            if (priceRange !== 'all') {
                const [minimum, maximum] = priceRange.split('-').map(Number);
                matchesPrice = maximum
                    ? product.price >= minimum && product.price <= maximum
                    : product.price >= minimum;
            }

            return matchesSearch && matchesCategory && matchesPrice;
        });

        switch (sortBy) {
            case 'price-low':
                return result.sort((a, b) => a.price - b.price);
            case 'price-high':
                return result.sort((a, b) => b.price - a.price);
            case 'rating':
                return result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'reviews':
                return result.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
            default:
                return result.sort((a, b) => getProductScore(b) - getProductScore(a));
        }
    }, [priceRange, products, searchQuery, selectedCategory, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const pageProducts = filteredProducts.slice(
        (safePage - 1) * PRODUCTS_PER_PAGE,
        safePage * PRODUCTS_PER_PAGE,
    );
    const firstResult = filteredProducts.length === 0 ? 0 : (safePage - 1) * PRODUCTS_PER_PAGE + 1;
    const lastResult = Math.min(safePage * PRODUCTS_PER_PAGE, filteredProducts.length);
    const paginationItems = useMemo<Array<number | string>>(() => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

        const pages = [...new Set([1, safePage - 1, safePage, safePage + 1, totalPages])]
            .filter((page) => page >= 1 && page <= totalPages)
            .sort((a, b) => a - b);
        const items: Array<number | string> = [];

        pages.forEach((page, index) => {
            const previousPage = pages[index - 1];
            if (previousPage && page - previousPage > 1) items.push(`ellipsis-${previousPage}`);
            items.push(page);
        });
        return items;
    }, [safePage, totalPages]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const activeFilterCount = Number(Boolean(searchQuery.trim())) +
        Number(selectedCategory !== 'all') +
        Number(priceRange !== 'all') +
        Number(sortBy !== 'ranking');

    const selectCategory = (category: string) => {
        setSelectedCategory(category);
        const nextParams = new URLSearchParams(searchParams);
        if (category === 'all') nextParams.delete('category');
        else nextParams.set('category', category);
        setSearchParams(nextParams, { replace: true });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setPriceRange('all');
        setSortBy('ranking');
        setSearchParams({}, { replace: true });
    };

    const changePage = (page: number) => {
        const nextPage = Math.min(Math.max(page, 1), totalPages);
        setCurrentPage(nextPage);
        requestAnimationFrame(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    const handleAddToCart = (product: Product) => {
        const stockQuantity = product.stockQuantity || 0;
        const currentInCart = getItemQuantity(product.asin);

        if (stockQuantity <= 0) {
            setToast({ message: `${product.productName} is out of stock.`, type: 'error' });
            return;
        }
        if (currentInCart >= stockQuantity) {
            setToast({ message: `Only ${stockQuantity} item(s) are available.`, type: 'error' });
            return;
        }

        if (addToCart(product)) {
            setToast({ message: `${product.productName} added to your cart.`, type: 'success' });
        } else {
            setToast({ message: 'The item could not be added to your cart.', type: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="min-w-0">
                <div className="h-44 animate-pulse rounded-[1.75rem] bg-ink-900 sm:h-56" />
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                    {Array.from({ length: 8 }, (_, index) => (
                        <div key={index} className="card-luxe overflow-hidden">
                            <div className="aspect-[4/5] animate-pulse bg-brand-50 dark:bg-white/5" />
                            <div className="space-y-3 p-3 sm:p-4">
                                <div className="h-3 w-16 animate-pulse rounded bg-brand-100 dark:bg-white/10" />
                                <div className="h-4 animate-pulse rounded bg-brand-100 dark:bg-white/10" />
                                <div className="h-11 animate-pulse rounded-xl bg-brand-100 dark:bg-white/10" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-w-0 pb-4 sm:pb-8">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <section className="surface-ink relative isolate overflow-hidden rounded-[1.75rem] px-5 py-7 shadow-brand-glow sm:rounded-[2rem] sm:px-8 sm:py-10 lg:px-12">
                <img
                    src="/images/brand/irys-mark.jpg"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-14 -top-16 h-64 w-64 rounded-full object-cover opacity-[0.09] blur-[1px] sm:-right-8 sm:h-80 sm:w-80"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-900/35 via-transparent to-champagne-500/10" aria-hidden="true" />
                <div className="relative max-w-2xl">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-brand-300 sm:text-xs sm:tracking-[0.42em]">
                        The Irys collection
                    </p>
                    <h1 className="mt-3 font-display text-4xl font-light leading-none text-white sm:mt-4 sm:text-6xl">
                        Find your next <span className="italic text-gilded-soft">favorite</span>.
                    </h1>
                    <hr className="rule-champagne mt-5 max-w-xs sm:mt-7" />
                    <p className="mt-4 max-w-xl text-sm leading-6 text-white/60 sm:mt-6 sm:text-base sm:leading-7">
                        Explore jewelry, clothes, makeup, and more. Add to cart freely and share delivery details only at checkout.
                    </p>
                </div>
            </section>

            <section className="relative z-10 -mt-3 sm:-mt-5" aria-label="Product filters">
                <div className="card-luxe rounded-[1.5rem] p-3 sm:p-5">
                    <div className="flex gap-2">
                        <label className="relative min-w-0 flex-1">
                            <span className="sr-only">Search products</span>
                            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                            </svg>
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search the collection"
                                className="h-11 w-full rounded-xl border border-brand-100 bg-brand-25 pl-11 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-200/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/35"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => setMobileFiltersOpen((open) => !open)}
                            className="relative flex h-11 shrink-0 items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 sm:hidden dark:border-white/10 dark:bg-white/[0.04] dark:text-brand-200"
                            aria-expanded={mobileFiltersOpen}
                            aria-controls="advanced-shop-filters"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M7 12h10M10 17h4" />
                            </svg>
                            <span>Filter</span>
                            {activeFilterCount > 0 && (
                                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[0.65rem] font-bold text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex w-max min-w-full gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => selectCategory(category)}
                                    aria-pressed={selectedCategory === category}
                                    className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${
                                        selectedCategory === category
                                            ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                                            : 'border-brand-100 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-white/65 dark:hover:text-brand-200'
                                    }`}
                                >
                                    {category === 'all' ? 'All products' : category}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div
                        id="advanced-shop-filters"
                        className={`${mobileFiltersOpen ? 'grid' : 'hidden'} mt-3 grid-cols-2 gap-2 border-t border-brand-100 pt-3 sm:grid sm:grid-cols-[1fr_1fr_auto] sm:gap-3 dark:border-white/8`}
                    >
                        <label className="min-w-0">
                            <span className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-gray-400">Price</span>
                            <select
                                value={priceRange}
                                onChange={(event) => setPriceRange(event.target.value)}
                                className="h-11 w-full rounded-xl border border-brand-100 bg-brand-25 px-3 text-sm font-medium text-gray-700 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-200/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                            >
                                <option value="all">Any price</option>
                                <option value="0-25">Under $25</option>
                                <option value="25-50">$25 – $50</option>
                                <option value="50-100">$50 – $100</option>
                                <option value="100-500">$100 – $500</option>
                                <option value="500-1000">$500 – $1,000</option>
                                <option value="1000-">$1,000+</option>
                            </select>
                        </label>
                        <label className="min-w-0">
                            <span className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-gray-400">Sort</span>
                            <select
                                value={sortBy}
                                onChange={(event) => setSortBy(event.target.value)}
                                className="h-11 w-full rounded-xl border border-brand-100 bg-brand-25 px-3 text-sm font-medium text-gray-700 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-200/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                            >
                                <option value="ranking">Recommended</option>
                                <option value="price-low">Price: low first</option>
                                <option value="price-high">Price: high first</option>
                                <option value="rating">Highest rated</option>
                                <option value="reviews">Most reviewed</option>
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={clearFilters}
                            disabled={activeFilterCount === 0}
                            className="col-span-2 min-h-11 rounded-xl px-4 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 disabled:cursor-default disabled:opacity-35 sm:col-span-1 sm:self-end dark:text-brand-300 dark:hover:bg-white/5"
                        >
                            Clear filters
                        </button>
                    </div>
                </div>
            </section>

            <div ref={resultsRef} className="scroll-mt-24 pt-6 sm:pt-8">
                <div className="mb-4 flex items-end justify-between gap-3 sm:mb-6">
                    <div className="min-w-0">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-brand-500 dark:text-brand-300">
                            Irys Store
                        </p>
                        <h2 className="mt-1 truncate font-display text-2xl font-medium text-gray-900 dark:text-white sm:text-3xl">
                            {selectedCategory === 'all' ? 'All products' : selectedCategory}
                        </h2>
                    </div>
                    <p className="shrink-0 text-right text-xs text-gray-500 dark:text-white/45 sm:text-sm">
                        {filteredProducts.length === 0
                            ? 'No matches'
                            : `${firstResult}–${lastResult} of ${filteredProducts.length}`}
                    </p>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="card-luxe px-5 py-14 text-center sm:py-20">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-300">
                            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                            </svg>
                        </div>
                        <h3 className="mt-5 font-display text-2xl font-medium text-gray-900 dark:text-white">Nothing matched your search</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-white/50">Try another keyword or clear the filters to see the complete collection.</p>
                        <button type="button" onClick={clearFilters} className="mt-6 min-h-11 rounded-full bg-brand-500 px-6 text-sm font-semibold text-white hover:bg-brand-600">
                            Show all products
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
                        {pageProducts.map((product) => {
                            const stockQuantity = product.stockQuantity || 0;
                            const outOfStock = stockQuantity <= 0;
                            const lowStock = stockQuantity > 0 && stockQuantity <= 5;
                            const cartQuantity = getItemQuantity(product.asin);
                            const canAddMore = stockQuantity > cartQuantity;
                            const rank = rankByAsin.get(product.asin) || products.length;

                            return (
                                <article
                                    key={product.asin}
                                    className={`card-luxe group flex min-w-0 flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-brand-glow ${outOfStock ? 'opacity-80' : ''}`}
                                >
                                    <Link to={`/shop/product/${product.asin}`} className="relative block overflow-hidden" aria-label={`View ${product.productName}`}>
                                        <div className="aspect-[4/5] bg-gradient-to-br from-brand-25 via-white to-champagne-50 p-2 dark:from-white/[0.03] dark:via-white/[0.02] dark:to-brand-500/[0.08] sm:p-4">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.productName}
                                                    loading="lazy"
                                                    className={`h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.04] ${outOfStock ? 'grayscale' : ''}`}
                                                    onError={(event) => {
                                                        event.currentTarget.style.visibility = 'hidden';
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-brand-200 dark:text-white/20">
                                                    <svg className="h-12 w-12 sm:h-16 sm:w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="m4 16 4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1 sm:left-3 sm:top-3">
                                            {rank <= 3 && (
                                                <span className="rounded-full bg-ink-900/90 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wide text-champagne-100 backdrop-blur-sm sm:text-[0.65rem]">
                                                    Top {rank}
                                                </span>
                                            )}
                                            {product.isBestseller && (
                                                <span className="rounded-full bg-brand-500/95 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wide text-white backdrop-blur-sm sm:text-[0.65rem]">
                                                    Popular
                                                </span>
                                            )}
                                            {lowStock && (
                                                <span className="rounded-full bg-champagne-100/95 px-2 py-1 text-[0.6rem] font-bold text-ink-800 backdrop-blur-sm sm:text-[0.65rem]">
                                                    {stockQuantity} left
                                                </span>
                                            )}
                                        </div>

                                        {cartQuantity > 0 && (
                                            <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-white/95 px-1.5 text-xs font-bold text-brand-600 shadow-sm sm:right-3 sm:top-3">
                                                {cartQuantity}
                                            </span>
                                        )}

                                        {outOfStock && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-ink-950/55 backdrop-blur-[1px]">
                                                <span className="rounded-full border border-white/20 bg-ink-900/85 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white">
                                                    Sold out
                                                </span>
                                            </div>
                                        )}
                                    </Link>

                                    <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                                        <p className="truncate text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-brand-500 dark:text-brand-300 sm:text-[0.65rem]">
                                            {product.categoryName || 'Irys collection'}
                                        </p>
                                        <Link to={`/shop/product/${product.asin}`} className="mt-1 min-w-0">
                                            <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-gray-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-300 sm:text-base sm:leading-6">
                                                {product.productName}
                                            </h3>
                                        </Link>

                                        <div className="mt-2 flex min-h-5 items-center gap-1.5 text-xs text-gray-500 dark:text-white/45">
                                            <span className="text-champagne-500" aria-hidden="true">★</span>
                                            <span className="font-semibold text-gray-700 dark:text-white/70">{(product.rating || 0).toFixed(1)}</span>
                                            <span className="truncate">({product.reviewsCount || 0})</span>
                                        </div>

                                        <div className="mt-auto flex min-w-0 items-end justify-between gap-2 pt-3">
                                            <span className="truncate font-display text-xl font-semibold text-ink-900 dark:text-brand-100 sm:text-2xl">
                                                ${product.price.toFixed(2)}
                                            </span>
                                            {!outOfStock && stockQuantity <= 10 && (
                                                <span className="hidden shrink-0 text-[0.65rem] font-medium text-gray-400 sm:block">{stockQuantity} in stock</span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleAddToCart(product)}
                                            disabled={outOfStock || !canAddMore}
                                            className={`mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition-colors sm:text-sm ${
                                                outOfStock
                                                    ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/25'
                                                    : !canAddMore
                                                        ? 'cursor-not-allowed bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300'
                                                        : 'bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:bg-brand-700'
                                            }`}
                                            aria-label={outOfStock ? `${product.productName} is sold out` : `Add ${product.productName} to cart`}
                                        >
                                            {!outOfStock && canAddMore && (
                                                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2 2h12m-8 4h.01M17 19h.01" />
                                                </svg>
                                            )}
                                            <span className="truncate">
                                                {outOfStock
                                                    ? 'Sold out'
                                                    : !canAddMore
                                                        ? 'Cart is full'
                                                        : cartQuantity > 0
                                                            ? 'Add another'
                                                            : 'Add to cart'}
                                            </span>
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {filteredProducts.length > PRODUCTS_PER_PAGE && (
                    <nav className="mt-8 flex items-center justify-between gap-3 sm:mt-10 sm:justify-center" aria-label="Product pages">
                        <button
                            type="button"
                            onClick={() => changePage(safePage - 1)}
                            disabled={safePage === 1}
                            className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:bg-white/[0.035] dark:text-brand-200"
                        >
                            <span aria-hidden="true">←</span>
                            <span className="hidden min-[360px]:inline">Previous</span>
                        </button>

                        <span className="text-sm font-semibold text-gray-600 dark:text-white/60 sm:hidden">
                            {safePage} / {totalPages}
                        </span>
                        <div className="hidden items-center gap-1 sm:flex">
                            {paginationItems.map((item) => typeof item === 'number' ? (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => changePage(item)}
                                    aria-current={item === safePage ? 'page' : undefined}
                                    className={`flex h-11 min-w-11 items-center justify-center rounded-full px-2 text-sm font-bold transition-colors ${
                                        item === safePage
                                            ? 'bg-brand-500 text-white'
                                            : 'text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-brand-200'
                                    }`}
                                >
                                    {item}
                                </button>
                            ) : (
                                <span key={item} className="flex h-11 min-w-8 items-center justify-center text-gray-400" aria-hidden="true">…</span>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => changePage(safePage + 1)}
                            disabled={safePage === totalPages}
                            className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:bg-white/[0.035] dark:text-brand-200"
                        >
                            <span className="hidden min-[360px]:inline">Next</span>
                            <span aria-hidden="true">→</span>
                        </button>
                    </nav>
                )}
            </div>
        </div>
    );
};

export default ShopPage;
