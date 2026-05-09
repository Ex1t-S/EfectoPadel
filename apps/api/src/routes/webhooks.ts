import { Router } from "express";
import { asyncHandler } from "../http.js";
import { query } from "../db.js";
import { getPayment } from "../services/mercadoPago.js";

export const webhooksRouter = Router();

webhooksRouter.post(
  "/webhooks/mercadopago",
  asyncHandler(async (req, res) => {
    const paymentId = req.body?.data?.id ?? req.query["data.id"] ?? req.query.id;
    if (!paymentId) return res.status(200).json({ data: { ignored: true } });

    const payment = await getPayment(String(paymentId));
    const reservationId = payment.external_reference;
    if (!reservationId) return res.status(200).json({ data: { ignored: true } });

    const status = payment.status === "approved" ? "approved" : payment.status === "rejected" ? "rejected" : "pending";

    await query(
      `update payments
       set provider_payment_id = $2, status = $3, raw_payload = $4
       where reservation_id = $1`,
      [reservationId, String(payment.id), status, payment]
    );

    if (status === "approved") {
      await query(
        `update reservations
         set status = 'confirmed', hold_expires_at = null
         where id = $1`,
        [reservationId]
      );
    }

    if (status === "rejected") {
      await query(
        `update reservations
         set status = 'cancelled'
         where id = $1 and status = 'hold'`,
        [reservationId]
      );
    }

    res.json({ data: { ok: true } });
  })
);
