import React from "react";

export default function SignupBottomMessage({
    articleId,
    darkModeEnabled,
}: {
    articleId: string;
    darkModeEnabled: boolean;
}) {
    return (
        <div className="bottom-review flex flex-col gap-[8px] text-stone-800 dark:text-[rgb(232,230,227)]">
            <CardContainer>test</CardContainer>
        </div>
    );
}

function CardContainer({ children }) {
    return (
        <div className="relative mx-auto flex w-[var(--lindy-pagewidth)] flex-col gap-4 overflow-hidden rounded-lg bg-white p-4 shadow dark:bg-[#212121]">
            {children}
        </div>
    );
}
