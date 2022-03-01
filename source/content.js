import optionsStorage from "./options-storage.js";

async function init() {
	// const options = await optionsStorage.getAll();

	document.body.classList.add("pageview");

	const notice = document.createElement("div");
	notice.innerHTML = "sdsd";
	document.body.append(notice);
	notice.className = "sidebar";
}

init();
