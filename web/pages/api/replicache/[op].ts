import { getUser, withApiAuth } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import process from "process";

import { handleRequest } from "@unclutter/replicache-nextjs/lib/backend";
import { mutators } from "@unclutter/library-components/dist/store";

async function handler(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<void> {
    // handle CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
        res.setHeader(
            "Access-Control-Allow-Methods",
            "PUT, POST, PATCH, DELETE, GET"
        );
        return res.status(200).json({});
    }

    // support static api tokens for automated article inserts
    const apiToken = req.headers["api-token"];
    if (apiToken && process.env.AUTOMATED_API_TOKEN) {
        if (apiToken !== process.env.AUTOMATED_API_TOKEN) {
            res.status(401).json({ error: "Invalid API token" });
            return;
        }
        await handleRequest(req, res, mutators);
        return;
    }

    // parse saved webJwt saved in extension (sending via auth header is easier)
    if (Object.keys(req.cookies).length === 0 && req.headers.authorization) {
        req.cookies = Object.fromEntries(
            req.headers.authorization.split("; ").map((c) => c.split("="))
        );
    }

    await authenticatedHandler(req, res);
}

const authenticatedHandler = withApiAuth(
    async (req: NextApiRequest, res: NextApiResponse) => {
        const { user } = await getUser({ req, res });
        if (user === null) {
            res.status(401).json({
                error: "Unauthenticated",
                message: "The authentication token is invalid",
            });
            return;
        }
        if (user.id !== req.query.spaceID) {
            res.status(403).json({
                error: "Forbidden",
                message: "User has no access to this spaceID",
            });
            return;
        }

        await handleRequest(req, res, mutators);
    },
    // do not expire JWT tokens for now to make extension auth easier
    // alternative: increase refresh_token reuse interval and assume both web & extension update in each interval
    // see https://github.com/supabase/gotrue/pull/466
    { tokenRefreshMargin: 60 * 60 * 24 * 365 }
);

export default handler;
