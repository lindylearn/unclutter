const currentDomain = new URLSearchParams(document.location.search).get(
    "domain"
);
document.getElementById(
    "text"
).title = `Automatically unclutter pages from ${currentDomain}`;
