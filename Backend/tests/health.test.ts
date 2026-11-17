import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

const appPromise = buildApp();

describe("GET /api/health", () => {
  it("returns a minimal health response", async () => {
    const app = await appPromise;
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok",
      service: "rent-car-ai-backend",
    });
  });
});

afterAll(async () => {
  const app = await appPromise;
  await app.close();
});
