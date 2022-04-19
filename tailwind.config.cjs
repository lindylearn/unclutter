module.exports = {
    theme: {
        extend: {
            keyframes: {
                slidein: {
                    "0%": { transform: "translate(200px)", opacity: "0" },
                    "100%": { transform: "translate(0)", opacity: "1" },
                },
            },
            animation: {
                slidein: "slidein 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            },
        },
        // fontFamily: {
        //     display: ["Poppins", "sans-serif"],
        // },
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
