import Annotation from './Annotation';
import AnnotationDraft from './AnnotationDraft';

export default function PageNotesList({ annotations, deleteAnnotation }) {
	return (
		<div className="flex flex-col gap-1">
			{annotations.map((a) => (
				<PageNote
					key={a.id}
					annotation={a}
					deleteAnnotation={() => deleteAnnotation(a)}
				/>
			))}
		</div>
	);
}

export function PageNote({ annotation, deleteAnnotation }) {
	const Component = annotation.isMyAnnotation ? AnnotationDraft : Annotation;

	return (
		<Component
			annotation={annotation}
			className="border-l-0 rounded"
			deleteAnnotation={deleteAnnotation}
		/>
	);
}
