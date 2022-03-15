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
    "source/content-script/switch/index.js",
    // "source/options/index.js",
    "source/popup/index.js",
].map((entryPoint) => ({
    input: entryPoint,
    output: {
        file: entryPoint.replace("source", "distribution"),
        format: "iife", // no way to use es modules, split code by logic instead
    },
    plugins: [
        nodeResolve({ browser: true }),
        commonjs({ include: /node_modules/ }),
        babel({ babelHelpers: "bundled", presets: ["@babel/preset-react"] }),
    ],
}));

// bundle background service worker
const serviceWorkerConfig = {
    input: "source/background/events.js",
    output: {
        dir: "distribution",
        format: "es", // can use es modules here
        preserveModules: true,
    },
    plugins: [
        nodeResolve({ browser: true }),
        commonjs({ include: /node_modules/ }),
        // babel({ babelHelpers: "bundled" }),
        {
            // don't write to "source" subdirectory
            async generateBundle(_, bundle) {
                const files = Object.entries(bundle);
                for (const [key, file] of files) {
                    if (file.fileName.startsWith("source/")) {
                        file.fileName = file.fileName.replace("source/", "");
                    }
                }
            },
        },
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
    .concat([serviceWorkerConfig])
    .concat([staticFilesConfig]);
