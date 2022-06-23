export function pxToNumber(pxValue: string): number {
    return parseFloat(pxValue.replace("px", ""));
}
