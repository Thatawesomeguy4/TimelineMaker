import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { timelineRoutes } from "./routes/timeline.js";

const app = Fastify({
  logger: true
});

await app.register(cors, {
  origin: true,
  credentials: true
});

await app.register(cookie);

app.get("/health", async () => {
  return {
    status: "ok",
    service: "timeline-api"
  };
});

await app.register(timelineRoutes);

app.listen({
  port: 3000,
  host: "0.0.0.0"
});