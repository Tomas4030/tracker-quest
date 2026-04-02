import { NextResponse } from "next/server";
import type { ReportRequestPayload, SmartReport } from "@/types";
import { buildSmartReport } from "@/utils/analytics";

function isSmartReport(value: unknown): value is SmartReport {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SmartReport>;
  return (
    Array.isArray(candidate.insights) && Array.isArray(candidate.difficulties)
  );
}

async function generateWithExternalApi(
  payload: ReportRequestPayload,
): Promise<SmartReport | null> {
  const apiUrl = "https://api.group.com";
  const apiKey = process.env.GROUP_API_KEY;

  if (!apiKey) {
    return null;
  }

  let data: unknown;
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        source: "estagio-track",
        type: "smart-report",
        payload,
      }),
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      return null;
    }

    data = (await response.json()) as unknown;
  } catch {
    return null;
  }

  if (isSmartReport(data)) {
    return data;
  }

  if (
    data &&
    typeof data === "object" &&
    "report" in data &&
    isSmartReport((data as { report?: unknown }).report)
  ) {
    return (data as { report: SmartReport }).report;
  }

  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    isSmartReport((data as { data?: unknown }).data)
  ) {
    return (data as { data: SmartReport }).data;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ReportRequestPayload;

    const externalReport = await generateWithExternalApi(payload);
    if (externalReport) {
      return NextResponse.json(externalReport);
    }

    const localReport = buildSmartReport({
      activities: payload.activities,
      users: payload.users,
      projects: payload.projects,
      periodLabel: `${payload.scope} · ${payload.period}`,
    });

    return NextResponse.json(localReport);
  } catch {
    const fallback = buildSmartReport({
      activities: [],
      users: [],
      projects: [],
      periodLabel: "fallback",
    });
    return NextResponse.json(fallback);
  }
}
