import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const domContainer = document.querySelector("#react-root");
const root = createRoot(domContainer!);

const urlParams = new URLSearchParams(document.location.search);
root.render(<App {...Object.fromEntries(urlParams)} />);
