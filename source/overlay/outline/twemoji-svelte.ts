import twemoji from "twemoji";
import { afterUpdate } from "svelte";

// from https://github.com/jankiel7410/svelte-twemoji
export default function twemojiSvelte(node, how = {}) {
    twemoji.parse(node, how);
    afterUpdate(() => {
        twemoji.parse(node, how);
    });
    return {
        update() {
            console.warn(
                "Changing twemoji options after the action was mounted is not possible."
            );
        },
    };
}
