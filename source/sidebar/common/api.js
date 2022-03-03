import axios from 'axios';

// const lindyApiUrl = 'http://127.0.0.1:8000';
const lindyApiUrl = 'https://api2.lindylearn.io';

async function getConfig() {
	// const apiToken = await getApiToken();
	// if (apiToken) {
	// 	return {
	// 		headers: { Authorization: apiToken },
	// 	};
	// }
	return {};
}

export async function upvoteAnnotation(pageUrl, annotationId, isUpvote) {
	axios.post(
		`${lindyApiUrl}/annotations/upvote`,
		{
			annotation_id: annotationId,
			is_unvote: !isUpvote,
		},
		await getConfig()
	);
}

export async function getAnnotations(url) {
	const annotations = (
		await axios.get(`${lindyApiUrl}/annotations`, {
			...(await getConfig()),
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

// longer running process
export async function generateAnnotations(url) {
	const newAnnotations = (
		await axios.post(
			`${lindyApiUrl}/annotations/generate`,
			{},
			{
				...(await getConfig()),
				params: {
					page_url: url,
				},
			}
		)
	).data;
	return newAnnotations;
}

export async function getUserDetails(username) {
	// end with .json because might contain dots
	const response = await axios.get(
		`${lindyApiUrl}/annotators/${username}.json`,
		await getConfig()
	);
	return response.data;
}

export async function getDomainDetails(url) {
	// end with .json because might contain dots
	const response = await axios.get(
		`${lindyApiUrl}/domains/${url}.json`,
		await getConfig()
	);
	return response.data;
}

export async function getTagDetails(tag) {
	// end with .json because might contain dots
	const response = await axios.get(
		`${lindyApiUrl}/tags/${tag}.json`,
		await getConfig()
	);
	return response.data;
}

// actions

export async function getPageHistory(url) {
	const response = await axios.get(
		`${lindyApiUrl}/annotations/get_page_history`,
		{
			params: { page_url: url },
		},
		await getConfig()
	);
	return response.data;
}
