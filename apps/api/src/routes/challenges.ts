import { Router } from "express";
import { z } from "zod";
import { PADEL_CATEGORIES, calculateElo } from "@efecto/shared";
import { requireUser } from "../auth.js";
import { HttpError, asyncHandler } from "../http.js";
import { query, queryOne, transaction } from "../db.js";

export const challengesRouter = Router();

const createSchema = z.object({
  opponentId: z.string().uuid(),
  category: z.enum(PADEL_CATEGORIES)
});

const resultSchema = z.object({
  winnerId: z.string().uuid(),
  score: z.string().min(3)
});

challengesRouter.use(requireUser);

challengesRouter.get(
  "/challenges",
  asyncHandler(async (req, res) => {
    res.json({
      data: await query(
        `select * from challenge_matches
         where challenger_id = $1 or opponent_id = $1
         order by created_at desc`,
        [req.user!.id]
      )
    });
  })
);

challengesRouter.post(
  "/challenges",
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    if (body.opponentId === req.user!.id) throw new HttpError(400, "Cannot challenge yourself");
    res.json({
      data: await queryOne(
        `insert into challenge_matches (challenger_id, opponent_id, category, status)
         values ($1, $2, $3, 'pending')
         returning *`,
        [req.user!.id, body.opponentId, body.category]
      )
    });
  })
);

challengesRouter.post(
  "/challenges/:id/accept",
  asyncHandler(async (req, res) => {
    res.json({
      data: await queryOne(
        `update challenge_matches set status = 'accepted'
         where id = $1 and opponent_id = $2 returning *`,
        [req.params.id, req.user!.id]
      )
    });
  })
);

challengesRouter.post(
  "/challenges/:id/result",
  asyncHandler(async (req, res) => {
    const body = resultSchema.parse(req.body);
    const challenge = await queryOne<any>("select * from challenge_matches where id = $1", [req.params.id]);
    if (!challenge) throw new HttpError(404, "Challenge not found");
    if (![challenge.challenger_id, challenge.opponent_id].includes(req.user!.id)) {
      throw new HttpError(403, "Not part of this challenge");
    }

    res.json({
      data: await queryOne(
        `update challenge_matches
         set winner_id = $2, score = $3, status = 'reported', reported_by = $4
         where id = $1
         returning *`,
        [req.params.id, body.winnerId, body.score, req.user!.id]
      )
    });
  })
);

challengesRouter.post(
  "/challenges/:id/confirm",
  asyncHandler(async (req, res) => {
    const result = await transaction(async (client) => {
      const challengeResult = await client.query("select * from challenge_matches where id = $1", [req.params.id]);
      const challenge = challengeResult.rows[0];
      if (!challenge) throw new HttpError(404, "Challenge not found");
      if (![challenge.challenger_id, challenge.opponent_id].includes(req.user!.id)) {
        throw new HttpError(403, "Not part of this challenge");
      }
      if (!challenge.winner_id) throw new HttpError(400, "Result is missing");

      const loserId = challenge.winner_id === challenge.challenger_id ? challenge.opponent_id : challenge.challenger_id;
      const profilesResult = await client.query("select id, elo from profiles where id = any($1::uuid[])", [
        [challenge.winner_id, loserId]
      ]);
      const winner = profilesResult.rows.find((profile) => profile.id === challenge.winner_id);
      const loser = profilesResult.rows.find((profile) => profile.id === loserId);
      if (!winner || !loser) throw new HttpError(404, "Profiles not found");

      const next = calculateElo(winner.elo, loser.elo);
      await client.query(
        `insert into elo_history (user_id, challenge_id, previous_elo, next_elo)
         values ($1, $2, $3, $4), ($5, $2, $6, $7)`,
        [winner.id, challenge.id, winner.elo, next.winner, loser.id, loser.elo, next.loser]
      );
      await client.query("update profiles set elo = $2 where id = $1", [winner.id, next.winner]);
      await client.query("update profiles set elo = $2 where id = $1", [loser.id, next.loser]);
      const updated = await client.query(
        `update challenge_matches
         set status = 'confirmed', confirmed_at = now()
         where id = $1 returning *`,
        [challenge.id]
      );
      return updated.rows[0];
    });

    res.json({ data: result });
  })
);
