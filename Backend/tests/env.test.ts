import { describe, expect, it } from "vitest";
import { parseEnv } from "../src/config/env.js";

const validEnv = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "server-only-test-key",
};

describe("environment configuration", () => {
  it("applies safe defaults and accepts required server credentials", () => {
    const parsed = parseEnv(validEnv);

    expect(parsed.PORT).toBe(3000);
    expect(parsed.CORS_ORIGIN).toBe("http://localhost:5173");
    expect(parsed.SUPABASE_SERVICE_ROLE_KEY).toBe("server-only-test-key");
  });

  it("rejects a missing Supabase service key", () => {
    expect(() =>
      parseEnv({ SUPABASE_URL: validEnv.SUPABASE_URL }),
    ).toThrow();
  });

  it("rejects an invalid Supabase URL", () => {
    expect(() =>
      parseEnv({
        SUPABASE_URL: "not-a-url",
        SUPABASE_SERVICE_ROLE_KEY: validEnv.SUPABASE_SERVICE_ROLE_KEY,
      }),
    ).toThrow();
  });
});
