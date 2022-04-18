module.exports = {
    mode: "jit",
    purge: {
        content: ["./source/**/*.svelte", "./source/**/*.tsx"],
    },
    plugins: [],
    corePlugins: {
        preflight: true,
    },
};
