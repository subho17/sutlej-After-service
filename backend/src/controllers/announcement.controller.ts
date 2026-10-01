import type { Request, Response } from "express";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
} from "../db/announcements.js";
import { ApiError } from "../utils/ApiError.js";

// GET /api/announcements — public (customer portal home reads this).
export async function listAnnouncementsHandler(req: Request, res: Response) {
  const activeOnly = req.query.active !== "all";
  const rows = await listAnnouncements(activeOnly);
  res.json({
    data: rows.map((r) => ({
      id: r.id,
      title: r.title,
      message: r.message,
      createdAt: r.created_at,
      active: r.active,
    })),
  });
}

// POST /api/announcements — staff only.
export async function createAnnouncementHandler(req: Request, res: Response) {
  const title = String(req.body?.title ?? "").trim();
  const message = String(req.body?.message ?? "").trim();

  if (!title || !message) throw new ApiError(400, "Title and message are required");

  const row = await createAnnouncement({
    title,
    message,
    publishedBy: req.user?.sub,
  });
  res.status(201).json({
    data: {
      id: row.id,
      title: row.title,
      message: row.message,
      createdAt: row.created_at,
      active: row.active,
    },
  });
}

// DELETE /api/announcements/:id — staff only.
export async function deleteAnnouncementHandler(req: Request, res: Response) {
  const id = String(req.params.id ?? "").trim();
  if (!id) throw new ApiError(400, "Announcement id is required");

  await deleteAnnouncement(id);
  res.json({ message: "Announcement deleted." });
}
