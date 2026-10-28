// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sendEmail: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/email/send-email", async () => {
  const actual = await vi.importActual<typeof import("@/lib/email/send-email")>("@/lib/email/send-email");
  return { ...actual, sendEmail: mocks.sendEmail };
});

import { buildSafeguardingEmail, sendSafeguardingAlert } from "./safeguarding-alert";

const alert = {
  userId: "11111111-1111-4111-8111-111111111111",
  threadId: "thread-1",
  requestId: "req-1",
  at: new Date("2026-10-28T10:00:00.000Z"),
};

describe("safeguarding alert email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SAFEGUARDING_ALERT_TO;
    mocks.sendEmail.mockResolvedValue({ sent: true, messageId: "m1" });
  });

  it("names the account and conversation without quoting the student", () => {
    const email = buildSafeguardingEmail(alert);
    expect(email.subject).toBe("Map My CORE: safeguarding alert from Kai");
    expect(email.text).toContain("Student account: 11111111-1111-4111-8111-111111111111");
    expect(email.text).toContain("Conversation: thread-1");
    expect(email.text).toContain("is not included in this email");
  });

  it("goes to enas@mapmycore.com unless configured otherwise", async () => {
    await sendSafeguardingAlert(alert);
    expect(mocks.sendEmail.mock.calls[0][0].to).toEqual(["enas@mapmycore.com"]);

    process.env.SAFEGUARDING_ALERT_TO = "a@x.test, b@x.test";
    await sendSafeguardingAlert(alert);
    expect(mocks.sendEmail.mock.calls[1][0].to).toEqual(["a@x.test", "b@x.test"]);
  });

  it("never throws when sending fails", async () => {
    mocks.sendEmail.mockRejectedValue(new Error("SES down"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(sendSafeguardingAlert(alert)).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
  });
});
