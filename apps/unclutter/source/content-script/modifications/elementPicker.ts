import { pxToNumber } from "../../common/css";
import {
    getBlockedElementSelectors,
    setBlockedElementSelectors,
} from "../../common/storage";
import {
    createStylesheetText,
    overrideClassname,
} from "../../common/stylesheets";
import {
    lindyContainerClass,
    lindyFirstMainContainerClass,
    lindyHeadingContainerClass,
    lindyImageContainerClass,
    lindyMainContentContainerClass,
    lindyMainHeaderContainerClass,
} from "./DOM/textContainer";
import { PageModifier, trackModifierExecution } from "./_interface";

const pendingBlockedElement = "lindy-just-blocked-element";

@trackModifierExecution
export default class ElementPickerModifier implements PageModifier {
    private domain: string;
    private spotlight: HTMLElement;
    private currentSelection: HTMLElement;

    public pageSelectors: string[] = [];
    public pickedElementListener: (() => void)[] = [];

    constructor(domain: string) {
        this.domain = domain;
    }

    async prepare() {
        this.pageSelectors = await getBlockedElementSelectors(this.domain);
    }

    transitionIn() {
        if (this.pageSelectors.length === 0) {
            return;
        }

        // override text container protection
        const css = `${this.pageSelectors.join(
            ", "
        )}:not(#fakeID#fakeID#fakeID#fakeID#fakeID) { display: none !important; }`;
        createStylesheetText(css, "element-picker-block");
    }

    transitionOut() {
        document
            .querySelectorAll("#element-picker-block")
            .forEach((e) => e.remove());
    }

    enable() {
        this.spotlight = document.createElement("div");
        this.spotlight.className = `${overrideClassname} lindy-element-spotlght`;
        // this.spotlight.style.contain = "strict";
        document.documentElement.appendChild(this.spotlight);

        this.spotlight.onclick = this.onFinishSelection.bind(this);

        document.body.addEventListener(
            "mouseover",
            this.onMouseOver.bind(this)
        );
    }

    disable() {
        // clean up DOM
        document.body.removeEventListener(
            "mouseover",
            this.onMouseOver.bind(this)
        );
        this.spotlight.remove();

        getBlockedElementSelectors(this.domain).then((selectors) => {
            this.pageSelectors = selectors;
        });
    }

    resetPage() {
        this.pageSelectors = [];

        try {
            document
                .querySelectorAll(`.${pendingBlockedElement}`)
                .forEach((node) =>
                    node.classList.remove(pendingBlockedElement)
                );
        } catch {}

        document.getElementById("element-picker-block")?.remove();
    }

    async saveSelectors() {
        await setBlockedElementSelectors(this.domain, this.pageSelectors);
    }

    private onMouseOver(event: MouseEvent) {
        const startElement = event.target as HTMLElement;
        const endElement = this.iterateParents(startElement);

        let rect: DOMRect;
        if (endElement) {
            this.currentSelection = endElement;

            rect = endElement.getBoundingClientRect();

            // convert viewport-relative to absolute
            const absoluteY = rect.y + window.scrollY;

            // add margins
            const activeStyle = window.getComputedStyle(endElement);
            rect = new DOMRect(
                rect.x - pxToNumber(activeStyle.marginLeft),
                absoluteY - pxToNumber(activeStyle.marginTop),
                rect.width +
                    pxToNumber(activeStyle.marginLeft) +
                    pxToNumber(activeStyle.marginRight),
                rect.height +
                    pxToNumber(activeStyle.marginTop) +
                    pxToNumber(activeStyle.marginBottom)
            );
        } else {
            rect = new DOMRect(0, 0, 0, 0);
            this.spotlight.style.visibility = "hidden";
            this.spotlight.style.opacity = "0";
            this.spotlight.style.zIndex = "0";
            return;
        }
        this.spotlight.style.top = `${rect.top}px`;
        this.spotlight.style.left = `${rect.left}px`;
        this.spotlight.style.height = `${rect.height}px`;
        this.spotlight.style.width = `${rect.width}px`;

        this.spotlight.style.visibility = "visible";
        this.spotlight.style.opacity = "0.4";
        this.spotlight.style.zIndex = "10000";
    }

    private iterateParents(startNode: HTMLElement) {
        if (this.shouldExcludeNode(startNode)) {
            return null;
        }

        let currentNode = startNode;
        while (currentNode !== document.body) {
            if (this.shouldExcludeNode(currentNode.parentElement)) {
                break;
            }
            if (
                currentNode.clientHeight + 20 <=
                    currentNode.parentElement.clientHeight ||
                currentNode.clientWidth >
                    currentNode.parentElement.clientWidth + 20
            ) {
                // significant height difference to parent -- give user the choice
                break;
            }

            currentNode = currentNode.parentElement;
        }

        return currentNode;
    }

    private shouldExcludeNode(node: HTMLElement) {
        if (
            node === document.documentElement ||
            node === document.body ||
            node.id === "lindy-body-background"
        ) {
            return true;
        }

        if (
            [
                lindyMainContentContainerClass,
                lindyMainHeaderContainerClass,
            ].some((className) => node.classList.contains(className))
        ) {
            return true;
        }

        if (node.clientHeight >= window.innerHeight) {
            return true;
        }

        return false;
    }

    private async onFinishSelection() {
        const selector = this.generateSelectorFor(this.currentSelection);
        if (!selector) {
            return;
        }
        console.log(selector);

        const blockedNodes = [...document.querySelectorAll(selector)];

        // set animation start properties`
        blockedNodes.forEach((node: HTMLElement) => {
            const activeStyle = window.getComputedStyle(node);
            node.style.height = activeStyle.height;
            node.style.opacity = "1";
        });
        await new Promise((r) => setTimeout(r, 0)); // wait until applied

        // block via removable class
        blockedNodes.forEach((node: HTMLElement) => {
            node.classList.add(pendingBlockedElement);
        });
        this.spotlight.classList.add("lindy-is-shrinking");

        // wait until transition done
        await new Promise((r) => setTimeout(r, 300 + 100));
        this.spotlight.classList.remove("lindy-is-shrinking");

        // update UI
        if (selector) {
            this.pageSelectors.push(selector);
            this.pickedElementListener.map((listener) => listener());
        }
    }

    private generateSelectorFor(node: HTMLElement): string {
        if (node.id) {
            return `#${node.id}`;
        }
        const nonLindyClasses = [...node.classList].filter(
            (className) => !className.startsWith("lindy-")
        );

        if (nonLindyClasses.length) {
            return nonLindyClasses.map((className) => `.${className}`).join("");
        }

        console.log(`No selector for ${node}`);
        return "";
    }
}
