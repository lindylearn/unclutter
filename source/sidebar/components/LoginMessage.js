import { useState } from "react";

import { validateSaveToken } from "../../common/storage";

export default function LoginMessage({ onLogin }) {
    const [token, setToken] = useState("");
    async function onSave() {
        await validateSaveToken(token);
        onLogin();
    }

    return (
        <div className="py-1 px-2 rounded-lg bg-white drop-shadow-sm text-sm md:text-base">
            <p className="mb-1">
                To highlight and annotate web pages, create a free{" "}
                <a
                    className="underline"
                    href="https://web.hypothes.is"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Hypothes.is
                </a>{" "}
                account and enter your{" "}
                <a
                    className="underline"
                    href="https://hypothes.is/account/developer"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    API token
                </a>{" "}
                here:
            </p>
            <div className="flex">
                <input
                    className="flex-grow bg-gray-50 rounded-md py-1 px-2 outline-none"
                    placeholder="Your API token"
                    spellCheck="false"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                />
                <button
                    className="bg-green-200 rounded-lg px-2 py-0.5 ml-2"
                    onClick={onSave}
                >
                    Save
                </button>
            </div>
        </div>
    );
}
