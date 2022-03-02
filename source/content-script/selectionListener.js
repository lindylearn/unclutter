import { describe as describeAnnotation } from '../common/hypothesis/annotator/anchoring/html';
import { highlightAnnotations } from './annotationApi';
import { createDraftAnnotation } from '../common/getAnnotations';

let listenerRef;
export function createSelectionListener(sidebarIframe) {
	const mouseupHandler = () =>
		createAnnotationFromSelection((annotation) => {
			sidebarIframe.contentWindow.postMessage(
				{
					event: 'createHighlight',
					annotation,
				},
				'*'
			);
		});
	document.addEventListener('mouseup', mouseupHandler);
	listenerRef = mouseupHandler;
}

export function removeSelectionListener() {
	document.removeEventListener('mouseup', listenerRef);
}

async function createAnnotationFromSelection(callback) {
	// get mouse selection
	const selection = document.getSelection();
	if (!selection || !selection.toString().trim()) {
		return;
	}
	const range = selection.getRangeAt(0);

	// convert to text anchor
	const annotationSelector = describeAnnotation(document.body, range);
	if (!annotationSelector) {
		return;
	}

	// create highlight
	let annotation = createDraftAnnotation(
		window.location.href,
		annotationSelector
	);
	const offsets = await highlightAnnotations([annotation]);
	annotation = { ...annotation, displayOffset: offsets[0].displayOffset };
	console.log(annotation);
	// notify sidebar and upload logic
	callback(annotation);

	// remove user selection
	selection.empty();
}
