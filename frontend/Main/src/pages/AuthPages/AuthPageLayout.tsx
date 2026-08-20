import React from "react";
import { Link } from "react-router-dom";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import BrandLogo from "../../components/common/BrandLogo";

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
            <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">

                {children}

                {/* Brand panel — the seal lit on a deep plum ground. */}
                <div className="relative hidden h-full w-full overflow-hidden bg-ink-900 lg:block lg:w-1/2">
                    <img
                        src="/images/brand/irys-hero.jpg"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-xl"
                    />
                    <div
                        className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-900/85 to-ink-950"
                        aria-hidden="true"
                    />
                    <div
                        className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl"
                        aria-hidden="true"
                    />

                    <div className="relative z-1 flex h-full flex-col justify-between p-10 xl:p-14">
                        <Link to="/" className="self-start" aria-label="Irys Store home">
                            <BrandLogo markClassName="h-14 w-14" tone="onDark" />
                        </Link>

                        <div className="max-w-lg pb-6">
                            <img
                                src="/images/brand/irys-mark.jpg"
                                alt="The Irys Store seal"
                                className="seal-ring mb-10 h-32 w-32 object-cover"
                            />
                            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-brand-300">
                                Administration only
                            </p>
                            <h2 className="mt-5 font-display text-4xl font-light leading-tight text-white xl:text-5xl">
                                Manage products, inventory, and orders in{" "}
                                <span className="italic text-gilded-soft">one place</span>.
                            </h2>
                            <hr className="rule-champagne mt-7 max-w-xs" />
                            <p className="mt-7 text-lg leading-8 text-white/60">
                                The storefront is open to every customer. This secure workspace is
                                reserved for the team operating Irys Store.
                            </p>
                        </div>

                        <p className="text-xs tracking-wide text-white/40">
                            &copy; {new Date().getFullYear()} Irys Store. All rights reserved.
                        </p>
                    </div>
                </div>

                <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
                    <ThemeTogglerTwo />
                </div>
            </div>
        </div>
    );
}
