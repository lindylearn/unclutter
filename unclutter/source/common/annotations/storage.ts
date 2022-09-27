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

// validate token and save if valid
export async function validateSaveToken(token, forceSave = false) {
    const userName = await validateApiToken(token);
    if (userName === null && !forceSave) {
        return false;
    }

    await saveToken(token, userName);

    return userName !== null;
}

export async function saveToken(token: string, userName: string) {
    await browser.storage.sync.set({
        "hypothesis-api-token": token,
        "hypothesis-username": userName,
    });
}

export async function validateApiToken(apiToken) {
    try {
        const response = await fetch(`https://api.hypothes.is/api/profile`, {
            headers: {
                Authorization: `Bearer ${apiToken}`,
            },
        });
        const json = await response.json();
        const fullUserId = json.userid; // e.g. acct:remikalir@hypothes.is
        return fullUserId.match(/([^:]+)@/)[1];
    } catch {
        return null;
    }
}
