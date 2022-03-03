export default function PageNote({}) {
	return (
		<div className="">
			<textarea
				className="text-sm md:text-base w-full bg-gray-50 rounded-md py-1 px-2 outline-none"
				placeholder="Page note"
			/>
			<input
				className="text-sm md:text-base w-full bg-gray-50 rounded-md py-1 px-2 outline-none"
				placeholder="Tags"
			/>
		</div>
	);
}
