import React from "react";
import {
    getHypothesisToken,
    validateSaveToken,
} from "../common/annotations/storage";
import { createRemoteAnnotation } from "../sidebar/common/api";
import {
    deleteAllLocalAnnotations,
    getAllLocalAnnotations,
} from "../sidebar/common/local";

export default function HypothesisConfig() {
    const [token, setToken] = React.useState("");
    React.useEffect(() => {
        (async function () {
            const existingToken = await getHypothesisToken();
            setToken(existingToken);
        })();
    }, []);

    const [tokenValid, setTokenValid] = React.useState("");
    React.useEffect(() => {
        (async function () {
            if (token === "") {
                return;
            }

            const tokenValid = await validateSaveToken(token, true);
            setTokenValid(tokenValid);
        })();
    }, [token]);

    // if this renders, the user has enabled the hypothesis sync
    // so upload & delete local annotations once token valid
    // TODO: user may exit settings before uploaded, which will create duplicate annotations
    React.useEffect(() => {
        (async function () {
            if (!tokenValid) {
                return;
            }

            const localAnnotations = await getAllLocalAnnotations();
            if (localAnnotations.length === 0) {
                return;
            }

            console.log(
                `Uploading ${localAnnotations.length} local annotations...`
            );
            await Promise.all(localAnnotations.map(createRemoteAnnotation));

            await deleteAllLocalAnnotations();
        })();
    }, [tokenValid]);

    return (
        <div className="flex gap-2 items-center">
            <p className="mb-1">
                Your{" "}
                <a
                    className="underline"
                    href="https://hypothes.is/account/developer"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    API token
                </a>
                :
            </p>
            <input
                className={
                    "flex-grow shadow-inner py-1 px-2 outline-none rounded border-2 " +
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
