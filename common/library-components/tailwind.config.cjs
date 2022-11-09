const template = require("../../tailwind.template.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
    ...template,
    content: ["./src/**/*.tsx"],
    darkMode: "class",
};
