const template = require("../../tailwind.template.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
    ...template,
    content: [
        "./source/**/*.html",
        "./source/**/*.tsx",
        "./source/**/*.svelte",
        "../../common/library-components/dist/**/*.js",
    ],
};
