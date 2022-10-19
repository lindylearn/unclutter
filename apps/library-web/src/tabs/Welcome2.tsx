import { useUser } from "@supabase/auth-helpers-react";
import {
    setUnclutterLibraryAuth,
    checkHasSubscription,
} from "@unclutter/library-components/dist/common";
import { useContext, useEffect, useState } from "react";

import {
    ReplicacheContext,
    useSubscribe,
} from "@unclutter/library-components/dist/store";

export default function Welcome2Tab() {
    const rep = useContext(ReplicacheContext);
    const { user } = useUser();

    useEffect(() => {
        (async () => {
            if (user && user.email) {
                console.log(user);

                // fetch email subscription status
                const onPaidPlan = await checkHasSubscription(
                    user.id,
                    user.email
                );

                // create userInfo
                await rep?.mutate.updateUserInfo({
                    id: user.id,
                    name: undefined,
                    signinProvider: user.app_metadata.provider as any,
                    email: user.email,
                    accountEnabled: true,
                    onPaidPlan,
                });

                // init extension replicache after insert
                setUnclutterLibraryAuth(user.id);
            }
        })();
    }, [user]);

    const userInfo = useSubscribe(rep, rep?.subscribe.getUserInfo(), null);

    return (
        <div className="font-text mb-10 flex flex-col gap-10 p-5 text-stone-900 dark:text-stone-200">
            You successfully created an account!
            {JSON.stringify(userInfo)}
        </div>
    );
}
