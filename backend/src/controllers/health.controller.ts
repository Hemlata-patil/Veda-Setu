import { Request, Response } from "express";

export function getHealth(req: Request, res: Response): void {
  res.status(200).json({
    status: "ok",
    service: "veda-setu-backend",
  });
}
