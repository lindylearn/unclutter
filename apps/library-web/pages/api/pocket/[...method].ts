import ky from "ky-universal";
import { withSentry } from "@sentry/nextjs";
import { handleCors } from "../../../common/cors";

async function handler(req, res) {
    if (handleCors(req, res)) {
        return;
    }

    const { method } = req.query;

    try {
        const response = await ky.post(`https://getpocket.com/v3/${method.join("/")}`, {
            json: req.body,
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
                "X-Accept": "application/json",
            },
            timeout: 10 * 1000,
            retry: 0,
        });
        const json = await response.json();
        res.status(200).json(json);
    } catch (err) {
        console.error(
            `Error for pocket request /${method.join("/")} ${JSON.stringify(req.body)}: ${
                err.message
            }`
        );
        console.error(err);
        res.status(err.response?.status || 500).send(err.response?.statusText);
    }
}

export default withSentry(handler);
