module.exports = {
    mode: "jit",
    purge: {
        content: [
            "./source/**/*.svelte",
            "./source/**/*.tsx",
            "./source/sidebar/**/*.js",
        ],
    },
    plugins: [],
    corePlugins: {
        preflight: true,
    },
};
