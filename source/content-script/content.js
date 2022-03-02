import browser from 'webextension-polyfill';

import { patchDocument, unPatchDocument } from '../pageview/patching';

browser.runtime.onMessage.addListener((event) => {
	if (event === 'togglePageView') {
		togglePageView();
	}
});

async function togglePageView() {
	if (!document.body.classList.contains('pageview')) {
		patchDocument();
		injectSidebar();

		document.body.classList.add('pageview');
	} else {
		document.body.classList.remove('pageview');

		unPatchDocument();
		destroySidebar();
	}
}

function injectSidebar() {
	const iframeUrl = new URL(browser.runtime.getURL('/sidebar/index.html'));
	iframeUrl.searchParams.append('url', window.location.href);

	const sidebarIframe = document.createElement('iframe');
	sidebarIframe.src = iframeUrl.toString();
	sidebarIframe.className = 'sidebar';
	sidebarIframe.setAttribute('id', 'lindylearn-annotations-sidebar');
	sidebarIframe.setAttribute('scrolling', 'no');
	sidebarIframe.setAttribute('frameBorder', '0');

	document.body.append(sidebarIframe);
}

function destroySidebar() {
	const existingSidebar = document.getElementById(
		'lindylearn-annotations-sidebar'
	);
	existingSidebar.parentNode.removeChild(existingSidebar);
}
