import { NextResponse } from "next/server";
import {
  assessmentVersionCookieName,
  assessmentVersionCookieValue,
  getAssessmentVersionRef,
} from "@/lib/assessment/content";
import { loadAssessmentContentForReference } from "@/lib/assessment/content.server";

export const runtime = "nodejs";

type SessionBody = {
  versionId?: unknown;
  versionLabel?: unknown;
};

export async function POST(request: Request) {
  let body: SessionBody;
  try {
    body = (await request.json()) as SessionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const versionId =
    typeof body.versionId === "string" && body.versionId
      ? body.versionId
      : null;
  const versionLabel =
    typeof body.versionLabel === "string" && body.versionLabel
      ? body.versionLabel
      : undefined;
  const content = await loadAssessmentContentForReference({
    versionId,
    versionLabel,
  });
  if (!content) {
    return NextResponse.json(
      { error: "That assessment version is no longer available." },
      { status: 409 },
    );
  }

  const ref = getAssessmentVersionRef(content);
  const response = NextResponse.json({
    ...ref,
    totalQuestions: content.questions.length,
  });
  response.cookies.set(
    assessmentVersionCookieName,
    assessmentVersionCookieValue(ref),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  );
  return response;
}
