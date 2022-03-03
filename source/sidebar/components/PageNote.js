export default function PageNote({}) {
	return (
		<div className="py-1 px-1 bg-white rounded-md drop-shadow-sm">
			<textarea
				className="text-sm md:text-base w-full bg-gray-50 rounded-md py-1 px-2 outline-none"
				placeholder="Page note"
				rows="5"
			/>
			<input
				className="text-sm md:text-base w-full bg-gray-50 rounded-md py-1 px-2 outline-none"
				placeholder="Tags"
			/>
		</div>
	);
}
