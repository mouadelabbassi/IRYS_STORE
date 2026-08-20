import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Toast from '../../components/common/Toast';

const CartPage: React.FC = () => {
    const { items, removeFromCart, updateQuantity, getTotal} = useCart();
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const checkoutPath = '/shop/checkout';
    const shopPath = '/shop';
    const handleIncrement = (asin: string, currentQty: number, maxStock: number) => {
        if (currentQty >= maxStock) {
            setToast({
                message: `Maximum stock reached (${maxStock} available)`,
                type: 'error'
            });
            return;
        }
        updateQuantity(asin, currentQty + 1);
    };

    const handleDecrement = (asin: string, currentQty: number) => {
        if (currentQty <= 1) {
            removeFromCart(asin);
            return;
        }
        updateQuantity(asin, currentQty - 1);
    };

    const total = getTotal();

    if (items.length === 0) {
        return (
            <div className="card-luxe mx-auto w-full max-w-xl overflow-hidden px-4 py-12 text-center sm:px-8 sm:py-16">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-400 dark:bg-brand-500/10 dark:text-brand-300">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                </div>
                <h2 className="mt-6 font-display text-3xl font-medium text-gray-900 dark:text-white">Your cart is empty</h2>
                <p className="mx-auto mt-3 max-w-xs break-words text-sm leading-6 text-gray-500 dark:text-white/50">Add a few Irys favorites and they will appear here, ready for checkout.</p>
                <Link
                    to={shopPath}
                    className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                >
                    Browse the collection
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Shopping Cart</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{items.length} item(s) in your cart</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => {
                        const maxStock = item.product.stockQuantity || 0;
                        const isAtMaxStock = item.quantity >= maxStock;
                        const isOutOfStock = maxStock <= 0;

                        return (
                            <div
                                key={item.product.asin}
                                className={`bg-white dark:bg-gray-800 rounded-xl shadow p-6 ${isOutOfStock ? 'opacity-60 border-2 border-red-500' : ''}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.product.imageUrl ?  (
                                            <img
                                                src={item.product.imageUrl}
                                                alt={item.product.productName}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {item.product.productName}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            ${item.product.price.toFixed(2)} each
                                        </p>

                                        {isOutOfStock ?  (
                                            <p className="text-sm text-red-500 font-medium mt-1">
                                                 Out of Stock - Please remove
                                            </p>
                                        ) : maxStock <= 5 ? (
                                            <p className="text-sm text-orange-500 mt-1">
                                                Only {maxStock} left in stock
                                            </p>
                                        ) : null}

                                        <div className="flex items-center gap-4 mt-3">
                                            <div className="flex items-center border dark:border-gray-600 rounded-lg">
                                                <button
                                                    onClick={() => handleDecrement(item.product.asin, item.quantity)}
                                                    className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"
                                                    disabled={isOutOfStock}
                                                >
                                                    -
                                                </button>
                                                <span className="px-4 py-1 border-x dark:border-gray-600 min-w-[50px] text-center text-gray-900 dark:text-white">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleIncrement(item.product.asin, item.quantity, maxStock)}
                                                    className={`px-3 py-1 rounded-r-lg ${
                                                        isAtMaxStock || isOutOfStock
                                                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                    disabled={isAtMaxStock || isOutOfStock}
                                                    title={isAtMaxStock ? `Max ${maxStock} available` : ''}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.product.asin)}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                                            ${(item.product.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 sticky top-4">
                        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span>${getTotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Shipping</span>
                                <span className="text-green-500">Free</span>
                            </div>
                            <div className="border-t dark:border-gray-700 pt-3">
                                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <Link
                            to={checkoutPath}
                            className="w-full block text-center py-3 bg-gray-700 dark:bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 dark:hover:bg-gray-600 transition-colors"
                        >
                            → Proceed to Checkout
                        </Link>

                        <Link
                            to={shopPath}
                            className="w-full block text-center mt-3 py-3 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            ← Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
