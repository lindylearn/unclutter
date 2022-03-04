import axios from 'axios';
import browser from 'webextension-polyfill';
import { hypothesisToLindyFormat } from '../../common/getAnnotations';

// const lindyApiUrl = 'http://127.0.0.1:8000';
const lindyApiUrl = 'https://api2.lindylearn.io';
const hypothesisApi = 'https://api.hypothes.is/api';

// --- global fetching

export async function getAnnotations(url) {
	const [publicAnnotations, userAnnotations] = await Promise.all([
		getLindyAnnotations(url),
		getHypothesisAnnotations(url),
	]);

	// take from lindy preferrably, otherwise hypothesis
	// -> show replies, upvotes metadata when available, but new annotations immediately
	// edits might take a while to propagate this way
	const seenIds = new Set(publicAnnotations.map((a) => a.id));
	let annotations = publicAnnotations;
	for (const annotation of userAnnotations) {
		if (!seenIds.has(annotation.id)) {
			annotations.push(annotation);
		}
	}

	annotations = annotations.map((a) => ({
		...a,
		isMyAnnotation: a.author === 'peterhagen',
	}));

	return annotations;
}

// public annotations via lindy api
async function getLindyAnnotations(url) {
	const response = await axios.get(`${lindyApiUrl}/annotations`, {
		...(await _getConfig()),
		params: {
			page_url: url,
		},
	});

	return response.data.results.map((a) => ({ ...a, isPublic: true }));
}

// private annotations directly from hypothesis
async function getHypothesisAnnotations(url) {
	const response = await axios.get(`${hypothesisApi}/search`, {
		...(await _getConfig()),
		params: {
			url,
			user: `acct:peterhagen@hypothes.is`,
		},
	});

	return response.data.rows
		.filter((a) => !a.references || a.references.length === 0)
		.map(hypothesisToLindyFormat);
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

export async function createAnnotation(pageUrl, localAnnotation) {
	const response = await axios.post(
		`${hypothesisApi}/annotations`,
		{
			uri: pageUrl,
			text: localAnnotation.text,
			target: [
				{
					source: pageUrl,
					selector: localAnnotation.htmlSelector,
				},
			],
			tags: localAnnotation.tags,
			permissions: {
				read: [
					localAnnotation.isPublic
						? 'group:__world__'
						: 'acct:peterhagen@hypothes.is',
				],
			},
		},
		await _getConfig()
	);
	return response.data;
}

export async function deleteAnnotation(annotationId) {
	await axios.delete(
		`${hypothesisApi}/annotations/${annotationId}`,
		await _getConfig()
	);
}

export async function patchAnnotation(annotation) {
	const response = await axios.patch(
		`${hypothesisApi}/annotations/${annotation.id}`,
		{
			text: annotation.text,
			tags: annotation.tags,
			permissions: {
				read: [
					annotation.isPublic
						? 'group:__world__'
						: 'acct:peterhagen@hypothes.is',
				],
			},
		},
		await _getConfig()
	);
	return response.data;
}

export async function upvoteAnnotation(pageUrl, annotationId, isUpvote) {
	await axios.post(
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
			headers: { Authorization: `Bearer ${apiToken}` },
		};
	}
	return {};
}
