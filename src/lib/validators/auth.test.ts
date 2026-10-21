import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "./auth";

const valid = {
  name: "Ali Valiyev",
  username: "Ali_99",
  email: "  ALI@Example.com ",
  password: "secret123",
};

describe("registerSchema", () => {
  it("accepts valid input and normalizes username and email", () => {
    const result = registerSchema.parse(valid);
    expect(result.username).toBe("ali_99");
    expect(result.email).toBe("ali@example.com");
  });

  it("rejects short passwords with an Uzbek message", () => {
    const result = registerSchema.safeParse({ ...valid, password: "1234567" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Parol kamida 8 ta belgidan iborat bo'lishi kerak",
    );
  });

  it("rejects invalid usernames", () => {
    expect(registerSchema.safeParse({ ...valid, username: "al" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, username: "ali vali" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, username: "ali-vali" }).success).toBe(false);
  });

  it("rejects invalid emails", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Email manzil noto'g'ri");
  });
});

describe("loginSchema", () => {
  it("normalizes the identifier", () => {
    expect(loginSchema.parse({ identifier: " Ali_99 ", password: "x" }).identifier).toBe("ali_99");
  });

  it("requires both fields", () => {
    expect(loginSchema.safeParse({ identifier: "", password: "" }).success).toBe(false);
  });
});
