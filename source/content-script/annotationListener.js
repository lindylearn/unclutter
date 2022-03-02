import {
	anchor as anchorHTML,
	describe as describeAnnotation,
} from '../common/hypothesis/annotator/anchoring/html';
import {
	highlightRange,
	removeAllHighlights,
} from '../common/hypothesis/annotator/highlighter';
import { getAnnotationColor } from '../common/styling';

export function injectAnnotationListener(sidebarIframe) {
	// send message on mouse selection
	const mouseupHandler = () =>
		annotationListener((selectors) => {
			sidebarIframe.contentWindow.postMessage(
				{
					event: 'createHighlight',
					selectors,
				},
				'*'
			);
		});
	document.addEventListener('mouseup', mouseupHandler);

	// listen to annotation updates, anchor them, and send back
	window.onmessage = async function ({ data }) {
		if (data.event == 'anchorAnnotations') {
			removeAllHighlights(document.body);
			const annotations = await highlightAnnotations(data.annotations);
			sidebarIframe.contentWindow.postMessage(
				{
					event: 'anchoredAnnotations',
					annotations,
				},
				'*'
			);
		}
	};
}

export function removeAnnotationListener() {
	// TODO
	document.removeEventListener('mouseup', mouseupHandler);
}

function annotationListener(createHighlight) {
	const selection = document.getSelection();
	if (!selection || !selection.toString().trim()) {
		return;
	}
	// Typically there's only one range (https://developer.mozilla.org/en-US/docs/Web/API/Selection#multiple_ranges_in_a_selection)
	const range = selection.getRangeAt(0);

	// anchor
	const annotationSelector = describeAnnotation(document.body, range);
	if (!annotationSelector) {
		return;
	}

	// create annotation state
	// offset will be set normally once EmbeddedPage renders
	createHighlight(annotationSelector);

	// remove user selection
	selection.empty();
}

async function highlightAnnotations(annotations, documentScale = 1.0) {
	const body = document.body;
	const pageOffset = document.body.offsetTop;

	const annotationOffsets = [];
	await Promise.all(
		annotations.map(async (annotation) => {
			try {
				const range = await anchorHTML(
					body,
					annotation.quote_html_selector
				);
				if (!range) {
					return;
				}
				const highlightedNodes = highlightRange(
					range,
					getAnnotationColor(annotation)
				);

				// getBoundingClientRect() is relative to scrolled viewport
				const elementOffset =
					highlightedNodes[0].getBoundingClientRect().top +
					window.scrollY;
				const displayOffset =
					pageOffset + elementOffset * documentScale;
				annotationOffsets.push({ displayOffset, ...annotation });
			} catch (err) {
				console.error(`Could not anchor annotation:`, annotation, err);
			}
		})
	);

	return annotationOffsets;
}
