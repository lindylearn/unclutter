const template = require("../../tailwind.template.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
    ...template,
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "../../common/library-components/dist/**/*.js",
    ],
};
