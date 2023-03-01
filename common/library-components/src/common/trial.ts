import { useEffect, useState } from "react";
import type { UserInfo } from "../store";
import { createPaymentsLink } from "./api";

export function getTrialDaysLeft(userInfo?: UserInfo): number | undefined {
    if (!userInfo?.trialEnd) {
        return undefined;
    }
    const now = new Date();
    const trialEndDate = new Date(userInfo.trialEnd * 1000);

    return Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));
}

export function getTrialProgress(daysLeft?: number): number {
    if (daysLeft === undefined) {
        return 0;
    }

    const trialLength = 14;
    return Math.max(0.1, Math.min(1, (trialLength - daysLeft) / trialLength));
}

export function usePaymentsLink(userInfo?: UserInfo) {
    return "";
    const [paymentsLink, setPaymentsLink] = useState<string>();
    useEffect(() => {
        if (!userInfo?.email || userInfo?.aiEnabled) {
            return;
        }
        createPaymentsLink(userInfo.id, userInfo.email).then(setPaymentsLink);
    }, [userInfo]);

    return paymentsLink;
}
