/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                saraban: ['Sarabun', 'sans-serif'],
            },
            colors: {
                'neo-bg': '#EFF2F9',
                'neo-shadow-dark': '#d1d9e6',
                'neo-shadow-light': '#ffffff',
            },
            boxShadow: {
                'neo-flat': '15px 15px 30px #d1d9e6, -15px -15px 30px #ffffff',
                'neo-inset': 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff',
                'neo-small': '5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff',
            }
        },
    },
    plugins: [],
}
