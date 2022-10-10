import React from "react";
import { UserInfo } from "../../store/user";

export default function SettingsModalTab({ userInfo }: { userInfo: UserInfo }) {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="py-1 font-medium">Library settings</h1>

            <div>
                <h2 className="font-medium">Account</h2>
                Not signed up. All articles are saved locally in your browser.
            </div>

            <div>
                <h2 className="font-medium">New Tab extension</h2>
                Want to see your reading queue on your browser's new tab page?
            </div>

            {/* <div>
                <h2 className="font-medium">Import / export</h2>
                Please import or export articles via library.lindylearn.io.
            </div> */}

            {/* <div>
                <h2 className="font-medium">Unclutter</h2>
                Configure the reader mode via the extension settings.
            </div> */}

            <div>
                <h2 className="font-medium">Open-source</h2>
                This project is open-source! Open an issue, give feedback, or
                contribute{" "}
                <a
                    href="https://github.com/lindylearn/unclutter/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium"
                >
                    on Github
                </a>
                .
            </div>

            <div>
                <h2 className="font-medium">Updates</h2>
                Oct 16: Released highlights integration v1
            </div>
        </div>
    );
}
