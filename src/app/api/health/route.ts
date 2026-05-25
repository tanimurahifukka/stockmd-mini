// Health endpoint — single source of truth for app readiness.
// scripts/sandbox/healthcheck.sh polls this; do not remove it.

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    project: "stockmd-mini",
    ts: new Date().toISOString(),
  });
}
