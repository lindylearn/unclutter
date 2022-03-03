import Annotation from './Annotation';

function AnnotationThread(props) {
	const replyLevel = props.replyLevel || 0;
	return (
		<div className="">
			<Annotation
				{...props}
				isMyAnnotation={props.annotation.author === 'peterhagen'}
			/>
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
