import axios from 'axios';

// import { getApiToken } from "./AuthProvider";

const lindyApiUrl = 'http://127.0.0.1:8000';
// const lindyApiUrl = 'https://api2.lindylearn.io';

async function getConfig() {
	// const apiToken = await getApiToken();
	// if (apiToken) {
	// 	return {
	// 		headers: { Authorization: apiToken },
	// 	};
	// }
	return {};
}

export async function moderatorExcludeFeedUrl({ url, domain }) {
	axios.post(
		`${lindyApiUrl}/annotations/exclude_webpage`,
		{ url, domain },
		await getConfig()
	);
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

export async function getGlobalFeed(offset = 0, limit = 6) {
	const response = await axios.get(`${lindyApiUrl}/annotations/global_feed`, {
		...(await getConfig()),
		params: {
			limit,
			offset,
		},
	});
	return response.data;
}

export async function getTopGlobalFeed(offset = 0, limit = 6) {
	const response = await axios.get(
		`${lindyApiUrl}/annotations/top_global_feed`,
		{
			...(await getConfig()),
			params: {
				limit,
				offset,
			},
		}
	);
	return response.data;
}

export async function getGlobalUsersFeed(offset = 0, limit = 6) {
	const response = await axios.get(
		`${lindyApiUrl}/annotations/global_user_feed`,
		{
			...(await getConfig()),
			params: {
				limit,
				offset,
			},
		}
	);
	return response.data;
}

export async function getUserFeed(
	username,
	offset,
	limit = 6,
	filter_category = 'annotations'
) {
	const response = await axios.get(`${lindyApiUrl}/annotations/user/feed`, {
		...(await getConfig()),
		params: { username, offset, limit, filter_category },
	});
	return response.data;
}

export async function getDomainFeed(
	domain,
	tag_filter = null,
	offset,
	limit = 10
) {
	const response = await axios.get(`${lindyApiUrl}/annotations/domain_feed`, {
		...(await getConfig()),
		params: { domain, offset, limit, tag_filter },
	});
	return response.data;
}

export async function getTagFeed(tag, offset, limit = 10) {
	const response = await axios.get(`${lindyApiUrl}/annotations/tag_feed`, {
		...(await getConfig()),
		params: { tag, offset, limit },
	});
	return response.data;
}

export async function getGlobalStats(limit = 30) {
	const response = await axios.get(
		`${lindyApiUrl}/annotations/global_stats`,
		{
			...(await getConfig()),
			params: { limit },
		}
	);
	return response.data;
}

export async function getUserStats(username, limit = 20) {
	const response = await axios.get(`${lindyApiUrl}/annotations/user_stats`, {
		...(await getConfig()),
		params: { username, limit },
	});
	return response.data;
}

export async function getDomainStats(domain, limit = 20) {
	const response = await axios.get(
		`${lindyApiUrl}/annotations/domain_stats`,
		{
			...(await getConfig()),
			params: { domain, limit },
		}
	);
	return response.data;
}

export async function getTagStats(tag, limit = 20) {
	const response = await axios.get(`${lindyApiUrl}/annotations/tag_stats`, {
		...(await getConfig()),
		params: { tag, limit },
	});
	return response.data;
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

export async function getRecentUsers(limit = 10) {
	const response = await axios.get(`${lindyApiUrl}/annotators`, {
		...(await getConfig()),
		params: { limit },
	});
	return [response.data.results, response.data.count];
}

export async function getTopDomains(limit = 10) {
	const response = await axios.get(`${lindyApiUrl}/domains`, {
		...(await getConfig()),
		params: { limit },
	});
	return [response.data.results, response.data.count];
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

export async function signUp() {
	const response = await axios.post(
		`${lindyApiUrl}/annotations/signup`,
		{},
		await getConfig()
	);

	return response.data;
}

export async function follow({ username, domain, tag }, set_follow) {
	const response = await axios.post(
		`${lindyApiUrl}/annotations/follow`,
		{
			username,
			domain,
			tag,
			set_follow,
		},
		await getConfig()
	);

	return response.data;
}

export async function getSettings(userId) {
	const response = await axios.get(
		`${lindyApiUrl}/private_settings/${userId}/`,
		await getConfig()
	);
	return response.data;
}

export async function updateSettings(userId, settings) {
	const response = await axios.patch(
		`${lindyApiUrl}/private_settings/${userId}/`,
		settings,
		await getConfig()
	);
	return response.data;
}

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
