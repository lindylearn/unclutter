export function scrollToElement(element: Element) {
    // scoll manually for smooth effect and small offset
    window.scrollTo({
        top: getElementYOffset(element),
        behavior: "smooth",
    });
}

export function getElementYOffset(element, margin = 20) {
    const position = element.getBoundingClientRect();
    return position.top + window.pageYOffset - margin;
}
