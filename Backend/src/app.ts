import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { getEnv } from "./config/env.js";

export async function buildApp(): Promise<FastifyInstance> {
  const env = getEnv();
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
    bodyLimit: 15 * 1024 * 1024,
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  app.get("/api/health", async () => ({
    status: "ok",
    service: "rent-car-ai-backend",
  }));

  app.setErrorHandler((error, _request, reply) => {
    app.log.error({ err: error }, "Request failed");
    const statusCode =
      error.statusCode && error.statusCode >= 400 && error.statusCode < 500
        ? error.statusCode
        : 500;

    return reply.status(statusCode).send({
      error: statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR",
      message: statusCode === 500 ? "An unexpected error occurred." : error.message,
    });
  });

  return app;
}
