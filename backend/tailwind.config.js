/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./config/**/*.{js,ts,jsx,tsx,mdx}", // เพิ่ม path นี้เพื่อให้ Tailwind เห็นสีใน agents.ts
        "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [
        require('@tailwindcss/typography'), // เพิ่ม plugin prose ที่ผมใช้ใน ReactMarkdown
    ],
}
