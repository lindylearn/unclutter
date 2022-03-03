import { anchor as anchorHTML } from '../common/hypothesis/annotator/anchoring/html';
import {
	highlightRange,
	removeAllHighlights as removeAllHighlightsApi,
	removeHighlights as removeHighlightsApi,
} from '../common/hypothesis/annotator/highlighter';
import { getAnnotationColor } from '../common/styling';

export async function highlightAnnotations(annotations) {
	const body = document.body;

	const anchoredAnnotations = [];
	await Promise.all(
		annotations.map(async (annotation) => {
			try {
				const range = await anchorHTML(
					body,
					annotation.quote_html_selector
				);
				if (!range) {
					// e.g. selection removed?
					return;
				}

				const highlightedNodes = highlightRange(
					annotation.id,
					range,
					getAnnotationColor(annotation)
				);
				if (!highlightedNodes) {
					throw Error('includes no highlighted nodes');
				}
				const displayOffset = _getNodeOffset(highlightedNodes[0]);

				anchoredAnnotations.push({ displayOffset, ...annotation });
			} catch (err) {
				// console.error(`Could not anchor annotation:`, annotation, err);
			}
		})
	);

	return anchoredAnnotations;
}

export function removeAllHighlights() {
	removeAllHighlightsApi(document.body);
}

export function removeHighlight(annotation) {
	const nodes = document.querySelectorAll(
		`[id=${annotation.localId || annotation.id}]`
	);
	removeHighlightsApi([...nodes]);
}

export function getHighlightOffsets() {
	const body = document.body;

	const highlightNodes = [...body.querySelectorAll('.lindy-highlight')];

	// highlight may include multiple nodes across html tags
	// so iterate nodes in sequence and only take the first offset
	const offsetById = {};
	for (const node of highlightNodes) {
		if (offsetById[node.id]) {
			continue;
		}
		const displayOffset = _getNodeOffset(node);
		offsetById[node.id] = displayOffset;
	}

	return offsetById;
}

function _getNodeOffset(node, documentScale = 1, listOffsetTop = 20) {
	const pageOffset = document.body.offsetTop;

	// getBoundingClientRect() is relative to scrolled viewport
	const elementOffset = node.getBoundingClientRect().top + window.scrollY;
	const displayOffset = pageOffset + elementOffset * documentScale;
	return displayOffset - listOffsetTop;
}
