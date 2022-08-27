import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import fs from "fs";
import glob from "glob";
import path from "path";
import multiInput from "rollup-plugin-multi-input";
import postcss from "rollup-plugin-postcss";
import svelte from "rollup-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";
import tailwindcss from "tailwindcss";

const isProduction = !process.env.ROLLUP_WATCH;

// bundle content scripts
// absolute path imports (starting with "source/") seems to break this.
const contentScriptConfigs = [
    "source/content-script/boot.ts",
    "source/content-script/enhance.ts",
    "source/sidebar/index.tsx",
    "source/sidebar/messaging.ts",
].map((entryPoint) => ({
    input: entryPoint,
    output: {
        file: entryPoint
            .replace("source", "distribution")
            .replace(".ts", ".js")
            .replace(".jsx", ".js"),
        format: "iife", // no way to use es modules, split code by logic instead
    },
    plugins: [
        svelte({
            preprocess: sveltePreprocess({
                postcss: {
                    plugins: [tailwindcss()],
                },
            }),
            emitCss: false, // bundle conponent styles
        }),
        postcss({ plugins: [tailwindcss()] }),
        nodeResolve({ browser: true }),
        commonjs({ include: /node_modules/ }),
        typescript(),
        replace({
            preventAssignment: true,
            "process.env.NODE_ENV": JSON.stringify(
                isProduction ? "production" : "development"
            ),
        }),
        json(),
    ],
}));

// bundle react views and background workers
// using es modules because we can here and it's more readable
const moveVirtualFolder = {
    // chrome doesn't like underscores at root, so move _virtual inside _node_modules
    async generateBundle(_, bundle) {
        const files = Object.entries(bundle);
        for (const [key, file] of files) {
            if (file.fileName.startsWith("_virtual/")) {
                file.fileName = file.fileName.replace(
                    "_virtual",
                    "node_modules/_virtual"
                );
            }
            file.code = file.code.replaceAll(
                "/_virtual/",
                "/node_modules/_virtual/"
            );
        }
    },
};
const esModuleConfig = {
    input: [
        // input order is important here, as common files might overwrite each other
        // "source/settings-page/index.tsx",
        "source/background/events.ts",
        "source/settings-page/index.tsx",
    ],
    output: {
        dir: "distribution",
        format: "es",
        preserveModules: true,
        preserveModulesRoot: "source",
    },
    plugins: [
        typescript(),
        postcss({ plugins: [tailwindcss()] }),
        babel({ babelHelpers: "bundled", presets: ["@babel/preset-react"] }),
        // multiple bundles would overwrite each other's tree-shaked common imports
        multiInput({
            transformOutputPath: (output, input) => {
                // only called for input files - put those in same folder as in source/
                return `${path.basename(output)}`;
            },
        }),
        nodeResolve({ browser: true }),
        commonjs({ include: /node_modules/ }),
        moveVirtualFolder,
        replace({
            preventAssignment: true,
            "process.env.NODE_ENV": JSON.stringify(
                isProduction ? "production" : "development"
            ),
        }),
        json(),
    ],
};

// copy static assets
const fileWatcher = (globs) => ({
    buildStart() {
        for (const item of globs) {
            glob.sync(path.resolve(item)).forEach((filename) => {
                this.addWatchFile(filename);
            });
        }
    },
    async generateBundle() {
        for (const item of globs) {
            glob.sync(path.resolve(item)).forEach((filename) => {
                this.emitFile({
                    type: "asset",
                    fileName: path
                        .relative(process.cwd(), filename)
                        .replace("source/", ""),
                    source: fs.readFileSync(filename),
                });
            });
        }
    },
});
const staticFilesConfig = {
    // needs dummy source file
    input: "source/assets/_rollupMockfile",
    output: {
        file: "distribution/staticFiles",
    },
    plugins: [
        fileWatcher([
            "package.json",
            "source/assets/**/*.{png,svg,ttf,css}",
            "source/**/*.{html,css,json,md,csv}",
        ]),
        {
            writeBundle() {
                fs.rmSync("distribution/staticFiles");
            },
        },
    ],
};

export default contentScriptConfigs
    .concat([esModuleConfig])
    .concat([staticFilesConfig]);
