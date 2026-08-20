import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../components/common/BrandLogo';

const capabilities = [
    {
        number: '01',
        title: 'Simple guest shopping',
        detail: 'Browse products, build a cart, and place an order without creating an account.',
    },
    {
        number: '02',
        title: 'Delivery-ready checkout',
        detail: 'Customers provide only the details needed to prepare and deliver their order.',
    },
    {
        number: '03',
        title: 'Business reporting',
        detail: 'Administrators manage the catalog, inventory, and incoming orders from one secure workspace.',
    },
];

const AboutPage: React.FC = () => (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-ink-950 dark:text-white">
        <nav className="sticky top-0 z-50 border-b border-white/8 bg-ink-900 text-white">
            <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link to="/" aria-label="Irys Store home">
                    <BrandLogo markClassName="h-10 w-10" tone="onDark" />
                </Link>
                <div className="flex items-center gap-2 sm:gap-5">
                    <Link to="/shop" className="px-2 py-2 text-sm font-medium text-white/70 transition-colors hover:text-brand-200">
                        Shop
                    </Link>
                    <Link
                        to="/shop/cart"
                        className="hidden rounded-full bg-brand-400 px-6 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-brand-300 sm:inline-flex"
                    >
                        View cart
                    </Link>
                </div>
            </div>
        </nav>

        <main>
            {/* Editorial hero on plum, the blush ground glowing behind the type. */}
            <section className="relative isolate flex min-h-[62svh] items-end overflow-hidden bg-ink-950">
                <img
                    src="/images/brand/irys-hero.jpg"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/85 to-ink-900/60" aria-hidden="true" />
                <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:px-8">
                    <p className="mb-6 text-xs font-semibold uppercase tracking-[0.42em] text-brand-300">About Irys Store</p>
                    <h1 className="max-w-3xl font-display text-5xl font-light leading-[1.05] text-white sm:text-6xl lg:text-7xl">
                        Commerce made easier to manage and better to{' '}
                        <span className="italic text-gilded-soft">explore</span>.
                    </h1>
                    <hr className="rule-champagne mt-9 max-w-md" />
                    <p className="mt-8 max-w-2xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
                        Irys Store gives every visitor a direct path from discovery to delivery,
                        without putting an account form between the customer and the catalog.
                    </p>
                </div>
            </section>

            <section className="border-b border-brand-100 bg-white py-16 dark:border-white/8 dark:bg-ink-950 sm:py-24">
                <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.42em] text-brand-600 dark:text-brand-300">The project</p>
                        <h2 className="mt-5 font-display text-4xl font-light leading-tight text-gray-900 dark:text-white">
                            Built in Morocco, designed for real workflows.
                        </h2>
                    </div>
                    <div className="space-y-5 text-base leading-8 text-gray-600 dark:text-white/65">
                        <p>
                            Irys Store began as a Mini Projet JEE at ENSA Khouribga. The goal was to build a complete e-commerce platform that brings catalog management, purchasing, fulfillment, and reporting into one system.
                        </p>
                        <p>
                            The application is built with Spring Boot, React, TypeScript, and PostgreSQL. Customers use a fast public storefront while administrators operate the catalog and fulfill orders in a protected workspace.
                        </p>
                    </div>
                </div>
            </section>

            <section className="bg-brand-25 py-16 dark:bg-ink-900 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.42em] text-brand-600 dark:text-brand-300">Platform capabilities</p>
                        <h2 className="mt-5 font-display text-4xl font-light text-gray-900 dark:text-white">A public shop with a focused workflow.</h2>
                    </div>
                    <div className="mt-12 grid gap-5 md:grid-cols-3">
                        {capabilities.map((capability) => (
                            <article key={capability.number} className="card-luxe p-7">
                                <span className="font-display text-lg text-brand-400 dark:text-brand-300/70">{capability.number}</span>
                                <h3 className="mt-8 font-display text-2xl font-medium text-gray-900 dark:text-white">{capability.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-gray-500 dark:text-white/55">{capability.detail}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-y border-brand-100 bg-white py-16 dark:border-white/8 dark:bg-ink-950 sm:py-24">
                <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 md:grid-cols-[240px_1fr] md:items-center lg:px-8">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 -m-6 rounded-full bg-champagne-200/30 blur-3xl dark:bg-brand-500/20" aria-hidden="true" />
                        <img
                            src="/images/brand/irys-mark.jpg"
                            alt="The Irys Store seal"
                            className="seal-ring relative h-52 w-52 object-cover"
                        />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.42em] text-brand-600 dark:text-brand-300">Founder and developer</p>
                        <h2 className="mt-5 font-display text-4xl font-light text-gray-900 dark:text-white">Mouad El Abbassi</h2>
                        <hr className="rule-champagne mt-6 max-w-xs" />
                        <p className="mt-6 leading-8 text-gray-600 dark:text-white/65">
                            A computer science student at ENSA Khouribga focused on full-stack development, software architecture, and business intelligence. Irys Store demonstrates how those disciplines can support a practical, end-to-end commerce product.
                        </p>
                    </div>
                </div>
            </section>

            <section className="surface-ink py-16 sm:py-24">
                <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-10 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
                    <div>
                        <h2 className="font-display text-4xl font-light">
                            Explore <span className="italic text-gilded-soft">Irys Store</span>.
                        </h2>
                        <p className="mt-4 max-w-xl text-white/55">Browse the catalog, add what you love, and share delivery details when you are ready to order.</p>
                    </div>
                    <div className="flex w-full flex-wrap gap-3 md:w-auto">
                        <Link to="/shop" className="rounded-full bg-brand-400 px-7 py-3.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-brand-300">
                            Browse products
                        </Link>
                        <Link to="/shop/cart" className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-brand-300 hover:bg-white/5">
                            View cart
                        </Link>
                    </div>
                </div>
            </section>
        </main>

        <footer className="border-t border-white/8 bg-ink-950 py-8 text-white/50">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <BrandLogo markClassName="h-9 w-9" tone="onDark" />
                <p>&copy; {new Date().getFullYear()} Irys Store. All rights reserved.</p>
            </div>
        </footer>
    </div>
);

export default AboutPage;
