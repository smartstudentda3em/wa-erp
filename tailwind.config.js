import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/**/*.blade.php',
        './resources/**/*.{js,jsx,ts,tsx}',
        './resources/**/*.vue',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Cairo', 'Inter', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // أسطح وخلفيات ونصوص عبر متغيّرات CSS (متكيّفة فاتح/داكن)
                bg: 'rgb(var(--bg) / <alpha-value>)',
                surface: 'rgb(var(--surface) / <alpha-value>)',
                'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
                line: 'rgb(var(--border) / <alpha-value>)',
                content: 'rgb(var(--text) / <alpha-value>)',
                muted: 'rgb(var(--text-muted) / <alpha-value>)',
                // العلامة: زمردي → فيروزي
                brand: {
                    DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
                    2: 'rgb(var(--brand-2) / <alpha-value>)',
                },
            },
            boxShadow: {
                soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 6px -1px rgb(0 0 0 / 0.06)',
                card: '0 2px 8px -2px rgb(0 0 0 / 0.06), 0 8px 24px -8px rgb(0 0 0 / 0.10)',
                pop: '0 10px 40px -12px rgb(0 0 0 / 0.25)',
                glow: '0 0 0 3px rgb(var(--brand) / 0.15)',
            },
            borderRadius: {
                xl: '0.875rem',
                '2xl': '1.125rem',
            },
            keyframes: {
                'fade-in': { '0%': { opacity: 0, transform: 'translateY(4px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
                'scale-in': { '0%': { opacity: 0, transform: 'scale(.97)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
                'pulse-ring': { '0%': { transform: 'scale(.8)', opacity: .5 }, '80%,100%': { transform: 'scale(2.2)', opacity: 0 } },
            },
            animation: {
                'fade-in': 'fade-in .25s ease-out both',
                'scale-in': 'scale-in .18s ease-out both',
                'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0,0,.2,1) infinite',
            },
        },
    },
    plugins: [],
};
