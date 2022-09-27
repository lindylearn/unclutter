export function scrollToElement(element: Element) {
    // scoll manually for smooth effect and small offset
    window.scrollTo({
        top: getElementYOffset(element),
        behavior: "smooth",
    });
}

export function getElementYOffset(element, margin = 15) {
    const position = element.getBoundingClientRect();
    return position.top + window.pageYOffset - margin;
}

export function getOutlineIframe(): Document | undefined {
    return (document.getElementById("lindy-info-topleft") as HTMLIFrameElement)
        ?.contentDocument;
}

export function getBottomIframe(): Document | undefined {
    return (document.getElementById("lindy-info-bottom") as HTMLIFrameElement)
        ?.contentDocument;
}
