import ky from "ky-universal";
import { withSentry } from "@sentry/nextjs";
import { handleCors } from "../../../common/cors";

// special handling for potentially large archive fetch
async function handler(req, res) {
    if (handleCors(req, res)) {
        return;
    }

    const response = await ky.post(`https://getpocket.com/v3/get`, {
        json: {
            ...req.body,
            state: "all",
            contentType: "article",
            sort: "newest",
        },
        headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "X-Accept": "application/json",
        },
        timeout: 30000,
        retry: 0,
    });
    const { list } = (await response.json()) as any;

    res.status(200).json(Object.values(list));
}

export default withSentry(handler);
