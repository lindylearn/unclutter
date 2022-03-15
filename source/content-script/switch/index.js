import {
    setAutomaticStatusForDomain,
    shouldEnableForDomain,
} from "../../common/storage";

// Allow the user control the automatic extension enablement on the current domain.
// This is injected as an iframe into enabled tabs from `styleChanges.js`.
async function main() {
    const currentDomain = new URLSearchParams(document.location.search).get(
        "domain"
    );
    document.getElementById(
        "text"
    ).title = `Automatically unclutter pages from ${currentDomain}`;

    const switch1 = document.getElementById("switch1");
    switch1.checked = await shouldEnableForDomain(currentDomain);
    switch1.onclick = (e) =>
        setAutomaticStatusForDomain(currentDomain, e.target.checked);

    document.body.style.visibility = "visible";
}
main();
