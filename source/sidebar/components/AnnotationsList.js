import Annotation from './Annotation';
import AnnotationDraft from './AnnotationDraft';
import AnnotationThread from './AnnotationThread';

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

	const orderedAnnotations = annotations.sort(
		(a, b) => a.displayOffset - b.displayOffset
	);

	const groupedAnnotations = [];
	let lastOffset = -Infinity;
	for (const annotation of orderedAnnotations) {
		if (annotation.displayOffset < lastOffset + 100) {
			// conflict, append to last group
			groupedAnnotations[groupedAnnotations.length - 1] = [
				...groupedAnnotations[groupedAnnotations.length - 1],
				annotation,
			];
		} else {
			// no conflict, start new group
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
					className="absolute w-full"
					style={{
						top: groupedAnnotations[0].displayOffset,
						position: 'relative',
					}}
				>
					{groupedAnnotations.slice(0, 5).map((annotation, i) => {
						const Component = annotation.is_draft
							? AnnotationDraft
							: AnnotationThread;

						return (
							<div
								className="annotation-group-item w-full hover:z-10 hover:drop-shadow rounded-r "
								style={{
									position: 'absolute',
									top: `${i * 40}px`,
								}}
							>
								<Component
									key={annotation.link}
									annotation={annotation}
									deleteAnnotation={() =>
										deleteAnnotation(annotation)
									}
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
							</div>
						);
					})}
					{/* <div>{groupedAnnotations.length - 1} more annotations</div> */}
				</div>
			))}
		</div>
	);
}
export default AnnotationsList;
