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
	isMyAnnotation = false,
}) {
	const { text, offset, author, platform, link, reply_count } = annotation;

	const textLines = text.slice(0, charLimit).split('\n');
	//.filter((line) => line.trim() != '');

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
				'annotation py-1 px-2 bg-white border-l-4 rounded drop-shadow-sm ' +
				className
			}
			style={{ top: offset, borderColor: getAnnotationColor(annotation) }}
			{...swipeHandlers}
		>
			<div className="text-sm md:text-base">
				{textLines.map((item, i) => {
					return (
						<p key={i} className="">
							{item}
							{i == textLines.length - 1 &&
							text.length > charLimit ? (
								' ...'
							) : (
								<br />
							)}
						</p>
					);
				})}
			</div>
			<div className="text-xs md:text-sm text-gray-400 flex gap-5 justify-between font-mono">
				{reply_count && reply_count > 0 ? (
					<a href={link} target="_blank" rel="noreferrer">
						<svg
							className="inline-block align-baseline fill-gray-400 rotate-180 w-3 mr-1 -mb-0.5"
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
						className="inline-block align-baseline w-3 mr-2"
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
					href={`https://annotations.lindylearn.io/@${
						author.username || author
					}`}
					target="_blank"
					rel="noreferrer"
					className="font-mono text-gray-400"
				>
					{author.username || author}
					{platform == 'h' && (
						<img
							src={hypothesisIcon}
							className="inline-block w-3 ml-1"
						/>
					)}
					{platform == 'hn' && (
						<img src={ycIcon} className="inline-block w-3 ml-1" />
					)}
				</a>
			</div>

			<div className="top-icon absolute top-2 right-2 text-gray-400 cursor-pointer">
				{isMyAnnotation ? (
					<svg
						className="h-3"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 448 512"
					>
						<path
							fill="currentColor"
							d="M135.2 17.69C140.6 6.848 151.7 0 163.8 0H284.2C296.3 0 307.4 6.848 312.8 17.69L320 32H416C433.7 32 448 46.33 448 64C448 81.67 433.7 96 416 96H32C14.33 96 0 81.67 0 64C0 46.33 14.33 32 32 32H128L135.2 17.69zM394.8 466.1C393.2 492.3 372.3 512 346.9 512H101.1C75.75 512 54.77 492.3 53.19 466.1L31.1 128H416L394.8 466.1z"
						/>
					</svg>
				) : (
					<svg
						className="h-3"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 640 512"
					>
						<path
							fill="currentColor"
							d="M150.7 92.77C195 58.27 251.8 32 320 32C400.8 32 465.5 68.84 512.6 112.6C559.4 156 590.7 207.1 605.5 243.7C608.8 251.6 608.8 260.4 605.5 268.3C592.1 300.6 565.2 346.1 525.6 386.7L630.8 469.1C641.2 477.3 643.1 492.4 634.9 502.8C626.7 513.2 611.6 515.1 601.2 506.9L9.196 42.89C-1.236 34.71-3.065 19.63 5.112 9.196C13.29-1.236 28.37-3.065 38.81 5.112L150.7 92.77zM223.1 149.5L313.4 220.3C317.6 211.8 320 202.2 320 191.1C320 180.5 316.1 169.7 311.6 160.4C314.4 160.1 317.2 159.1 320 159.1C373 159.1 416 202.1 416 255.1C416 269.7 413.1 282.7 407.1 294.5L446.6 324.7C457.7 304.3 464 280.9 464 255.1C464 176.5 399.5 111.1 320 111.1C282.7 111.1 248.6 126.2 223.1 149.5zM320 480C239.2 480 174.5 443.2 127.4 399.4C80.62 355.1 49.34 304 34.46 268.3C31.18 260.4 31.18 251.6 34.46 243.7C44 220.8 60.29 191.2 83.09 161.5L177.4 235.8C176.5 242.4 176 249.1 176 255.1C176 335.5 240.5 400 320 400C338.7 400 356.6 396.4 373 389.9L446.2 447.5C409.9 467.1 367.8 480 320 480H320z"
						/>
					</svg>
				)}
			</div>
		</div>
	);
}
export default Annotation;
