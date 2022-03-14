import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import fs from "fs";
import glob from "glob";
import path from "path";

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

export default [
    "source/background/background.js",
    "source/content-script/boot.js",
    "source/content-script/enhance.js",
    "source/content-script/switch/index.js",
    // "source/options/index.js",
    // "source/popup/index.js",
]
    .map((entryPoint) => ({
        input: entryPoint,
        output: {
            file: entryPoint.replace("source", "distribution"),
            format: "iife",
            // preserveModules: true,
        },
        plugins: [
            nodeResolve({ browser: true, preferBuiltins: true }),
            commonjs({ include: /node_modules/ }),
            // babel({ babelHelpers: "bundled" }),
        ],
    }))
    .concat({
        // needs dummy source file
        input: "source/common/api.js",
        output: {
            file: "distribution/dummy",
        },
        plugins: [
            fileWatcher([
                "source/assets/**/*.{png,svg}",
                "source/**/*.{html,css,json}",
            ]),
            {
                writeBundle() {
                    fs.rmSync("distribution/dummy");
                },
            },
        ],
    });
