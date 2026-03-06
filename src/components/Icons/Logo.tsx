import React from 'react';

interface LogoProps {
    size?: number;
    className?: string;
    glow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '', glow = false }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ overflow: 'visible' }}
        >
            <defs>
                <linearGradient id="aura-main" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--pri)" />
                    <stop offset="100%" stopColor="var(--acc)" />
                </linearGradient>

                <linearGradient id="aura-cross" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--pri)" />
                    <stop offset="100%" stopColor="var(--acc)" />
                </linearGradient>

                <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Main Structural 'A' */}
            <path
                d="M 24 84 L 50 20 L 76 84"
                stroke="url(#aura-main)"
                strokeWidth="15"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={glow ? "url(#logoGlow)" : undefined}
            />

            {/* Crossbar */}
            <line
                x1="33"
                y1="62"
                x2="67"
                y2="62"
                stroke="url(#aura-cross)"
                strokeWidth="15"
                strokeLinecap="round"
                filter={glow ? "url(#logoGlow)" : undefined}
            />

            {/* Spinning Ring */}
            <circle
                cx="50"
                cy="52"
                r="44"
                stroke="url(#aura-main)"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="160 80"
                strokeLinecap="round"
                opacity="0.75"
            >
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 50 52"
                    to="360 50 52"
                    dur="10s"
                    repeatCount="indefinite"
                />
            </circle>
        </svg>
    );
};
