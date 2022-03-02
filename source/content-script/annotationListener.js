import {
	highlightAnnotations,
	removeAllHighlights,
	getHighlightOffsets,
} from './annotationApi';

let listenerRef;
export function createAnnotationListener(sidebarIframe) {
	// highlight new sent annotations, and send back display offsets
	const onMessage = async function ({ data }) {
		if (data.event == 'anchorAnnotations') {
			console.log(
				`anchoring ${data.annotations.length} annotations on page...`
			);
			const anchoredAnnotations = await highlightAnnotations(
				data.annotations
			);
			sidebarIframe.contentWindow.postMessage(
				{
					event: 'anchoredAnnotations',
					annotations: anchoredAnnotations,
				},
				'*'
			);
		}
	};
	window.addEventListener('message', onMessage);
	listenerRef = onMessage;

	// update offsets if the page changes (e.g. after insert of mobile css)
	// _observeHeightChange(document, () => {
	// 	console.log(`page resized, recalculating annotation offsets...`);
	// 	const anchoredAnnotations = getHighlightOffsets();
	// 	sidebarIframe.contentWindow.postMessage(
	// 		{
	// 			event: 'anchoredAnnotations',
	// 			annotations: anchoredAnnotations,
	// 		},
	// 		'*'
	// 	);
	// });
}

export function removeAnnotationListener() {
	removeAllHighlights();
	window.removeEventListener('message', listenerRef);
}

function _observeHeightChange(document, callback) {
	const observer = new MutationObserver(function (mutations) {
		callback(document.body.scrollHeight + 'px');
	});

	observer.observe(document.body, {
		attributes: true,
		attributeOldValue: false,
		characterData: true,
		characterDataOldValue: false,
		childList: true,
		subtree: true,
	});
}
