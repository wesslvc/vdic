import { NextRequest, NextResponse } from "next/server";
import { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, OVERRIDES_PATH } from "@/lib/syncConfig";

export const runtime = "nodejs";

type CustomWord = { id: string; term: string; meaning: string; lectureId: number };

type OverridesPayload = {
  meaningOverrides?: Record<string, string>;
  nuanceNotes?: Record<string, string>;
  lectureOverrides?: Record<string, number>;
  memos?: Record<string, string>;
  customWords?: Record<string, CustomWord>;
};

function contentsUrl() {
  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${OVERRIDES_PATH}`;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-edit-secret");
  if (!secret || !process.env.EDIT_SECRET || secret !== process.env.EDIT_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "sync not configured on server" }, { status: 500 });
  }

  let body: OverridesPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  const getRes = await fetch(`${contentsUrl()}?ref=${GITHUB_BRANCH}`, { headers });
  let sha: string | undefined;
  let current: OverridesPayload = {};
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
    try {
      current = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
    } catch {
      current = {};
    }
  } else if (getRes.status !== 404) {
    return NextResponse.json({ error: `github read failed: ${getRes.status}` }, { status: 502 });
  }

  const merged = {
    meaningOverrides: { ...current.meaningOverrides, ...body.meaningOverrides },
    nuanceNotes: { ...current.nuanceNotes, ...body.nuanceNotes },
    lectureOverrides: { ...current.lectureOverrides, ...body.lectureOverrides },
    memos: { ...current.memos, ...body.memos },
    customWords: { ...current.customWords, ...body.customWords },
  };
  const content = Buffer.from(JSON.stringify(merged, null, 2) + "\n", "utf-8").toString("base64");

  const putRes = await fetch(contentsUrl(), {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: "vdic: sync word edits",
      content,
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    return NextResponse.json({ error: `github write failed: ${errText}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
