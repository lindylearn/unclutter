module.exports = {
    mode: "jit",
    purge: {
        content: ["./source/**/*.svelte"],
    },
    plugins: [],
    corePlugins: {
        preflight: false,
    },
};
