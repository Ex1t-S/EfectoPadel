import { Router } from "express";
import { z } from "zod";
import { requireAdmin, requireUser } from "../auth.js";
import { asyncHandler } from "../http.js";
import { query, queryOne } from "../db.js";

export const adminRouter = Router();

const courtSchema = z.object({
  name: z.string().min(2),
  active: z.boolean().default(true),
  slotMinutes: z.number().int().min(30).max(180),
  priceCents: z.number().int().min(0),
  depositCents: z.number().int().min(0)
});

adminRouter.use(requireUser, requireAdmin);

adminRouter.get(
  "/admin/dashboard",
  asyncHandler(async (_req, res) => {
    const [reservations, users, tournaments] = await Promise.all([
      queryOne<{ count: string }>("select count(*) from reservations"),
      queryOne<{ count: string }>("select count(*) from profiles"),
      queryOne<{ count: string }>("select count(*) from tournaments")
    ]);

    res.json({
      data: {
        reservations: Number(reservations?.count ?? 0),
        users: Number(users?.count ?? 0),
        tournaments: Number(tournaments?.count ?? 0)
      }
    });
  })
);

adminRouter.get(
  "/admin/reservations",
  asyncHandler(async (_req, res) => {
    res.json({
      data: await query(
        `select r.*, c.name as court_name, p.first_name, p.last_name, p.phone
         from reservations r
         join courts c on c.id = r.court_id
         join profiles p on p.id = r.user_id
         order by r.starts_at desc
         limit 200`
      )
    });
  })
);

adminRouter.get(
  "/admin/users",
  asyncHandler(async (_req, res) => {
    res.json({
      data: await query(
        `select id, email, first_name, last_name, phone, category, role, elo, created_at
         from profiles order by created_at desc limit 500`
      )
    });
  })
);

adminRouter.post(
  "/admin/courts",
  asyncHandler(async (req, res) => {
    const body = courtSchema.parse(req.body);
    res.json({
      data: await queryOne(
        `insert into courts (name, active, slot_minutes, price_cents, deposit_cents)
         values ($1, $2, $3, $4, $5)
         returning *`,
        [body.name, body.active, body.slotMinutes, body.priceCents, body.depositCents]
      )
    });
  })
);

adminRouter.put(
  "/admin/courts/:id",
  asyncHandler(async (req, res) => {
    const body = courtSchema.partial().parse(req.body);
    res.json({
      data: await queryOne(
        `update courts
         set name = coalesce($2, name),
             active = coalesce($3, active),
             slot_minutes = coalesce($4, slot_minutes),
             price_cents = coalesce($5, price_cents),
             deposit_cents = coalesce($6, deposit_cents)
         where id = $1
         returning *`,
        [req.params.id, body.name, body.active, body.slotMinutes, body.priceCents, body.depositCents]
      )
    });
  })
);
