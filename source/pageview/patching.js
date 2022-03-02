export function beautifyDocument(document) {
	// patchMediaRules(document);

	insertOverrideRules(document);
}

export function unBeautifyDocument(document) {
	document
		.querySelectorAll('.pageview-media-override')
		.forEach((e) => e.remove());
}

function insertOverrideRules() {
	const cssUrls = [...document.getElementsByTagName('link')]
		.filter((elem) => elem.rel === 'stylesheet')
		.map((elem) => elem.href);

	console.log(cssUrls);

	cssUrls.forEach((url) => {
		var link = document.createElement('link');
		link.className = 'pageview-media-override';
		link.type = 'text/css';
		link.rel = 'stylesheet';
		link.href = `https://us-central1-lindylearn2.cloudfunctions.net/getCssOverrides?cssUrl=${encodeURIComponent(
			url
		)}&conditionScale=${1.6}`;
		link.crossOrigin = 'anonymous';
		document.head.appendChild(link);
	});
}

export function patchMediaRules() {
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
