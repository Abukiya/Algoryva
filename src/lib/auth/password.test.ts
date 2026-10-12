import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const h = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });
  it("salts each hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });
  it("rejects malformed stored values", async () => {
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
});
