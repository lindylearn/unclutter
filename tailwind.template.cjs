const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
    theme: {
        extend: {
            colors: {
                lindy: "hsl(51, 80%, 64%)", // == #edd75b
                lindyDark: "hsl(51, 80%, 43%)",
                lindyShadow: "rgba(237 215 91 / 60%)",
                chrome: "#f1f3f4",
                chromeDark: "#292a2d",

                background: colors.stone[50],
                backgroundDark: colors.stone[900],
            },
            keyframes: {
                wiggle: {
                    "0%, 100%": { transform: "rotate(0deg)" },
                    "30%": { transform: "rotate(2deg)" },
                    "60%": { transform: "rotate(-1deg)" },
                },
                slidein: {
                    "0%": { transform: "translate(400px)", opacity: "0" },
                    "100%": { transform: "translate(0)", opacity: "1" },
                },
                slideinSlightly: {
                    "0%": { transform: "translate(100px)", opacity: "0" },
                    "100%": { transform: "translate(0)", opacity: "1" },
                },
                fadein: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
            },
            animation: {
                wiggle: "wiggle 0.5s ease-in-out",
                slidein: "slidein 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                slideinSlightly:
                    "slideinSlightly 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                fadein: "fadein 0.2s ease-out",
            },
            boxShadow: {
                article:
                    "0 1px 2px 1px rgb(0 0 0 / 0.15), 0 4px 6px -1px rgb(0 0 0 / 0.1)",
                articleHover:
                    "0 1px 2px 1px rgb(0 0 0 / 0.15), 0 20px 25px -5px rgb(0 0 0 / 0.1)",
                articleSmall:
                    "0 0px 2px 0px rgb(0 0 0 / 0.15), 0 4px 6px -1px rgb(0 0 0 / 0.1)",
                articleSmallHover:
                    "0 0px 2px 0px rgb(0 0 0 / 0.15), 0 20px 25px -5px rgb(0 0 0 / 0.1)",
            },
        },
        fontFamily: {
            title: ["Poppins", "sans-serif"],
            text: ["Work Sans", "sans-serif"],
            chrome: ["Roboto", "system-ui", "sans-serif"],
        },
    },
    plugins: [],
};
