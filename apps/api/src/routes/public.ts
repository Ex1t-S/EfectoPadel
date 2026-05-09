import { Router } from "express";
import { asyncHandler } from "../http.js";
import { query } from "../db.js";

export const publicRouter = Router();

publicRouter.get(
  "/health",
  asyncHandler(async (_req, res) => {
    res.json({ data: { ok: true, service: "efecto-api", database: "neon-postgresql" } });
  })
);

publicRouter.get(
  "/courts",
  asyncHandler(async (_req, res) => {
    res.json({
      data: await query("select * from courts where active = true order by name")
    });
  })
);

publicRouter.get(
  "/slots",
  asyncHandler(async (req, res) => {
    const date = String(req.query.date ?? new Date().toISOString().slice(0, 10));
    res.json({
      data: await query(
        `select * from available_slots
         where starts_at >= ($1::date)
           and starts_at < ($1::date + interval '1 day')
         order by starts_at`,
        [date]
      )
    });
  })
);

publicRouter.get(
  "/leaderboard",
  asyncHandler(async (req, res) => {
    const category = String(req.query.category ?? "5ta");
    res.json({
      data: await query(
        `select id, first_name, last_name, category, elo
         from profiles
         where category = $1
         order by elo desc
         limit 100`,
        [category]
      )
    });
  })
);

publicRouter.get(
  "/tournaments",
  asyncHandler(async (_req, res) => {
    res.json({
      data: await query(
        `select * from tournaments
         where status in ('open', 'in_progress', 'finished')
         order by starts_at`
      )
    });
  })
);
