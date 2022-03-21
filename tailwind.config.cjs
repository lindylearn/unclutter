module.exports = {
    mode: "jit",
    content: [
        "./source/sidebar/**/*.{html,js,ts,jsx,tsx}",
        "./source/popup/**/*.{html,js,ts,jsx,tsx}",
        "./source/settings-page/**/*.{html,js,ts,jsx,tsx}",
    ],
    // darkMode: false, // or 'media' or 'class'
    theme: {
        fontFamily: {
            // also nice: Poppins (too monospace-like)
            // sans: ["Poppins", "sans-serif"],
            mono: ["Space Mono", "monospace"],
        },
        extend: {
            colors: {
                twitter: "#1DA1F2",
                hackernews: "#FB651E",
            },
        },
    },
    variants: {
        extend: {
            textColor: ["visited"],
        },
    },
    plugins: [],
};
