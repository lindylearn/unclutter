import browser from 'webextension-polyfill';

export function injectSidebar() {
	const iframeUrl = new URL(browser.runtime.getURL('/sidebar/index.html'));
	iframeUrl.searchParams.append('url', window.location.href);

	const sidebarIframe = document.createElement('iframe');
	sidebarIframe.src = iframeUrl.toString();
	sidebarIframe.className = 'sidebar';
	sidebarIframe.setAttribute('id', 'lindylearn-annotations-sidebar');
	sidebarIframe.setAttribute('scrolling', 'no');
	sidebarIframe.setAttribute('frameBorder', '0');

	document.body.append(sidebarIframe);
	return sidebarIframe;
}

export function removeSidebar() {
	const existingSidebar = document.getElementById(
		'lindylearn-annotations-sidebar'
	);
	existingSidebar.parentNode.removeChild(existingSidebar);
}
