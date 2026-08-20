import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import BrandLogo from '../components/common/BrandLogo';

const BuyerLayout: React.FC = () => {
    const { getItemCount } = useCart();
    const location = useLocation();
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
    const itemCount = getItemCount();

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/shop', label: 'Shop' },
        { path: '/about', label: 'About' },
    ];

    const isActive = (path: string) =>
        path === '/shop' ? location.pathname.startsWith('/shop') : location.pathname === path;

    return (
        <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-brand-25 dark:bg-ink-950">
            <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/90 backdrop-blur-xl dark:border-white/8 dark:bg-ink-900/92">
                <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
                    <div className="flex h-16 min-w-0 items-center justify-between gap-1.5 sm:h-18 sm:gap-4">
                        <Link to="/" className="group flex shrink-0 items-center" aria-label="Irys Store home">
                            <span className="sm:hidden">
                                <BrandLogo compact markClassName="h-9 w-9" />
                            </span>
                            <span className="hidden sm:inline">
                                <BrandLogo markClassName="h-10 w-10" />
                            </span>
                        </Link>

                        <nav className="flex min-w-0 items-center justify-center gap-0.5 sm:gap-1" aria-label="Store navigation">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex min-h-11 items-center rounded-xl px-2 text-xs font-semibold transition-colors min-[360px]:px-3 sm:px-4 sm:text-sm ${
                                        isActive(link.path)
                                            ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300'
                                            : 'text-gray-600 hover:bg-brand-50 hover:text-brand-600 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-brand-200'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                            <Link
                                to="/shop/cart"
                                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100 dark:border-white/10 dark:bg-white/[0.05] dark:text-brand-200 dark:hover:bg-white/10"
                                title="Shopping cart"
                                aria-label={`Shopping cart with ${itemCount} items`}
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {itemCount > 0 && (
                                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-bold text-white">
                                        {itemCount > 99 ? '99+' : itemCount}
                                    </span>
                                )}
                            </Link>

                            <button
                                type="button"
                                onClick={() => setIsDark((current) => !current)}
                                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100 min-[360px]:flex dark:border-white/10 dark:bg-white/[0.05] dark:text-brand-200 dark:hover:bg-white/10"
                                aria-label={isDark ? 'Use light theme' : 'Use dark theme'}
                            >
                                {isDark ? (
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </header>

            <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
                <Outlet />
            </main>

            <footer className="mt-auto border-t border-brand-100 bg-white dark:border-white/8 dark:bg-ink-900">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
                    <BrandLogo markClassName="h-10 w-10" />
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        &copy; {new Date().getFullYear()} Irys Store. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default BuyerLayout;
