import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import fs from "fs";
import glob from "glob";
import path from "path";

// bundle content scripts
const contentScriptConfigs = [
    "source/content-script/boot.js",
    "source/content-script/enhance.js",
].map((entryPoint) => ({
    input: entryPoint,
    output: {
        file: entryPoint.replace("source", "distribution"),
        format: "iife", // no way to use es modules, split code by logic instead
    },
    plugins: [
        nodeResolve({ browser: true }),
        commonjs({ include: /node_modules/ }),
    ],
}));

// bundle react views
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
const reactConfigs = [
    // "source/options/index.js",
    "source/popup/index.js",
    "source/popup/onclick.js",
].map((entryPoint) => ({
    input: entryPoint,
    output: {
        dir: "distribution",
        format: "es",
        preserveModules: true,
        preserveModulesRoot: "source",
    },
    plugins: [
        nodeResolve({ browser: true }),
        commonjs({ include: /node_modules/ }),
        babel({ babelHelpers: "bundled", presets: ["@babel/preset-react"] }),
        moveVirtualFolder,
        replace({
            preventAssignment: true,
            "process.env.NODE_ENV": JSON.stringify("production"),
        }),
    ],
}));

// bundle background service worker
const serviceWorkerConfig = {
    input: "source/background/events.js",
    output: {
        dir: "distribution",
        format: "es", // can use es modules here
        preserveModules: true,
        preserveModulesRoot: "source",
    },
    plugins: [
        nodeResolve({ browser: true }),
        commonjs({ include: /node_modules/ }),
        moveVirtualFolder,
        replace({
            preventAssignment: true,
            "process.env.NODE_ENV": JSON.stringify("production"),
        }),
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
    input: "source/common/api.js",
    output: {
        file: "distribution/staticFiles",
    },
    plugins: [
        fileWatcher([
            "package.json",
            "source/assets/**/*.{png,svg}",
            "source/**/*.{html,css,json,md}",
        ]),
        {
            writeBundle() {
                fs.rmSync("distribution/staticFiles");
            },
        },
    ],
};

export default contentScriptConfigs
    .concat(reactConfigs)
    .concat([serviceWorkerConfig])
    .concat([staticFilesConfig]);
