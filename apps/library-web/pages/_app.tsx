import { supabaseClient } from "@supabase/auth-helpers-nextjs";
import { UserProvider } from "@supabase/auth-helpers-react";
import { useEffect } from "react";

import "@unclutter/library-components/styles/globals.css";
import "@unclutter/library-components/styles/ArticlePreview.css";
import "@unclutter/library-components/styles/ProgressCircle.css";
import "../styles/globals.css";
import { initPosthog } from "../common/metrics";

function MyApp({ Component, pageProps }) {
    useEffect(() => {
        initPosthog();
    }, []);

    // crisp.chat bubble
    // useEffect(() => {
    //     // @ts-ignore
    //     window.$crisp = [];
    //     // @ts-ignore
    //     window.CRISP_WEBSITE_ID = "4fff2160-a2f2-4c45-958b-dc03bcbd2166";
    //     (() => {
    //         const d = document;
    //         const s = d.createElement("script");
    //         s.src = "https://client.crisp.chat/l.js";
    //         // @ts-ignore
    //         s.async = 1;
    //         d.getElementsByTagName("body")[0].appendChild(s);
    //     })();
    // }, []);

    return (
        <UserProvider supabaseClient={supabaseClient}>
            <Component {...pageProps} />
        </UserProvider>
    );
}

export default MyApp;
