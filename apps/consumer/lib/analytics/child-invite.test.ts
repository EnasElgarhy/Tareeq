import { describe, expect, it } from "vitest";
import { childInviteUrl, whatsappShareUrl } from "./child-invite";

describe("childInviteUrl", () => {
  it("passes the parent's own utm tags on to the child's start link", () => {
    expect(
      childInviteUrl("https://mapmycore.com/", {
        src: "instagram",
        medium: "paid",
        campaign: "launch-m1",
        post: "p2-carousel-03-ar",
      }),
    ).toBe(
      "https://mapmycore.com/?utm_source=instagram&utm_medium=paid&utm_campaign=launch-m1&utm_content=p2-carousel-03-ar",
    );
  });

  it("labels an untagged or referred parent as a WhatsApp share", () => {
    const share = "https://mapmycore.com/?utm_source=whatsapp&utm_medium=share&utm_content=parent-to-child";
    expect(childInviteUrl("https://mapmycore.com", { src: "direct" })).toBe(share);
    expect(childInviteUrl("https://mapmycore.com", { src: "google.com", medium: "referral" })).toBe(share);
    expect(childInviteUrl("https://mapmycore.com", {})).toBe(share);
  });
});

describe("whatsappShareUrl", () => {
  it("encodes the message and link together", () => {
    expect(whatsappShareUrl("It's free to start:", "https://x.test/?a=1&b=2")).toBe(
      "https://wa.me/?text=It's%20free%20to%20start%3A%20https%3A%2F%2Fx.test%2F%3Fa%3D1%26b%3D2",
    );
  });
});
