import React, { useContext, useEffect, useState } from "react";
import { ReplicacheContext, UserInfo } from "../../store";
import { LindyIcon } from "../Icons";

export default function SignupBottomMessage({
    articleId,
    darkModeEnabled,
    reportEvent = () => {},
}: {
    articleId: string;
    darkModeEnabled: boolean;
    reportEvent?: (event: string, data?: any) => void;
}) {
    const rep = useContext(ReplicacheContext);
    const [userInfo, setUserInfo] = useState<UserInfo | null>();
    useEffect(() => {
        rep?.query.getUserInfo().then(setUserInfo);
    }, [rep]);

    return (
        <a
            className="bottom-content bottom-review flex flex-col gap-[8px] text-stone-800 transition-all hover:scale-[99%] dark:text-[rgb(232,230,227)]"
            onClick={() => reportEvent("clickBottomSignupMessage")}
            href={
                userInfo?.accountEnabled
                    ? "https://my.unclutter.it/smart-reading"
                    : "https://my.unclutter.it/signup"
            }
            target="_blank"
            rel="noreferrer"
        >
            <CardContainer>
                <LindyIcon className="mt-1 w-8 shrink-0" />
                <div className="flex flex-col">
                    <div className="font-title text-lg font-semibold">
                        Make sense of what you read
                    </div>
                    <div className="">
                        Unclutter can automatically create, organize, and surface related article
                        highlights for you.{" "}
                        {userInfo?.accountEnabled ? (
                            <>
                                Enable the AI Smart Reading features to make use of all the articles
                                you've read.
                            </>
                        ) : (
                            <>
                                Create an account to enable the AI Smart Reading features and to
                                back-up your library.
                            </>
                        )}
                    </div>
                </div>
            </CardContainer>
        </a>
    );
}

function CardContainer({ children }) {
    return (
        <div
            className="relative mx-auto flex w-[var(--lindy-pagewidth)] items-start gap-4 overflow-hidden rounded-lg bg-white p-4 shadow dark:bg-[#212121]"
            // bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-400
            // style={{ backgroundImage: "linear-gradient(120deg, var(--tw-gradient-stops))" }}
        >
            {children}
        </div>
    );
}
