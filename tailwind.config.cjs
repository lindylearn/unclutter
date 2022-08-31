module.exports = {
    theme: {
        extend: {
            colors: {
                lindy: "hsl(51, 80%, 64%)", // == #edd75b
                lindyDark: "hsl(51, 80%, 43%)",
            },
            keyframes: {
                slidein: {
                    "0%": { transform: "translate(200px)", opacity: "0" },
                    "100%": { transform: "translate(0)", opacity: "1" },
                },
            },
            animation: {
                slidein: "slidein 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            },
            boxShadow: {
                article:
                    "0 1px 2px 1px rgb(0 0 0 / 0.15), 0 4px 6px -1px rgb(0 0 0 / 0.1)",
                articleHover:
                    "0 1px 2px 1px rgb(0 0 0 / 0.15), 0 20px 25px -5px rgb(0 0 0 / 0.1)",
            },
        },
        fontFamily: {
            header: ["Poppins", "sans-serif"],
            paragraph: ["Work Sans", "sans-serif"],
        },
    },
    mode: "jit",
    purge: {
        content: ["./source/**/*.svelte", "./source/**/*.tsx"],
    },
    plugins: [],
    corePlugins: {
        preflight: true,
    },
};
