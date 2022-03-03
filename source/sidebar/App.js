import React, { useEffect, useState } from 'react';

import AnnotationsList from './components/AnnotationsList';
import {
	getAnnotations,
	createAnnotation,
	deleteAnnotation as deleteAnnotationApi,
} from './common/api';
import {
	createDraftAnnotation,
	hypothesisToLindyFormat,
} from '../common/getAnnotations';
import PageNote from './components/PageNote';
import PopularityMessage from './components/PopularityMessage';
import PageMetadataMessage from './components/PageMetadataMessage';
import AnnotationsInfoMessage from './components/AnnotationsInfoMessage';

export default function App({ url }) {
	const [annotations, setAnnotations] = useState([]);

	window.onmessage = async function ({ data }) {
		if (data.event === 'createHighlight') {
			const localAnnotation = data.annotation;
			// setAnnotations([...annotations, data.annotation]);
			const hypothesisAnnotation = await createAnnotation(
				url,
				localAnnotation.quote_html_selector
			);
			const annotation = hypothesisToLindyFormat(
				hypothesisAnnotation,
				localAnnotation.displayOffset
			);
			setAnnotations([
				...annotations,
				{
					...annotation,
					displayOffset: localAnnotation.displayOffset,
					localId: localAnnotation.localId,
				},
			]);
		} else if (data.event === 'anchoredAnnotations') {
			// data.annotations.push({
			// 	...createDraftAnnotation(url, []),
			// 	displayOffset: 400,
			// });
			setAnnotations(data.annotations);
		} else if (data.event === 'changedDisplayOffset') {
			const updatedAnnotations = annotations.map((a) => ({
				...a,
				displayOffset:
					data.offsetById[a.localId] || data.offsetById[a.id],
			}));
			setAnnotations(updatedAnnotations);
		}
	};

	useEffect(async () => {
		const annotations = await getAnnotations(url);
		window.top.postMessage(
			{ event: 'anchorAnnotations', annotations },
			'*'
		);
	}, []);

	async function deleteAnnotation(annotation) {
		setAnnotations(annotations.filter((a) => a.id != annotation.id));
		window.top.postMessage({ event: 'removeHighlight', annotation }, '*');

		deleteAnnotationApi(annotation.id);
	}

	return (
		// x margin to show slight shadow (iframe allows no overflow)
		<div className="mx-2">
			<div className="absolute w-full px-2 flex flex-col gap-2">
				{/* <PageMetadataMessage url={url} /> */}
				<PopularityMessage url={url} />
				{/* <AnnotationsInfoMessage annotations={annotations} /> */}
				<PageNote />
			</div>
			<AnnotationsList
				url={url}
				annotations={annotations}
				setAnnotations={setAnnotations}
				deleteAnnotation={deleteAnnotation}
				// upvotedAnnotations={upvotedAnnotations}
				// upvoteAnnotation={upvoteAnnotation}
			/>
		</div>
	);
}
