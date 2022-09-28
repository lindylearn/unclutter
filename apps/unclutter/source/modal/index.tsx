import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import "@unclutter/library-components/styles/globals.css";
import "@unclutter/library-components/styles/ArticlePreview.css";
import "@unclutter/library-components/styles/ProgressCircle.css";
import "./index.css";

const domContainer = document.querySelector("#react-root");
const root = createRoot(domContainer!);

const urlParams = new URLSearchParams(document.location.search);
// @ts-ignore
root.render(<App {...Object.fromEntries(urlParams)} />);
