import browser from "webextension-polyfill";

import { beautifyDocument, unBeautifyDocument } from "./pageview/patching";

browser.runtime.onMessage.addListener((event) => {
	if (event === "togglePageView") {
		togglePageView();
	}
});

async function togglePageView() {
	const existingSidebar = document.getElementById(
		"lindylearn-annotations-sidebar"
	);
	if (!existingSidebar) {
		injectSidebar();
		beautifyDocument(document);
	} else {
		destroySidebar(existingSidebar);
		unBeautifyDocument(document);
	}
}

function injectSidebar() {
	document.body.classList.add("pageview");

	const sidebarIframe = document.createElement("iframe");
	sidebarIframe.src = browser.runtime.getURL("/sidebar/index.html");
	sidebarIframe.className = "sidebar";
	sidebarIframe.setAttribute("id", "lindylearn-annotations-sidebar");
	sidebarIframe.setAttribute("scrolling", "no");
	sidebarIframe.setAttribute("frameBorder", "0");

	document.body.append(sidebarIframe);
}

function destroySidebar(existingSidebar) {
	document.body.classList.remove("pageview");

	existingSidebar.parentNode.removeChild(existingSidebar);
}
