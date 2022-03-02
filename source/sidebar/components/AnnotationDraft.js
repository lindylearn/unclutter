import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { getAnnotationColor } from '../common/styling';

function AnnotationDraft({
	annotation,
	className,
	swipeHandlers = {},
	deleteAnnotation,
}) {
	const { offset } = annotation;

	const [text, setText] = useState(annotation.text);

	return (
		<div
			className={
				'py-1 px-2 bg-white border-l-4 rounded-r-lg drop-shadow-lg md:drop-shadow-sm ' +
				className
			}
			style={{ top: offset, borderColor: getAnnotationColor(annotation) }}
			{...swipeHandlers}
		>
			<textarea
				className="text-sm md:text-base w-full bg-gray-100 rounded-r-md py-1 px-2 outline-none"
				value={text}
				onChange={(e) => setText(e.target.value)}
			/>
			<div className="text-xs md:text-sm flex justify-end gap-2">
				<div
					className="rounded-md px-1 cursor-pointer font-bold"
					onClick={deleteAnnotation}
				>
					Delete
				</div>
				<div
					className="rounded-md px-1 cursor-pointer font-bold"
					onClick={() => postAnnotation(text, annotation)}
				>
					Annotate anonymously
				</div>
			</div>
		</div>
	);
}
export default AnnotationDraft;

async function postAnnotation(text, annotation) {
	// from https://hypothes.is/account/developer (lindylearn account)
	const token = '6879-dLUG7Fm-lPT4sNPcnsGBeexJbmzS82bBzGK3PADywQU';

	axios.post(
		`https://api.hypothes.is/api/annotations`,
		{
			uri: annotation.url,
			text: text,
			tags: ['via annotations.lindylearn.io'],
			target: [
				{
					source: annotation.url,
					selector: annotation.quote_html_selector,
				},
			],
			references: [],
			permissions: {
				read: ['group:__world__'],
			},
		},
		{
			headers: { Authorization: `Bearer ${token}` },
		}
	);
}
