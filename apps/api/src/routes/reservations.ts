import { Router } from "express";
import { z } from "zod";
import { HOLD_MINUTES, addMinutes } from "@efecto/shared";
import { requireAdmin, requireUser } from "../auth.js";
import { HttpError, asyncHandler } from "../http.js";
import { query, queryOne, transaction } from "../db.js";
import { createBookingPreference } from "../services/mercadoPago.js";

export const reservationsRouter = Router();

const preferenceSchema = z.object({
  courtId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime()
});

reservationsRouter.use(requireUser);

reservationsRouter.get(
  "/reservations/mine",
  asyncHandler(async (req, res) => {
    res.json({
      data: await query(
        `select r.*, c.name as court_name
         from reservations r
         join courts c on c.id = r.court_id
         where r.user_id = $1
         order by r.starts_at desc`,
        [req.user!.id]
      )
    });
  })
);

reservationsRouter.post(
  "/payments/booking-preference",
  asyncHandler(async (req, res) => {
    const body = preferenceSchema.parse(req.body);
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    const holdExpiresAt = addMinutes(new Date(), HOLD_MINUTES).toISOString();

    const court = await queryOne<any>("select * from courts where id = $1 and active = true", [body.courtId]);
    if (!court) throw new HttpError(404, "Court not found");

    const reservation = await transaction(async (client) => {
      const conflicts = await client.query(
        `select id from reservations
         where court_id = $1
           and starts_at < $3
           and ends_at > $2
           and (status = 'confirmed' or (status = 'hold' and hold_expires_at > now()))`,
        [body.courtId, startsAt.toISOString(), endsAt.toISOString()]
      );
      if (conflicts.rowCount) throw new HttpError(409, "Slot is no longer available");

      const inserted = await client.query(
        `insert into reservations (court_id, user_id, starts_at, ends_at, status, hold_expires_at)
         values ($1, $2, $3, $4, 'hold', $5)
         returning *`,
        [body.courtId, req.user!.id, startsAt.toISOString(), endsAt.toISOString(), holdExpiresAt]
      );
      return inserted.rows[0];
    });

    const preference = await createBookingPreference({
      reservationId: reservation.id,
      title: `${court.name} - Sena turno Efecto Padel`,
      depositCents: court.deposit_cents,
      payerEmail: req.user!.email
    });

    await query(
      `insert into payments (reservation_id, provider, provider_preference_id, amount_cents, status)
       values ($1, 'mercadopago', $2, $3, 'pending')`,
      [reservation.id, preference.id, court.deposit_cents]
    );

    res.json({
      data: {
        reservation,
        preferenceId: preference.id,
        checkoutUrl: preference.sandbox_init_point || preference.init_point,
        holdExpiresAt
      }
    });
  })
);

reservationsRouter.post(
  "/reservations/:id/cancel",
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      data: await queryOne(
        "update reservations set status = 'cancelled' where id = $1 returning *",
        [req.params.id]
      )
    });
  })
);
