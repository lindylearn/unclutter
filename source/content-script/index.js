import browser from 'webextension-polyfill';

import {
	createAnnotationListener,
	removeAnnotationListener,
} from './annotationListener';
import {
	createSelectionListener,
	removeSelectionListener,
} from './selectionListener';
import { injectSidebar, removeSidebar } from '../pageview/injectSidebar';
import {
	patchDocumentStyle,
	unPatchDocumentStyle,
} from '../pageview/styleChanges';

browser.runtime.onMessage.addListener((event) => {
	if (event === 'togglePageView') {
		togglePageView();
	}
});

async function togglePageView() {
	const isInPageView = document.body.classList.contains('pageview');
	if (!isInPageView) {
		patchDocumentStyle();
		const sidebarIframe = injectSidebar();

		createAnnotationListener(sidebarIframe);
		createSelectionListener(sidebarIframe);

		// make visible once set up
		document.body.classList.add('pageview');
	} else {
		// immediately hide
		document.body.classList.remove('pageview');

		unPatchDocumentStyle();
		removeSidebar();

		removeAnnotationListener();
		removeSelectionListener();
	}
}
