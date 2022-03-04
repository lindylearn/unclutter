import Annotation from './Annotation';
import AnnotationDraft from './AnnotationDraft';

export default function PageNotesList({
	url,
	annotations,
	createAnnotation,
	deleteAnnotation,
}) {
	return (
		<div className="flex flex-col gap-1">
			{annotations.map((a) => (
				<PageNote
					url={url}
					key={a.id}
					annotation={a}
					createAnnotation={createAnnotation}
					deleteAnnotation={() => deleteAnnotation(a)}
				/>
			))}
		</div>
	);
}

export function PageNote({
	url,
	annotation,
	createAnnotation,
	deleteAnnotation,
}) {
	const Component = annotation.isMyAnnotation ? AnnotationDraft : Annotation;

	return (
		<Component
			url={url}
			annotation={annotation}
			className="border-l-0 rounded"
			createAnnotation={createAnnotation}
			deleteAnnotation={deleteAnnotation}
			placeholder="Page note"
		/>
	);
}
