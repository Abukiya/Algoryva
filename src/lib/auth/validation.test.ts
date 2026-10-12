import { describe, expect, it } from "vitest";
import { parseRegister } from "./validation";

const form = (o: Record<string, string>) => { const f = new FormData(); Object.entries(o).forEach(([k, v]) => f.set(k, v)); return f; };

describe("parseRegister", () => {
  it("accepts valid input and normalizes email", () => {
    const r = parseRegister(form({ email: " A@B.com ", username: "cody_1", password: "longenough1" }));
    expect(r.ok && r.value.email).toBe("a@b.com");
  });
  it("rejects short passwords and bad usernames", () => {
    expect(parseRegister(form({ email: "a@b.com", username: "cody", password: "short" })).ok).toBe(false);
    expect(parseRegister(form({ email: "a@b.com", username: "x y", password: "longenough1" })).ok).toBe(false);
  });
});
