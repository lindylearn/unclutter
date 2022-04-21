import browser from "../../common/polyfill";
import updateMessages from "../../versions.json";

interface VersionMessage {
    version: string;
    updateMessage: string;
}

export async function getVersionMessagesToShow(): Promise<VersionMessage[]> {
    // show messsage for every version since user installed the extension
    const initialVersion = await getInitialInstallVersion();
    const newVersions: VersionMessage[] = updateMessages.filter(
        ({ version }) => version > initialVersion
    );

    // but hide messages he has dismissed
    return newVersions;
}

export async function getInitialInstallVersion(): Promise<string> {
    const config = await browser.storage.sync.get("initial-install-version");
    return config["initial-install-version"];
}

// introduced with 0.12.0
export async function saveInitialInstallVersionIfMissing(
    version: string
): Promise<void> {
    const savedVersion = await getInitialInstallVersion();
    if (!savedVersion) {
        await browser.storage.sync.set({ "initial-install-version": version });
    }
}
