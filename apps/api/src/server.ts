import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { errorHandler } from "./http.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/authRoutes.js";
import { challengesRouter } from "./routes/challenges.js";
import { meRouter } from "./routes/me.js";
import { publicRouter } from "./routes/public.js";
import { reservationsRouter } from "./routes/reservations.js";
import { tournamentsRouter } from "./routes/tournaments.js";
import { webhooksRouter } from "./routes/webhooks.js";

const app = express();

app.use(
  cors({
    origin: [config.appPublicUrl, config.adminPublicUrl, "http://localhost:8081", "http://localhost:5173"],
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.use(authRouter);
app.use(publicRouter);
app.use(webhooksRouter);
app.use(meRouter);
app.use(reservationsRouter);
app.use(challengesRouter);
app.use(tournamentsRouter);
app.use(adminRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Efecto Padel API listening on :${config.port}`);
});
