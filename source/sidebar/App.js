import React, { useEffect, useState } from 'react';

import AnnotationsList from './components/AnnotationsList';
import { getAnnotations } from './common/api';
import { createDraftAnnotation } from '../common/getAnnotations';

export default function App({ url }) {
	const [annotations, setAnnotations] = useState([]);

	function updateAnnotations(newAnnotations) {
		window.top.postMessage(
			{ event: 'anchorAnnotations', annotations: newAnnotations },
			'*'
		);
	}

	window.onmessage = function ({ data }) {
		if (data.event === 'createHighlight') {
			setAnnotations([...annotations, data.annotation]);
		} else if (data.event === 'anchoredAnnotations') {
			setAnnotations(data.annotations);
		}
	};

	console.log(annotations);

	useEffect(async () => {
		let { annotations } = await getAnnotations(url);
		updateAnnotations(annotations);
	}, []);

	return (
		<div>
			<div>
				<AnnotationsList
					url={url}
					annotations={annotations}
					setAnnotations={setAnnotations}
					// upvotedAnnotations={upvotedAnnotations}
					// upvoteAnnotation={upvoteAnnotation}
				/>
			</div>
		</div>
	);
}
