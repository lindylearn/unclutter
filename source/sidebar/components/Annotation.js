import React, { useEffect, useState } from 'react';

import { getAnnotationColor } from '../../common/styling';

import ycIcon from '../../assets/icons/yc.svg';
import hypothesisIcon from '../../assets/icons/hypothesis.svg';

function Annotation({
	annotation,
	className,
	charLimit = 200,
	swipeHandlers = {},
	upvoted,
	upvoteAnnotation,
}) {
	const { text, offset, author, platform, link, reply_count } = annotation;

	const textLines = text.slice(0, charLimit).split('\n');

	const [upvoteCount, setLocalUpvoteCount] = useState(
		annotation.upvote_count || 0
	);
	function toggleUpvoteAnnotationLocalFirst() {
		const newCount = upvoteCount + (upvoted ? -1 : 1);
		upvoteAnnotation(!upvoted);
		setLocalUpvoteCount(newCount);
	}

	return (
		<div
			className={
				'py-1 px-2 bg-white border-l-4 rounded-r drop-shadow-sm' +
				className
			}
			style={{ top: offset, borderColor: getAnnotationColor(annotation) }}
			{...swipeHandlers}
		>
			<a href={link} target="_blank" rel="noreferrer">
				<div className="text-sm md:text-base">
					{textLines.map((item, i) => {
						return (
							<span key={i}>
								{item}
								{i == textLines.length - 1 &&
								text.length > charLimit ? (
									' ...'
								) : (
									<br />
								)}
							</span>
						);
					})}
				</div>
			</a>
			<div className="text-xs md:text-sm text-gray-400 flex gap-5 justify-between font-mono">
				{reply_count && reply_count > 0 ? (
					<a href={link} target="_blank" rel="noreferrer">
						<svg
							aria-hidden="true"
							focusable="false"
							data-prefix="fas"
							data-icon="reply"
							className="inline-block align-baseline fill-gray-400 rotate-180 w-3 mr-1"
							role="img"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 512 512"
						>
							<path
								fill="currentColor"
								d="M8.309 189.836L184.313 37.851C199.719 24.546 224 35.347 224 56.015v80.053c160.629 1.839 288 34.032 288 186.258 0 61.441-39.581 122.309-83.333 154.132-13.653 9.931-33.111-2.533-28.077-18.631 45.344-145.012-21.507-183.51-176.59-185.742V360c0 20.7-24.3 31.453-39.687 18.164l-176.004-152c-11.071-9.562-11.086-26.753 0-36.328z"
							></path>
						</svg>
						{reply_count} {reply_count == 1 ? 'reply' : 'replies'}
					</a>
				) : (
					<></>
				)}
				<div
					className={
						'hoverButton flex-shrink-0 flex cursor-pointer select-none ' +
						(upvoted ? 'text-black ' : '') +
						(upvoteCount == 0 ? 'invisible' : '') // shown on hover through global CSS
					}
					onClick={toggleUpvoteAnnotationLocalFirst}
				>
					<svg
						aria-hidden="true"
						focusable="false"
						data-prefix="fas"
						data-icon="angle-up"
						className="inline-block align-baseline w-3 mr-2"
						role="img"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 320 512"
					>
						<path
							fill="currentColor"
							d="M177 159.7l136 136c9.4 9.4 9.4 24.6 0 33.9l-22.6 22.6c-9.4 9.4-24.6 9.4-33.9 0L160 255.9l-96.4 96.4c-9.4 9.4-24.6 9.4-33.9 0L7 329.7c-9.4-9.4-9.4-24.6 0-33.9l136-136c9.4-9.5 24.6-9.5 34-.1z"
						></path>
					</svg>
					<div className="whitespace-nowrap">
						{upvoteCount == 0
							? 'upvote'
							: `${upvoteCount} upvote${
									upvoteCount > 1 ? 's' : ''
							  }`}
					</div>
				</div>
				<div className="flex-grow" />
				<a
					href={`/@${author.username || author}`}
					target="_blank"
					rel="noreferrer"
					className="font-mono text-gray-400"
				>
					{author.username || author}
					{platform == 'h' && (
						<img
							src={hypothesisIcon}
							className="inline-block w-4 ml-1"
						/>
					)}
					{platform == 'hn' && (
						<img src={ycIcon} className="inline-block w-4 ml-1" />
					)}
				</a>
			</div>
		</div>
	);
}
export default Annotation;
