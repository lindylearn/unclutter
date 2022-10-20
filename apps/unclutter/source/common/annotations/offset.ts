export function getNodeOffset(node, nodeProp = "top") {
    const pageOffset = document.body.offsetTop;

    // getBoundingClientRect() is relative to scrolled viewport
    const elementOffset = node.getBoundingClientRect()[nodeProp] + window.scrollY;
    const displayOffset = pageOffset + elementOffset;
    return displayOffset;
}
