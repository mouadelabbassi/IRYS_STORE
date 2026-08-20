import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Toast from '../../components/common/Toast';
import { Product } from '../../service/api';
import { ProductDetail, Review, reviewService } from '../../service/review';

const ProductDetailPage: React.FC = () => {
    const { asin } = useParams<{ asin: string }>();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const { addToCart, getItemQuantity } = useCart();

    useEffect(() => {
        const loadProduct = async () => {
            if (!asin) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await reviewService.getProductDetail(asin);
                setProduct(data);
            } catch (error) {
                console.error('Error fetching product:', error);
                setToast({ message: 'This product could not be loaded.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        void loadProduct();
    }, [asin]);

    const handleAddToCart = () => {
        if (!product) return;

        const stockQuantity = product.stockQuantity ?? 0;
        const alreadyInCart = getItemQuantity(product.asin);
        if (stockQuantity <= 0) {
            setToast({ message: 'This product is out of stock.', type: 'error' });
            return;
        }
        if (alreadyInCart + quantity > stockQuantity) {
            setToast({ message: `Only ${stockQuantity} item(s) are available.`, type: 'error' });
            return;
        }

        const cartProduct: Product = {
            asin: product.asin,
            productName: product.productName,
            description: product.description,
            price: product.price,
            rating: product.averageRating ?? product.rating ?? 0,
            reviewsCount: product.totalReviews ?? product.reviewsCount ?? 0,
            imageUrl: product.imageUrl,
            productLink: product.productLink,
            categoryId: product.categoryId,
            categoryName: product.categoryName,
            isBestseller: product.isBestseller,
            stockQuantity,
            salesCount: product.salesCount,
        };

        if (addToCart(cartProduct, quantity)) {
            setToast({ message: `${quantity} item(s) added to your cart.`, type: 'success' });
        } else {
            setToast({ message: 'The item could not be added to your cart.', type: 'error' });
        }
    };

    const renderStars = (rating: number, className = 'text-lg') => (
        <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}>
                    ★
                </span>
            ))}
        </span>
    );

    const formatDate = (value?: string) => {
        if (!value) return '';
        return new Date(value).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-brand-100 border-b-brand-500" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="py-16 text-center">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product not found</h1>
                <Link to="/shop" className="mt-5 inline-block font-semibold text-brand-600 hover:underline">
                    Back to the shop
                </Link>
            </div>
        );
    }

    const stockQuantity = product.stockQuantity ?? 0;
    const alreadyInCart = getItemQuantity(product.asin);
    const remainingQuantity = Math.max(0, stockQuantity - alreadyInCart);
    const averageRating = product.averageRating ?? product.rating ?? 0;
    const totalReviews = product.totalReviews ?? product.reviewsCount ?? 0;

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
                <Link to="/shop" className="hover:text-brand-600">Shop</Link>
                <span>/</span>
                <span>{product.categoryName || 'Products'}</span>
                <span>/</span>
                <span className="max-w-xs truncate text-gray-800 dark:text-gray-200">{product.productName}</span>
            </nav>

            <section className="grid gap-10 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8 lg:grid-cols-2">
                <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-white">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.productName} className="h-full w-full object-contain p-5" />
                    ) : (
                        <div className="text-center text-gray-400">
                            <svg className="mx-auto h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mt-3">No image available</p>
                        </div>
                    )}
                    {product.isBestseller && (
                        <span className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                            Bestseller
                        </span>
                    )}
                </div>

                <div className="flex flex-col justify-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">
                        {product.categoryName || 'Irys collection'}
                    </p>
                    <h1 className="mt-3 text-3xl font-bold leading-tight text-gray-900 dark:text-white sm:text-4xl">
                        {product.productName}
                    </h1>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        {renderStars(averageRating)}
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{averageRating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({totalReviews} reviews)</span>
                    </div>

                    <p className="mt-6 text-4xl font-bold text-brand-600 dark:text-brand-300">
                        ${product.price.toFixed(2)}
                    </p>

                    {product.description && (
                        <p className="mt-6 leading-7 text-gray-600 dark:text-gray-300">{product.description}</p>
                    )}

                    <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
                        {stockQuantity > 0 ? (
                            <p className="mb-4 text-sm font-medium text-green-600 dark:text-green-400">
                                In stock — {stockQuantity} available
                            </p>
                        ) : (
                            <p className="mb-4 text-sm font-medium text-red-600 dark:text-red-400">Out of stock</p>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <label className="flex items-center gap-3 rounded-xl border border-gray-300 px-4 py-3 dark:border-gray-700">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Quantity</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={Math.max(1, remainingQuantity)}
                                    value={quantity}
                                    onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                                    disabled={remainingQuantity === 0}
                                    className="w-16 bg-transparent text-center font-semibold text-gray-900 outline-none dark:text-white"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={remainingQuantity === 0}
                                className="flex-1 rounded-xl bg-brand-500 px-6 py-3.5 font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
                            >
                                {stockQuantity === 0
                                    ? 'Out of stock'
                                    : remainingQuantity === 0
                                        ? 'Maximum quantity in cart'
                                        : 'Add to cart'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-10 grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customer ratings</h2>
                    <div className="mt-5 flex items-end gap-3">
                        <span className="text-5xl font-bold text-gray-900 dark:text-white">{averageRating.toFixed(1)}</span>
                        <div>
                            {renderStars(averageRating)}
                            <p className="mt-1 text-sm text-gray-500">Based on {totalReviews} reviews</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = product.ratingDistribution?.[rating] ?? 0;
                            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                            return (
                                <div key={rating} className="grid grid-cols-[32px_1fr_36px] items-center gap-3 text-sm">
                                    <span>{rating}★</span>
                                    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div className="h-full rounded-full bg-yellow-400" style={{ width: `${percentage}%` }} />
                                    </div>
                                    <span className="text-right text-gray-500">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent reviews</h2>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            Read only
                        </span>
                    </div>

                    {product.recentReviews?.length ? (
                        <div className="mt-5 divide-y divide-gray-100 dark:divide-gray-800">
                            {product.recentReviews.map((review: Review) => (
                                <article key={review.id} className="py-5 first:pt-0 last:pb-0">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{review.userName || 'Customer'}</p>
                                            <div className="mt-1">{renderStars(review.rating, 'text-sm')}</div>
                                        </div>
                                        <time className="text-xs text-gray-500">{formatDate(review.createdAt)}</time>
                                    </div>
                                    {review.comment && (
                                        <p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">{review.comment}</p>
                                    )}
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-8 text-gray-500 dark:text-gray-400">No reviews have been published for this product yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ProductDetailPage;
