import React from 'react';

/**
 * The Irys lockup: the rose-gold seal as a medallion, followed by the
 * wordmark in the same high-contrast serif the seal is engraved in.
 */
type BrandTone = 'auto' | 'onDark' | 'onLight';

interface BrandLogoProps {
    /** Show the seal only — used by collapsed sidebars. */
    compact?: boolean;
    className?: string;
    markClassName?: string;
    /** Which ground the lockup sits on. `auto` follows the light/dark theme. */
    tone?: BrandTone;
    /** Escape hatch for one-off wordmark colouring. */
    wordmarkClassName?: string;
}

const TONE: Record<BrandTone, { word: string; accent: string }> = {
    auto: {
        word: 'text-gray-900 dark:text-white',
        accent: 'text-brand-500 dark:text-brand-300',
    },
    onDark: {
        word: 'text-white',
        accent: 'text-brand-300',
    },
    onLight: {
        word: 'text-gray-900',
        accent: 'text-brand-500',
    },
};

const BrandLogo: React.FC<BrandLogoProps> = ({
    compact = false,
    className = '',
    markClassName = 'h-10 w-10',
    tone = 'auto',
    wordmarkClassName,
}) => {
    const palette = TONE[tone] ?? TONE.auto;

    return (
        <span
            className={`inline-flex items-center gap-3 ${className}`}
            aria-label="Irys Store"
        >
            <img
                src="/images/brand/irys-mark.jpg"
                alt=""
                aria-hidden="true"
                className={`${markClassName} seal-ring shrink-0 object-cover`}
            />
            {!compact && (
                <span className="flex flex-col justify-center leading-none">
                    <span
                        className={`brand-wordmark whitespace-nowrap text-[1.15rem] ${
                            wordmarkClassName ?? palette.word
                        }`}
                    >
                        Irys
                    </span>
                    <span
                        className={`mt-[0.2em] whitespace-nowrap text-[0.55rem] font-medium uppercase tracking-[0.4em] ${palette.accent}`}
                    >
                        Store
                    </span>
                </span>
            )}
        </span>
    );
};

export default BrandLogo;
