import Annotation from './Annotation';

function AnnotationThread(props) {
	return (
		<div className="">
			<Annotation {...props} />
			<div className="ml-5">
				{props.annotation.replies?.map((reply) => (
					<AnnotationThread
						key={reply.id}
						{...props}
						annotation={reply}
						className="mt-1 rounded border-l-0"
					/>
				))}
			</div>
		</div>
	);
}
export default AnnotationThread;
