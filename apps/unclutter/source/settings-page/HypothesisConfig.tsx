import React from "react";
import { getHypothesisToken, validateSaveToken } from "../common/annotations/storage";
import browser from "../common/polyfill";

export default function HypothesisConfig() {
    const [token, setToken] = React.useState("");
    React.useEffect(() => {
        (async function () {
            const existingToken = await getHypothesisToken();
            setToken(existingToken);
        })();
    }, []);

    const [tokenValid, setTokenValid] = React.useState<boolean>();
    React.useEffect(() => {
        (async function () {
            if (token === "") {
                return;
            }

            const tokenValid = await validateSaveToken(token, true);
            setTokenValid(tokenValid);

            // Trigger sync
            if (tokenValid) {
                browser.runtime.sendMessage(null, {
                    event: "initLibrary",
                });
            }
        })();
    }, [token]);

    return (
        <div className="flex items-center gap-2">
            <p className="mb-1">
                The{" "}
                <a
                    className="underline"
                    href="https://hypothes.is/account/developer"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    API token
                </a>{" "}
                for{" "}
                <a
                    className="underline"
                    href="https://hypothes.is/login"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    my account
                </a>
                :
            </p>
            <input
                className={
                    "flex-grow rounded border-2 py-1 px-2 shadow-inner outline-none " +
                    (tokenValid
                        ? "border-green-300 dark:border-green-500"
                        : "border-red-300 dark:border-red-500")
                }
                style={{ background: "var(--embedded-background)" }}
                placeholder="Hypothes.is API token"
                spellCheck="false"
                value={token}
                onChange={(e) => setToken(e.target.value)}
            />
        </div>
    );
}
