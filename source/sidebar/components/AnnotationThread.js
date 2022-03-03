import Annotation from './Annotation';
import AnnotationDraft from './AnnotationDraft';

function AnnotationThread(props) {
	const replyLevel = props.replyLevel || 0;

	const Component = props.annotation.isMyAnnotation
		? AnnotationDraft
		: Annotation;

	return (
		<div className="">
			<Component {...props} />
			{replyLevel < 1 && (
				<div className="ml-5">
					{props.annotation.replies?.map((reply) => (
						<AnnotationThread
							key={reply.id}
							{...props}
							annotation={reply}
							className="mt-1 rounded border-l-0"
							replyLevel={replyLevel + 1}
						/>
					))}
				</div>
			)}
		</div>
	);
}
export default AnnotationThread;
