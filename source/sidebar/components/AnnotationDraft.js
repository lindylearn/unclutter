import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { getAnnotationColor } from '../../common/styling';
import Switch from './Switch';

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
				'annotationContainer py-1 px-2 border-l-4 rounded-r-lg bg-white drop-shadow-sm ' +
				className
			}
			style={{ top: offset, borderColor: getAnnotationColor(annotation) }}
			{...swipeHandlers}
		>
			<textarea
				className="text-sm md:text-base w-full bg-gray-50 rounded-md py-1 px-2 outline-none"
				placeholder="Private note"
				value={text}
				onChange={(e) => setText(e.target.value)}
			/>
			<div className="flex gap-2">
				<input
					className="text-sm md:text-base w-full bg-gray-50 rounded-md py-1 px-2 outline-none"
					placeholder="Tags"
				/>
				<Switch annotationId={annotation.id} />
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
