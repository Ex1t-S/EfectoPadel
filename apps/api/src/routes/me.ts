import { Router } from "express";
import { z } from "zod";
import { PADEL_CATEGORIES } from "@efecto/shared";
import { requireUser } from "../auth.js";
import { asyncHandler } from "../http.js";
import { queryOne } from "../db.js";

export const meRouter = Router();

const profileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(6),
  category: z.enum(PADEL_CATEGORIES)
});

meRouter.use(requireUser);

meRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    res.json({
      data: await queryOne("select id, email, first_name, last_name, phone, category, role, elo, created_at from profiles where id = $1", [
        req.user!.id
      ])
    });
  })
);

meRouter.put(
  "/me",
  asyncHandler(async (req, res) => {
    const body = profileSchema.parse(req.body);
    res.json({
      data: await queryOne(
        `update profiles
         set first_name = $2, last_name = $3, phone = $4, category = $5
         where id = $1
         returning id, email, first_name, last_name, phone, category, role, elo, created_at`,
        [req.user!.id, body.firstName, body.lastName, body.phone, body.category]
      )
    });
  })
);
