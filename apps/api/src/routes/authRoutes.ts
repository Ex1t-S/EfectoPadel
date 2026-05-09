import { Router } from "express";
import { z } from "zod";
import {
  comparePassword,
  defaultUserValues,
  hashPassword,
  normalizeCategory,
  signToken,
  verifyGoogleIdToken
} from "../auth.js";
import { HttpError, asyncHandler } from "../http.js";
import { queryOne } from "../db.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(6),
  category: z.string().default("5ta")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const googleSchema = z.object({
  idToken: z.string().min(10),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  category: z.string().optional()
});

authRouter.post(
  "/auth/register",
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const passwordHash = await hashPassword(body.password);
    const profile = await queryOne(
      `insert into profiles (email, password_hash, first_name, last_name, phone, category, role, elo)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id, email, first_name, last_name, phone, category, role, elo`,
      [
        body.email.toLowerCase(),
        passwordHash,
        body.firstName,
        body.lastName,
        body.phone,
        normalizeCategory(body.category),
        defaultUserValues.role,
        defaultUserValues.elo
      ]
    );

    const token = signToken({ id: profile.id, email: profile.email, role: profile.role });
    res.json({ data: { token, profile } });
  })
);

authRouter.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const profile = await queryOne<any>(
      "select * from profiles where email = $1",
      [body.email.toLowerCase()]
    );
    if (!profile?.password_hash) throw new HttpError(401, "Invalid credentials");
    const ok = await comparePassword(body.password, profile.password_hash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    const token = signToken({ id: profile.id, email: profile.email, role: profile.role });
    delete profile.password_hash;
    res.json({ data: { token, profile } });
  })
);

authRouter.post(
  "/auth/google",
  asyncHandler(async (req, res) => {
    const body = googleSchema.parse(req.body);
    const google = await verifyGoogleIdToken(body.idToken);
    const email = google.email!.toLowerCase();
    const existing = await queryOne<any>("select * from profiles where email = $1", [email]);

    const profile =
      existing ??
      (await queryOne<any>(
        `insert into profiles (email, google_sub, first_name, last_name, phone, category, role, elo)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         returning id, email, first_name, last_name, phone, category, role, elo`,
        [
          email,
          google.sub,
          body.firstName ?? google.given_name ?? "Jugador",
          body.lastName ?? google.family_name ?? "Efecto",
          body.phone ?? "",
          normalizeCategory(body.category ?? "5ta"),
          defaultUserValues.role,
          defaultUserValues.elo
        ]
      ));

    const token = signToken({ id: profile.id, email: profile.email, role: profile.role });
    delete profile.password_hash;
    res.json({ data: { token, profile } });
  })
);
