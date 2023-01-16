import { Request, Response } from "express";

export function helloHttp(req: Request, res: Response) {
    res.send({ message: "Hello from TS2" });
}
