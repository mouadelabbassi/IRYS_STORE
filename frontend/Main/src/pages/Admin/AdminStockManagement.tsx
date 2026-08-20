import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Toast from '../../components/common/Toast';

type StockFilter = 'all' | 'healthy' | 'low' | 'out';
type StockAction = 'set' | 'add';

interface ProductStock {
    asin: string;
    productName: string;
    imageUrl?: string | null;
    price?: number | null;
    stockQuantity: number;
    categoryName?: string | null;
    salesCount?: number | null;
    stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface StockDashboard {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    healthyStockCount: number;
    totalUnitsInStock: number;
}

interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
}

const PAGE_SIZE = 20;

const AdminStockManagement: React.FC = () => {
    const [products, setProducts] = useState<ProductStock[]>([]);
    const [dashboard, setDashboard] = useState<StockDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [filter, setFilter] = useState<StockFilter>('all');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [editingProduct, setEditingProduct] = useState<ProductStock | null>(null);
    const [stockAction, setStockAction] = useState<StockAction>('set');
    const [quantity, setQuantity] = useState(0);
    const [saving, setSaving] = useState(false);

    const authHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    });

    const fetchDashboard = useCallback(async () => {
        try {
            const response = await axios.get('/api/admin/stock/dashboard', {
                headers: authHeaders(),
            });
            setDashboard(response.data?.data ?? null);
        } catch (error) {
            console.error('Error fetching stock dashboard:', error);
            setToast({ message: 'Failed to load inventory totals', type: 'error' });
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);

            if (searchQuery) {
                const response = await axios.get('/api/admin/stock/search', {
                    params: { query: searchQuery },
                    headers: authHeaders(),
                });
                const matches: ProductStock[] = response.data?.data ?? [];
                const filteredMatches = matches.filter((product) => {
                    if (filter === 'healthy') return product.stockStatus === 'IN_STOCK';
                    if (filter === 'low') return product.stockStatus === 'LOW_STOCK';
                    if (filter === 'out') return product.stockStatus === 'OUT_OF_STOCK';
                    return true;
                });
                const start = currentPage * PAGE_SIZE;

                setProducts(filteredMatches.slice(start, start + PAGE_SIZE));
                setTotalElements(filteredMatches.length);
                setTotalPages(Math.ceil(filteredMatches.length / PAGE_SIZE));
                return;
            }

            const response = await axios.get('/api/admin/stock/products', {
                params: {
                    page: currentPage,
                    size: PAGE_SIZE,
                    sortBy: 'productName',
                    sortDir: 'asc',
                    ...(filter !== 'all' ? { filter } : {}),
                },
                headers: authHeaders(),
            });
            const page: PageResponse<ProductStock> | undefined = response.data?.data;

            setProducts(page?.content ?? []);
            setTotalPages(page?.totalPages ?? 0);
            setTotalElements(page?.totalElements ?? 0);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            setProducts([]);
            setTotalPages(0);
            setTotalElements(0);
            setToast({ message: 'Failed to load products', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [currentPage, filter, searchQuery]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleFilterChange = (nextFilter: StockFilter) => {
        setFilter(nextFilter);
        setCurrentPage(0);
    };

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setCurrentPage(0);
        setSearchQuery(searchInput.trim());
    };

    const clearSearch = () => {
        setSearchInput('');
        setSearchQuery('');
        setCurrentPage(0);
    };

    const openStockModal = (product: ProductStock, action: StockAction) => {
        setEditingProduct(product);
        setStockAction(action);
        setQuantity(action === 'set' ? product.stockQuantity : 1);
    };

    const closeStockModal = () => {
        if (saving) return;
        setEditingProduct(null);
        setQuantity(0);
    };

    const handleStockUpdate = async () => {
        if (!editingProduct) return;

        if (!Number.isInteger(quantity) || quantity < 0 || (stockAction === 'add' && quantity === 0)) {
            setToast({
                message: stockAction === 'add'
                    ? 'Added quantity must be a positive whole number'
                    : 'Stock quantity must be zero or a positive whole number',
                type: 'error',
            });
            return;
        }

        try {
            setSaving(true);
            if (stockAction === 'set') {
                await axios.put(
                    `/api/admin/stock/products/${encodeURIComponent(editingProduct.asin)}`,
                    { quantity },
                    { headers: authHeaders() },
                );
            } else {
                await axios.put(
                    `/api/admin/stock/products/${encodeURIComponent(editingProduct.asin)}/add`,
                    null,
                    { params: { quantity }, headers: authHeaders() },
                );
            }

            setToast({
                message: stockAction === 'set'
                    ? `Stock set to ${quantity}`
                    : `Added ${quantity} units to stock`,
                type: 'success',
            });
            setEditingProduct(null);
            await Promise.all([fetchProducts(), fetchDashboard()]);
        } catch (error: unknown) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message : null;
            setToast({ message: message || 'Failed to update stock', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const statusBadge = (status: ProductStock['stockStatus']) => {
        if (status === 'OUT_OF_STOCK') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Out of stock
                </span>
            );
        }
        if (status === 'LOW_STOCK') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Low stock
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> In stock
            </span>
        );
    };

    const formatCurrency = (value?: number | null) => {
        if (value == null) return '—';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    const dashboardCards = dashboard ? [
        { label: 'Products', value: dashboard.totalProducts, border: 'border-brand-500', text: 'text-brand-600 dark:text-brand-400' },
        { label: 'Units in stock', value: dashboard.totalUnitsInStock?.toLocaleString() ?? '0', border: 'border-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' },
        { label: 'In stock', value: dashboard.healthyStockCount, border: 'border-green-500', text: 'text-green-600 dark:text-green-400' },
        { label: 'Low stock', value: dashboard.lowStockCount, border: 'border-amber-500', text: 'text-amber-600 dark:text-amber-400' },
        { label: 'Out of stock', value: dashboard.outOfStockCount, border: 'border-red-500', text: 'text-red-600 dark:text-red-400' },
    ] : [];

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inventory Management</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">Monitor inventory and adjust product stock levels.</p>
            </div>

            {dashboard && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                    {dashboardCards.map((card) => (
                        <div key={card.label} className={`rounded-xl border-l-4 bg-white p-4 shadow dark:bg-gray-800 ${card.border}`}>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                            <p className={`text-xl font-bold ${card.text}`}>{card.value}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-4 rounded-xl bg-white p-4 shadow dark:bg-gray-800">
                <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
                    <label htmlFor="inventory-search" className="sr-only">Search inventory</label>
                    <div className="relative flex-1">
                        <svg aria-hidden="true" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                        </svg>
                        <input
                            id="inventory-search"
                            type="search"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Search by product name or ASIN"
                            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700">
                        Search
                    </button>
                    {searchQuery && (
                        <button type="button" onClick={clearSearch} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                            Clear
                        </button>
                    )}
                </form>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-sm text-gray-500 dark:text-gray-400">Stock status:</span>
                    {([
                        { value: 'all', label: 'All' },
                        { value: 'healthy', label: 'In stock' },
                        { value: 'low', label: 'Low stock' },
                        { value: 'out', label: 'Out of stock' },
                    ] as { value: StockFilter; label: string }[]).map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleFilterChange(option.value)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${filter === option.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>
                    Showing {products.length} of {totalElements} products
                    {searchQuery && <> matching “{searchQuery}”</>}
                </span>
                {(filter !== 'all' || searchQuery) && (
                    <button
                        type="button"
                        onClick={() => {
                            setFilter('all');
                            clearSearch();
                        }}
                        className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                        Reset filters
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-600" />
                </div>
            ) : products.length === 0 ? (
                <div className="rounded-xl bg-white p-12 text-center shadow dark:bg-gray-800">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No products found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try another search term or stock filter.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl bg-white shadow dark:bg-gray-800">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">Product</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">Category</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">Price</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-300">Sold</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-300">Stock</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-300">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {products.map((product) => (
                                    <tr key={product.asin} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-700">
                                                    {product.imageUrl ? (
                                                        <img className="h-full w-full object-cover" src={product.imageUrl} alt="" />
                                                    ) : (
                                                        <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7 12 3 4 7m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="max-w-[280px] truncate text-sm font-medium text-gray-900 dark:text-white">{product.productName}</p>
                                                    <p className="text-xs text-gray-500">{product.asin}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{product.categoryName || 'Uncategorized'}</td>
                                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-800 dark:text-gray-200">{formatCurrency(product.price)}</td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-300">{product.salesCount ?? 0}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-lg font-bold ${product.stockQuantity === 0 ? 'text-red-600' : product.stockQuantity < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                                                {product.stockQuantity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">{statusBadge(product.stockStatus)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button type="button" onClick={() => openStockModal(product, 'set')} className="rounded-md border border-brand-600 px-3 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10">
                                                    Set stock
                                                </button>
                                                <button type="button" onClick={() => openStockModal(product, 'add')} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700">
                                                    Add stock
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button type="button" onClick={() => setCurrentPage((page) => Math.max(0, page - 1))} disabled={currentPage === 0} className="rounded-lg bg-white px-4 py-2 text-sm shadow disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800">
                        Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Page {currentPage + 1} of {totalPages}</span>
                    <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))} disabled={currentPage >= totalPages - 1} className="rounded-lg bg-white px-4 py-2 text-sm shadow disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800">
                        Next
                    </button>
                </div>
            )}

            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="stock-modal-title">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h3 id="stock-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
                                    {stockAction === 'set' ? 'Set stock quantity' : 'Add stock'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{editingProduct.productName}</p>
                            </div>
                            <button type="button" onClick={closeStockModal} disabled={saving} aria-label="Close stock editor" className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-200">
                                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-5 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/60">
                            <span className="text-gray-500 dark:text-gray-400">Current stock</span>
                            <span className="float-right font-bold text-gray-900 dark:text-white">{editingProduct.stockQuantity}</span>
                        </div>

                        <label htmlFor="stock-quantity" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {stockAction === 'set' ? 'New quantity' : 'Quantity to add'}
                        </label>
                        <input
                            id="stock-quantity"
                            type="number"
                            min={stockAction === 'set' ? 0 : 1}
                            step={1}
                            value={quantity}
                            onChange={(event) => setQuantity(Number(event.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-lg font-bold text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />

                        <div className="mt-3 flex flex-wrap gap-2">
                            {(stockAction === 'set' ? [0, 10, 25, 50, 100] : [1, 10, 25, 50, 100]).map((value) => (
                                <button key={value} type="button" onClick={() => setQuantity(value)} className={`rounded-lg px-3 py-1 text-sm ${quantity === value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
                                    {stockAction === 'add' ? `+${value}` : value}
                                </button>
                            ))}
                        </div>

                        {stockAction === 'add' && Number.isFinite(quantity) && quantity > 0 && (
                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                Resulting stock: <span className="font-semibold text-gray-800 dark:text-white">{editingProduct.stockQuantity + quantity}</span>
                            </p>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button type="button" onClick={closeStockModal} disabled={saving} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200">
                                Cancel
                            </button>
                            <button type="button" onClick={handleStockUpdate} disabled={saving} className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
                                {saving ? 'Saving…' : stockAction === 'set' ? 'Set stock' : 'Add stock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStockManagement;
