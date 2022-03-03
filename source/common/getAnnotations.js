import axios from 'axios';

export function createDraftAnnotation(url, selector) {
	const id = `draft_${Math.random().toString(36).slice(-5)}`;
	return {
		id: id,
		localId: id,
		url,
		quote_text: selector?.[2]?.exact || '_',
		text: '',
		author: { username: '' },
		quote_html_selector: selector,
		platform: 'll',
		link: id,
		reply_count: null,
		is_draft: true,
		isMyAnnotation: true,
		isPublic: false,
	};
}

export function hypothesisToLindyFormat(annotation) {
	return {
		id: annotation.id,
		author: annotation.user.match(/([^:]+)@/)[1],
		platform: 'h',
		link: `https://hypothes.is/a/${annotation.id}`,
		created_at: annotation.created,
		reply_count: 0,
		quote_text: annotation.target?.[0].selector?.filter(
			(s) => s.type == 'TextQuoteSelector'
		)[0].exact,
		text: annotation.text,
		replies: [],
		upvote_count: 0,
		tags: annotation.tags,
		quote_html_selector: annotation.target[0].selector,
		user_upvoted: false,
		isPublic: annotation.permissions.read[0] === '__world__',
	};
}
