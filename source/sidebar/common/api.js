import axios from 'axios';
import browser from 'webextension-polyfill';

// const lindyApiUrl = 'http://127.0.0.1:8000';
const lindyApiUrl = 'https://api2.lindylearn.io';
const hypothesisApi = 'https://api.hypothes.is/api';

// --- global fetching

export async function getAnnotations(url) {
	const annotations = (
		await axios.get(`${lindyApiUrl}/annotations`, {
			...(await _getConfig()),
			params: {
				page_url: url,
			},
		})
	).data.results;

	return {
		annotations,
		needsGeneration: annotations.length == 0,
	};
}

export async function getPageHistory(url) {
	const response = await axios.get(
		`${lindyApiUrl}/annotations/get_page_history`,
		{
			params: { page_url: url },
		},
		await _getConfig()
	);
	return response.data;
}

// --- user actions

export async function upvoteAnnotation(pageUrl, annotationId, isUpvote) {
	axios.post(
		`${lindyApiUrl}/annotations/upvote`,
		{
			annotation_id: annotationId,
			is_unvote: !isUpvote,
		},
		await _getConfig()
	);
}

// --- social information annotations

export async function getUserDetails(username) {
	// end with .json because might contain dots
	const response = await axios.get(
		`${lindyApiUrl}/annotators/${username}.json`,
		await _getConfig()
	);
	return response.data;
}

export async function getDomainDetails(url) {
	// end with .json because might contain dots
	const response = await axios.get(
		`${lindyApiUrl}/domains/${url}.json`,
		await _getConfig()
	);
	return response.data;
}

export async function getTagDetails(tag) {
	// end with .json because might contain dots
	const response = await axios.get(
		`${lindyApiUrl}/tags/${tag}.json`,
		await _getConfig()
	);
	return response.data;
}

async function _getConfig() {
	const settings = await browser.storage.sync.get('hypothesis-api-token');
	const apiToken = settings['hypothesis-api-token'];

	if (apiToken) {
		return {
			headers: { Authorization: apiToken },
		};
	}
	return {};
}
