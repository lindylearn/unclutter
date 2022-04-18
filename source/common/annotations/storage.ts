import axios from "axios";
import browser from "../../common/polyfill";

export async function getHypothesisToken() {
    return (await getUserInfo())["hypothesis-api-token"];
}

export async function getHypothesisUsername() {
    return (await getUserInfo())["hypothesis-username"];
}

export async function getUserInfo() {
    return await browser.storage.sync.get([
        "hypothesis-api-token",
        "hypothesis-username",
    ]);
}

export async function validateSaveToken(token, forceSave = false) {
    const userName = await validateApiToken(token);
    if (!userName && !forceSave) {
        return false;
    }

    await browser.storage.sync.set({
        "hypothesis-api-token": token,
        "hypothesis-username": userName,
    });

    return true;
}

export async function validateApiToken(apiToken) {
    try {
        const response = await axios.get(
            `https://api.hypothes.is/api/profile`,
            {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                },
            }
        );
        const fullUserId = response.data.userid; // e.g. acct:remikalir@hypothes.is
        return fullUserId.match(/([^:]+)@/)[1];
    } catch {
        return null;
    }
}
