export default function PageNote({}) {
	return (
		<div className="">
			<textarea
				className="text-sm md:text-base w-full bg-gray-100 rounded-r-md py-1 px-2 outline-none"
				placeholder="Add page note to bookmark..."
			/>
			<input
				className="text-sm md:text-base w-full bg-gray-100 rounded-r-md py-1 px-2 outline-none"
				placeholder="Tags"
			/>
		</div>
	);
}
