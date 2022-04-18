export function getNodeOffset(node, documentScale = 1) {
    const pageOffset = document.body.offsetTop;

    // getBoundingClientRect() is relative to scrolled viewport
    const elementOffset = node.getBoundingClientRect().top + window.scrollY;
    const displayOffset = pageOffset + elementOffset * documentScale;
    return displayOffset;
}
