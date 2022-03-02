import axios from 'axios';

export function createDraftAnnotation(url, selector) {
	const id = `draft_${Math.random().toString(36).slice(-5)}`;
	return {
		id: id,
		url,
		quote_text: selector?.[2].exact,
		text: '',
		author: { username: '' },
		quote_html_selector: selector,
		platform: 'll',
		link: id,
		reply_count: null,
		is_draft: true,
	};
}
