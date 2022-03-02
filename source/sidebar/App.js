import React, { useEffect, useState } from 'react';

import AnnotationsList from './components/AnnotationsList';
import { getAnnotations } from './common/api';

export default function App({ url }) {
	const [annotations, setAnnotations] = useState([]);

	useEffect(async () => {
		let { annotations } = await getAnnotations(url);
		setAnnotations(annotations);
	}, []);

	console.log(annotations);

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
