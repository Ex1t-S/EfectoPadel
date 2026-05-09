import { Router } from "express";
import { z } from "zod";
import { PADEL_CATEGORIES } from "@efecto/shared";
import { requireAdmin, requireUser } from "../auth.js";
import { HttpError, asyncHandler } from "../http.js";
import { queryOne, transaction } from "../db.js";
import { buildGroupsAndBracket } from "../services/tournaments.js";

export const tournamentsRouter = Router();

const createSchema = z.object({
  title: z.string().min(3),
  category: z.enum(PADEL_CATEGORIES),
  startsAt: z.string().datetime(),
  maxTeams: z.number().int().min(4).max(64),
  description: z.string().default("")
});

tournamentsRouter.use(requireUser);

tournamentsRouter.post(
  "/tournaments",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    res.json({
      data: await queryOne(
        `insert into tournaments (title, category, starts_at, max_teams, description, status)
         values ($1, $2, $3, $4, $5, 'open')
         returning *`,
        [body.title, body.category, body.startsAt, body.maxTeams, body.description]
      )
    });
  })
);

tournamentsRouter.post(
  "/tournaments/:id/register",
  asyncHandler(async (req, res) => {
    res.json({
      data: await queryOne(
        `insert into tournament_registrations (tournament_id, user_id, status)
         values ($1, $2, 'pending')
         on conflict (tournament_id, user_id) do update set status = excluded.status
         returning *`,
        [req.params.id, req.user!.id]
      )
    });
  })
);

tournamentsRouter.post(
  "/tournaments/:id/registrations/:registrationId/confirm",
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      data: await queryOne(
        `update tournament_registrations
         set status = 'confirmed'
         where id = $1 and tournament_id = $2
         returning *`,
        [req.params.registrationId, req.params.id]
      )
    });
  })
);

tournamentsRouter.post(
  "/tournaments/:id/generate-bracket",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await transaction(async (client) => {
      const registrationsResult = await client.query(
        `select tr.user_id, p.first_name, p.last_name
         from tournament_registrations tr
         join profiles p on p.id = tr.user_id
         where tr.tournament_id = $1 and tr.status = 'confirmed'`,
        [req.params.id]
      );
      if (registrationsResult.rows.length < 4) throw new HttpError(400, "At least 4 confirmed players required");

      const entrants = registrationsResult.rows.map((registration) => ({
        id: registration.user_id,
        displayName: `${registration.first_name} ${registration.last_name}`
      }));
      const generated = buildGroupsAndBracket(entrants);

      await client.query("delete from tournament_groups where tournament_id = $1", [req.params.id]);
      await client.query("delete from tournament_matches where tournament_id = $1", [req.params.id]);

      const groups = [];
      for (let index = 0; index < generated.groups.length; index += 1) {
        const inserted = await client.query(
          `insert into tournament_groups (tournament_id, name, player_ids)
           values ($1, $2, $3)
           returning *`,
          [req.params.id, `Grupo ${String.fromCharCode(65 + index)}`, generated.groups[index]!.map((entrant) => entrant.id)]
        );
        groups.push(inserted.rows[0]);
      }

      const matches = [];
      for (const match of generated.groupMatches) {
        const inserted = await client.query(
          `insert into tournament_matches (tournament_id, stage, group_index, player_a_id, player_b_id)
           values ($1, 'group', $2, $3, $4)
           returning *`,
          [req.params.id, match.groupIndex, match.playerAId, match.playerBId]
        );
        matches.push(inserted.rows[0]);
      }
      for (const match of generated.bracketMatches) {
        const inserted = await client.query(
          `insert into tournament_matches (tournament_id, stage, round, match_index)
           values ($1, 'knockout', $2, $3)
           returning *`,
          [req.params.id, match.round, match.matchIndex]
        );
        matches.push(inserted.rows[0]);
      }

      await client.query("update tournaments set status = 'in_progress' where id = $1", [req.params.id]);
      return { groups, matches };
    });

    res.json({ data: result });
  })
);
