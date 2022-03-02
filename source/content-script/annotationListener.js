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
	_observeHeightChange(document, () => {
		console.log(`page resized, recalculating annotation offsets...`);
		const offsetById = getHighlightOffsets();
		sidebarIframe.contentWindow.postMessage(
			{
				event: 'changedDisplayOffset',
				offsetById,
			},
			'*'
		);
	});
}

export function removeAnnotationListener() {
	removeAllHighlights();
	window.removeEventListener('message', listenerRef);
	resizeObserver?.unobserve(document.body);
}

let resizeObserver;
function _observeHeightChange(document, callback) {
	let oldHeight = document.body.scrollHeight;
	resizeObserver = new ResizeObserver((entries) => {
		const newHeight = entries[0].target.scrollHeight;

		if (newHeight !== oldHeight) {
			callback(document.body.scrollHeight + 'px');
			oldHeight = newHeight;
		}
	});

	resizeObserver.observe(document.body);
}
