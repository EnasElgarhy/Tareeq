import { describe, expect, it } from "vitest";
import { exactEmailPattern } from "./email-match";

describe("exactEmailPattern", () => {
  it("leaves an ordinary address as it is", () => {
    expect(exactEmailPattern("sara@outlook.com")).toBe("sara@outlook.com");
  });

  it("escapes LIKE wildcards so they only match themselves", () => {
    expect(exactEmailPattern("s_ra@outlook.com")).toBe("s\\_ra@outlook.com");
    expect(exactEmailPattern("%@gmail.com")).toBe("\\%@gmail.com");
    expect(exactEmailPattern("a\\b@x.com")).toBe("a\\\\b@x.com");
  });

  it("trims the address", () => {
    expect(exactEmailPattern("  Sara@Outlook.com ")).toBe("Sara@Outlook.com");
  });
});
