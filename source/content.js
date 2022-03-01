import optionsStorage from "./options-storage.js";

async function init() {
	// const options = await optionsStorage.getAll();

	const notice = document.createElement("div");
	notice.innerHTML = "Sidebar";
	document.body.append(notice);
	notice.className = "sidebar";
}

function addStyles(element, styles) {
	for (id in styles) {
		element.style[id] = styles[id];
	}
}

init();
