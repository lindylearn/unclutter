module.exports = {
    mode: "jit",
    purge: {
        content: ["./source/**/*.svelte", "./source/settings-page/**/*.js"],
    },
    plugins: [],
    corePlugins: {
        preflight: true,
    },
};
