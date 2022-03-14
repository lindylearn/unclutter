import {
    setAutomaticStatusForDomain,
    shouldEnableForDomain,
} from "../../common/storage";

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
