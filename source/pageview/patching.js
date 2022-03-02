import browser from 'webextension-polyfill';

export function patchDocument() {
	insertPageViewStyle();

	insertOverrideRules();

	// patchMediaRules(document);
}

const overrideClassname = 'lindylearn-document-override';

export function unPatchDocument() {
	document
		.querySelectorAll(`.${overrideClassname}`)
		.forEach((e) => e.remove());
}

function insertPageViewStyle() {
	// set start properties for animation immediately
	document.body.style.width = '100%';
	document.body.style.magin = '0';

	createStylesheetLink(browser.runtime.getURL('/pageview/content.css'));
}

function insertOverrideRules() {
	const cssUrls = [...document.getElementsByTagName('link')]
		.filter((elem) => elem.rel === 'stylesheet')
		.map((elem) => elem.href);

	console.log(cssUrls);

	cssUrls.forEach((url) => {
		createStylesheetLink(
			`https://us-central1-lindylearn2.cloudfunctions.net/getCssOverrides?cssUrl=${encodeURIComponent(
				url
			)}&conditionScale=${1.6}`
		);
	});
}

function createStylesheetLink(url) {
	var link = document.createElement('link');
	link.className = overrideClassname;
	link.type = 'text/css';
	link.rel = 'stylesheet';
	link.href = url;
	// link.crossOrigin = 'anonymous';
	document.head.appendChild(link);
}

function patchMediaRules() {
	const cssLinks = [...document.getElementsByTagName('link')].filter(
		(elem) => elem.rel === 'stylesheet'
	);
	cssLinks.map((elem) => {
		elem.crossOrigin = 'anonymous'; // force CORS validation, to allow access of CSS rules
	});

	console.log([...document.styleSheets]);
	const cssRules = [...document.styleSheets].flatMap((ruleList) => {
		try {
			return [...ruleList.cssRules];
		} catch {
			return [];
		}
	});
	const mediaRules = cssRules.filter(
		(rule) => rule.type === CSSRule.MEDIA_RULE
	);

	console.log('Overriding the following media query CSS rules:');
	console.log(mediaRules);

	// how much of the window is taken up by the embedded web page
	// const pageWidthRatio = document.body.offsetWidth / ;
	// media rules should virtually apply to just the embedded web page
	// since this is not possible, scale up the thresholds to the total window width
	const scale = 1 / 0.6; // window.innerWidth / document.body.offsetWidth;
	console.log(window.innerWidth, document.body.clientWidth, scale);
	const overrideRules = mediaRules
		.map((rule) => {
			const oldPxCount = /([0-9]+)px/g.exec(rule.conditionText)?.[1];
			if (!oldPxCount) {
				// rule not mentioning screen sizes, e.g. 'print'
				return;
			}
			const newPxCount = Math.round(scale * oldPxCount);

			const newCondition = rule.conditionText.replace(
				`${oldPxCount}px`,
				`${newPxCount}px`
			);
			const newRuleText = rule.cssText.replace(
				rule.conditionText,
				newCondition
			);
			return newRuleText;
		})
		.filter((t) => t);

	// insert new style
	var style = document.createElement('style');
	style.id = 'pageview-media-override';
	style.type = 'text/css';
	document.head.appendChild(style);

	overrideRules.forEach((overrideRuleText) => {
		style.sheet.insertRule(overrideRuleText);
	});

	console.log(style.sheet.cssRules);
}
