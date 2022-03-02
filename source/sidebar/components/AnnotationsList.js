import Annotation from './Annotation';
import AnnotationDraft from './AnnotationDraft';

function AnnotationsList({
	url,
	annotations,
	onClick = null,
	setAnnotations,
	upvotedAnnotations = {},
	upvoteAnnotation = null,
}) {
	if (!annotations) {
		return <div></div>;
	}

	annotations = annotations.map((a) => ({
		...a,
		displayOffset: a.displayOffset - 20,
	}));

	const orderedAnnotations = annotations.sort(
		(a, b) => a.displayOffset - b.displayOffset
	);

	const groupedAnnotations = [];
	let lastOffset = -Infinity;
	for (const annotation of orderedAnnotations) {
		if (annotation.displayOffset < lastOffset + 200) {
			// conflict
			groupedAnnotations[groupedAnnotations.length - 1] = [
				...groupedAnnotations[groupedAnnotations.length - 1],
				annotation,
			];
		} else {
			// no conflict
			groupedAnnotations.push([annotation]);
		}
		lastOffset = annotation.displayOffset;
	}

	function deleteAnnotation(annotation) {
		setAnnotations(annotations.filter((a) => a.link != annotation.link));
	}

	return (
		<div className="relative flex-grow" onClick={onClick}>
			{groupedAnnotations.map((groupedAnnotations) => (
				<div
					key={groupedAnnotations[0].displayOffset}
					className="absolute w-5/6 flex flex-col gap-2"
					style={{ top: groupedAnnotations[0].displayOffset }}
				>
					{groupedAnnotations.slice(0, 6).map((annotation, i) => {
						const Component = annotation.is_draft
							? AnnotationDraft
							: Annotation;

						return (
							<Component
								key={annotation.link}
								annotation={annotation}
								deleteAnnotation={() =>
									deleteAnnotation(annotation)
								}
								offset={annotation.displayOffset}
								charLimit={
									i == groupedAnnotations.length - 1
										? 300
										: 150
								}
								upvoted={upvotedAnnotations[annotation.id]}
								upvoteAnnotation={(isUpvote) =>
									upvoteAnnotation(
										url,
										annotation.id,
										isUpvote
									)
								}
							/>
						);
					})}
				</div>
			))}
		</div>
	);
}
export default AnnotationsList;
