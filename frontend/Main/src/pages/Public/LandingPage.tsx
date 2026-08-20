import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../components/common/BrandLogo';

const departments = [
    { name: 'Jewelry', detail: 'Jewelry and accessories', category: 'Jewelry' },
    { name: 'Clothes', detail: 'Clothing and fashion', category: 'Clothes' },
    { name: 'Makeup', detail: 'Makeup and beauty products', category: 'Makeup' },
    { name: 'All products', detail: 'Explore the complete collection', category: null },
];

const stats: Array<[string, string]> = [
    ['No', 'Account needed'],
    ['Guest', 'Checkout'],
    ['Admin', 'Managed'],
    ['24/7', 'Open storefront'],
];

const LandingPage: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 32);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLink = 'text-sm text-gray-600 transition-colors hover:text-brand-600 dark:text-white/70 dark:hover:text-brand-300';

    return (
        <div className="min-h-screen bg-white text-gray-900 dark:bg-ink-950 dark:text-white">
            <nav
                className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
                    isScrolled || menuOpen
                        ? 'border-brand-100 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/90'
                        : 'border-transparent bg-transparent'
                }`}
            >
                <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link to="/" aria-label="Irys Store home">
                        <BrandLogo markClassName="h-11 w-11" />
                    </Link>

                    <div className="hidden items-center gap-8 md:flex">
                        <Link to="/" className="text-sm font-semibold text-gray-900 dark:text-white">Home</Link>
                        <Link to="/shop" className={navLink}>Shop</Link>
                        <Link to="/about" className={navLink}>About</Link>
                    </div>

                    <div className="hidden items-center gap-3 sm:flex">
                        <Link
                            to="/shop"
                            className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-300/40"
                        >
                            Shop now
                        </Link>
                    </div>

                    <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center text-gray-800 md:hidden dark:text-white"
                        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        {menuOpen ? (
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                        ) : (
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 7h16M4 12h16M4 17h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {menuOpen && (
                    <div className="border-t border-brand-100 bg-white px-4 py-4 md:hidden dark:border-white/10 dark:bg-ink-900">
                        <div className="mx-auto flex max-w-7xl flex-col gap-1">
                            <Link to="/" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 font-medium text-gray-900 hover:bg-brand-50 dark:text-white dark:hover:bg-white/5">Home</Link>
                            <Link to="/shop" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-gray-600 hover:bg-brand-50 hover:text-brand-600 dark:text-white/75 dark:hover:bg-white/5 dark:hover:text-white">Shop</Link>
                            <Link to="/about" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-gray-600 hover:bg-brand-50 hover:text-brand-600 dark:text-white/75 dark:hover:bg-white/5 dark:hover:text-white">About</Link>
                            <Link
                                to="/shop"
                                onClick={() => setMenuOpen(false)}
                                className="mt-3 rounded-full bg-brand-500 px-5 py-3 text-center font-semibold text-white"
                            >
                                Start shopping
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            <main>
                {/* Hero — the seal on its own blush ground, text set beside it. */}
                <section className="relative isolate overflow-hidden bg-brand-50 pt-18 dark:bg-ink-950">
                    <img
                        src="/images/brand/irys-hero.jpg"
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl dark:opacity-25"
                    />
                    <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-50 via-brand-50/85 to-transparent dark:from-ink-950 dark:via-ink-950/90"
                        aria-hidden="true"
                    />

                    <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-brand-600 dark:text-brand-300">
                                Open online boutique
                            </p>
                            <h1 className="mt-6 font-display text-6xl font-light leading-[0.95] tracking-tight text-gray-900 sm:text-7xl lg:text-[5.5rem] dark:text-white">
                                IRYS <span className="italic text-gilded">Store</span>
                            </h1>
                            <hr className="rule-champagne mt-8 max-w-sm" />
                            <p className="mt-8 max-w-lg text-lg leading-8 text-gray-600 dark:text-white/70">
                                Distinctive products for everyday life, brought together in one refined
                                shop with no account required.
                            </p>
                            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    to="/shop"
                                    className="inline-flex items-center justify-center rounded-full bg-brand-500 px-8 py-4 font-semibold text-white shadow-brand-glow transition-colors hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-300/40"
                                >
                                    Shop the collection
                                </Link>
                                <Link
                                    to="/about"
                                    className="inline-flex items-center justify-center rounded-full border border-brand-300 px-8 py-4 font-semibold text-brand-700 transition-colors hover:border-brand-500 hover:bg-white/60 dark:border-brand-400/50 dark:text-brand-200 dark:hover:bg-white/5"
                                >
                                    Our story
                                </Link>
                            </div>
                        </div>

                        <div className="relative flex justify-center lg:justify-end">
                            <div
                                className="absolute inset-0 -m-10 rounded-full bg-champagne-200/35 blur-3xl dark:bg-brand-500/20"
                                aria-hidden="true"
                            />
                            <img
                                src="/images/brand/irys-mark.jpg"
                                alt="The Irys Store seal"
                                className="seal-ring relative w-full max-w-sm object-cover lg:max-w-md"
                            />
                        </div>
                    </div>
                </section>

                <section className="border-y border-brand-100 bg-white dark:border-white/8 dark:bg-ink-900" aria-label="Store highlights">
                    <div className="mx-auto grid max-w-7xl grid-cols-2 divide-brand-100 sm:grid-cols-4 sm:divide-x dark:divide-white/8">
                        {stats.map(([value, label]) => (
                            <div key={label} className="px-4 py-9 text-center">
                                <strong className="block font-display text-4xl font-light text-brand-600 dark:text-brand-300">{value}</strong>
                                <span className="mt-2 block text-xs uppercase tracking-[0.28em] text-gray-500 dark:text-white/45">{label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-brand-25 py-16 dark:bg-ink-950 sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="max-w-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-brand-600 dark:text-brand-300">Browse your way</p>
                            <h2 className="mt-5 font-display text-4xl font-light text-gray-900 dark:text-white sm:text-5xl">Curated departments</h2>
                            <p className="mt-5 text-gray-600 dark:text-white/65">
                                Find practical favorites, thoughtful upgrades, and standout pieces across the store.
                            </p>
                        </div>

                        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {departments.map((department, index) => (
                                <Link
                                    key={department.name}
                                    to={department.category ? `/shop?category=${encodeURIComponent(department.category)}` : '/shop'}
                                    className="group card-luxe p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-brand-glow"
                                >
                                    <span className="font-display text-lg text-brand-400 dark:text-brand-300/70">0{index + 1}</span>
                                    <h3 className="mt-10 font-display text-2xl font-medium text-gray-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
                                        {department.name}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-white/50">{department.detail}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="surface-ink py-16 sm:py-24">
                    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
                        <div className="max-w-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-brand-300">Your next find is here</p>
                            <h2 className="mt-5 font-display text-4xl font-light sm:text-5xl">
                                A better place to browse, buy, and <span className="italic text-gilded-soft">return</span>.
                            </h2>
                            <p className="mt-5 text-white/55">Browse freely, keep your cart on this device, and provide delivery details only when you place an order.</p>
                        </div>
                        <Link
                            to="/shop"
                            className="shrink-0 rounded-full bg-brand-400 px-8 py-4 font-semibold text-ink-900 transition-colors hover:bg-brand-300"
                        >
                            Browse the collection
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="border-t border-brand-100 bg-white py-9 dark:border-white/8 dark:bg-ink-950">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row lg:px-8">
                    <BrandLogo markClassName="h-9 w-9" />
                    <nav className="flex gap-7 text-sm text-gray-500 dark:text-white/50" aria-label="Footer navigation">
                        <Link to="/shop" className="hover:text-brand-600 dark:hover:text-brand-300">Shop</Link>
                        <Link to="/about" className="hover:text-brand-600 dark:hover:text-brand-300">About</Link>
                        <Link to="/signin" className="hover:text-brand-600 dark:hover:text-brand-300">Admin</Link>
                    </nav>
                    <p className="text-sm text-gray-500 dark:text-white/50">&copy; {new Date().getFullYear()} Irys Store</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
