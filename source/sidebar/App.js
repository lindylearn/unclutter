import React, { useEffect, useState } from 'react';

import AnnotationsList from './components/AnnotationsList';
import { getAnnotations } from './common/api';
import { createDraftAnnotation } from '../common/getAnnotations';
import PageNote from './components/PageNote';
import PopularityMessage from './components/PopularityMessage';
import PageMetadataMessage from './components/PageMetadataMessage';
import AnnotationsInfoMessage from './components/AnnotationsInfoMessage';

export default function App({ url }) {
	const [annotations, setAnnotations] = useState([]);

	window.onmessage = function ({ data }) {
		if (data.event === 'createHighlight') {
			setAnnotations([...annotations, data.annotation]);
		} else if (data.event === 'anchoredAnnotations') {
			// data.annotations.push({
			// 	...createDraftAnnotation(url, []),
			// 	displayOffset: 400,
			// });
			setAnnotations(data.annotations);
		} else if (data.event === 'changedDisplayOffset') {
			const updatedAnnotations = annotations.map((a) => ({
				...a,
				displayOffset: data.offsetById[a.id],
			}));
			setAnnotations(updatedAnnotations);
		}
	};

	useEffect(async () => {
		let { annotations } = await getAnnotations(url);
		window.top.postMessage(
			{ event: 'anchorAnnotations', annotations },
			'*'
		);
	}, []);

	// console.log(annotations);

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
				// upvotedAnnotations={upvotedAnnotations}
				// upvoteAnnotation={upvoteAnnotation}
			/>
		</div>
	);
}
