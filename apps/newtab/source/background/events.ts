import {
    getUnclutterExtensionId,
    getUnclutterVersion,
} from "@unclutter/library-components/dist/common";

async function setup() {
    const unclutterVersion = await getUnclutterVersion(getUnclutterExtensionId());
    console.log(`Found Unclutter extension v${unclutterVersion}`);
}
setup();
