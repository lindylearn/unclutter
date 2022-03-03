import Switch from './Switch';

export function AnnotationsInfoMessage({ annotations }) {
	return (
		<div className="w-full py-1 px-2 bg-white rounded-lg drop-shadow-sm flex gap-3 justify-between">
			<div className="text-sm md:text-base">
				Showing {annotations?.length || 0} public annotations
			</div>
			<Switch />
		</div>
	);
}

export default AnnotationsInfoMessage;
